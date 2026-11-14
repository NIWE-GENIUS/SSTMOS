// backend/src/services/userService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { hashPassword } = require('./password');
const { NotFound, Conflict, BadRequest } = require('../utils/errors');

const SCHOOL_ROLES = ['dos', 'head_teacher', 'deputy_head_teacher', 'trainer', 'student'];

/**
 * Create a school-scoped user (DOS, teacher, trainer, student, etc.).
 * Runs inside the target school's tenant context.
 *
 * @param {string} schoolId
 * @param {object} data       - validated { email, fullName, password, role, username?, phone? }
 * @param {string} actorId    - user performing the action
 * @param {object} options    - { isPlatformAdmin: bool } when called by a platform admin
 */
async function createSchoolUser(schoolId, data, actorId, { isPlatformAdmin = false } = {}) {
    const passwordHash = await hashPassword(data.password);
    const username = data.username || data.email.split('@')[0];

    return await withTenantContext(
        { schoolId, userId: actorId, isPlatformAdmin },
        async (client) => {
            // Duplicate email check (inside tenant context so RLS lets us see this school's users)
            const exists = await client.query(
                `SELECT id FROM users
                 WHERE school_id = $1 AND email = $2 AND deleted_at IS NULL
                 LIMIT 1`,
                [schoolId, data.email]
            );
            if (exists.rows.length > 0) {
                throw new Conflict('Email already in use in this school');
            }

            // Insert user
            const r = await client.query(
                `INSERT INTO users
                    (school_id, user_type, email, username, password_hash, full_name, phone, status)
                 VALUES ($1, 'school', $2, $3, $4, $5, $6, 'active')
                 RETURNING id, email, username, full_name, status`,
                [schoolId, data.email, username, passwordHash, data.fullName, data.phone]
            );
            const user = r.rows[0];

            // Resolve role
            const role = await client.query(
                `SELECT id FROM roles
                 WHERE code = $1 AND (school_id IS NULL OR school_id = $2)
                 LIMIT 1`,
                [data.role, schoolId]
            );
            if (role.rows.length === 0) {
                throw new BadRequest(`Unknown role: ${data.role}`);
            }

            await client.query(
                `INSERT INTO user_roles (user_id, role_id, assigned_by)
                 VALUES ($1, $2, $3)`,
                [user.id, role.rows[0].id, actorId]
            );

            // Audit
            await client.query(
                `INSERT INTO school_audit_logs
                    (school_id, user_id, action, entity_type, entity_id, new_value)
                 VALUES ($1, $2, 'create', 'user', $3, $4)`,
                [schoolId, actorId, user.id, JSON.stringify({ email: user.email, role: data.role })]
            );

            return { ...user, role: data.role };
        }
    );
}

async function listSchoolUsers(schoolId) {
    return await withTenantContext(
        { schoolId, userId: null },
        async (client) => {
            const r = await client.query(
                `SELECT u.id, u.email, u.username, u.full_name, u.phone, u.status, u.last_login_at,
                        array_agg(r.code) AS roles
                 FROM users u
                 LEFT JOIN user_roles ur ON ur.user_id = u.id
                 LEFT JOIN roles r ON r.id = ur.role_id
                 WHERE u.school_id = $1 AND u.deleted_at IS NULL
                 GROUP BY u.id
                 ORDER BY u.created_at DESC`,
                [schoolId]
            );
            return r.rows;
        }
    );
}

async function deactivateUser(schoolId, userId, actorId) {
    return await withTenantContext(
        { schoolId, userId: actorId },
        async (client) => {
            const r = await client.query(
                `UPDATE users
                 SET status = 'deactivated', deleted_at = now(), updated_at = now()
                 WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
                 RETURNING id`,
                [userId, schoolId]
            );
            if (r.rows.length === 0) throw new NotFound('User not found');

            await client.query(
                `INSERT INTO school_audit_logs
                    (school_id, user_id, action, entity_type, entity_id)
                 VALUES ($1, $2, 'deactivate', 'user', $3)`,
                [schoolId, actorId, userId]
            );

            return { id: userId, status: 'deactivated' };
        }
    );
}

/**
 * Onboard the first DOS for a school.
 * Runs entirely inside the platform-admin tenant context so the school lookup
 * (RLS-protected) succeeds, then delegates user creation to createSchoolUser.
 */
async function onboardFirstDOS(schoolId, data, platformAdminId) {
    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            // 1. Verify the school exists and is active
            const school = await client.query(
                `SELECT id, status FROM schools
                 WHERE id = $1 AND deleted_at IS NULL`,
                [schoolId]
            );
            if (school.rows.length === 0) throw new NotFound('School not found');
            if (school.rows[0].status !== 'active') {
                throw new Conflict('School must be activated before onboarding DOS');
            }

            // 2. Ensure no DOS already exists for this school
            const existingDos = await client.query(
                `SELECT u.id
                 FROM users u
                 JOIN user_roles ur ON ur.user_id = u.id
                 JOIN roles r ON r.id = ur.role_id
                 WHERE u.school_id = $1
                   AND r.code = 'dos'
                   AND u.deleted_at IS NULL
                 LIMIT 1`,
                [schoolId]
            );
            if (existingDos.rows.length > 0) {
                throw new Conflict('DOS already exists for this school');
            }
        }
    )
        // 3. Create the user with the DOS role, using platform-admin privilege
        .then(() =>
            createSchoolUser(schoolId, { ...data, role: 'dos' }, platformAdminId, {
                isPlatformAdmin: true,
            })
        );
}

module.exports = {
    createSchoolUser,
    listSchoolUsers,
    deactivateUser,
    onboardFirstDOS,
    SCHOOL_ROLES,
};