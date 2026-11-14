// backend/src/services/schoolService.js
'use strict';

const { rawQuery, withTenantContext } = require('../config/db');
const { NotFound, Conflict, BadRequest } = require('../utils/errors');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateSchoolCode(client) {
    const year = new Date().getFullYear();
    const prefix = `SCH-${year}-`;
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [prefix]);
    const r = await client.query(
        `SELECT code FROM schools WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
        [`${prefix}%`]
    );
    let next = 1;
    if (r.rows.length > 0) {
        const last = parseInt(r.rows[0].code.split('-')[2], 10);
        next = last + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
}

function toColumnName(camel) {
    return camel.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

async function createSchool(data, platformAdminId) {
    const existing = await rawQuery(
        `SELECT id FROM schools WHERE short_code = $1 OR official_email = $2 LIMIT 1`,
        [data.shortCode, data.officialEmail]
    );
    if (existing.rows.length > 0) {
        throw new Conflict('A school with this short code or official email already exists');
    }

    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const code = await generateSchoolCode(client);

            const r = await client.query(
                `INSERT INTO schools
                    (code, short_code, name, school_type, country, province, district,
                     physical_address, official_email, telephone, status, created_by, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12)
                 RETURNING id, code, short_code, name, school_type, country, province, district,
                           physical_address, official_email, telephone, status,
                           registration_date, created_at`,
                [
                    code, data.shortCode, data.name, data.schoolType, data.country,
                    data.province, data.district, data.physicalAddress,
                    data.officialEmail, data.telephone, platformAdminId, data.notes,
                ]
            );

            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, 'create', 'school', $2, $3)`,
                [
                    platformAdminId,
                    r.rows[0].id,
                    JSON.stringify({ code: r.rows[0].code, name: r.rows[0].name }),
                ]
            );

            return r.rows[0];
        }
    );
}

async function listSchools({ page, pageSize, offset, status, search }) {
    return await withTenantContext(
        { schoolId: null, userId: null, isPlatformAdmin: true },
        async (client) => {
            const conditions = ['deleted_at IS NULL'];
            const params = [];
            let i = 1;

            if (status) {
                conditions.push(`status = $${i++}`);
                params.push(status);
            }
            if (search) {
                conditions.push(`(name ILIKE $${i} OR short_code ILIKE $${i} OR code ILIKE $${i})`);
                params.push(`%${search}%`);
                i++;
            }

            const where = `WHERE ${conditions.join(' AND ')}`;

            const countRes = await client.query(
                `SELECT count(*)::int AS total FROM schools ${where}`,
                params
            );
            const total = countRes.rows[0].total;

            const listRes = await client.query(
                `SELECT id, code, short_code, name, school_type, country, status,
                        registration_date, activated_at, created_at
                 FROM schools ${where}
                 ORDER BY created_at DESC
                 LIMIT $${i++} OFFSET $${i++}`,
                [...params, pageSize, offset]
            );

            return {
                data: listRes.rows,
                pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
            };
        }
    );
}

async function getSchoolById(id, platformAdminId) {
    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const schoolRes = await client.query(
                `SELECT * FROM schools WHERE id = $1 AND deleted_at IS NULL`,
                [id]
            );
            if (schoolRes.rows.length === 0) throw new NotFound('School not found');

            const subRes = await client.query(
                `SELECT activation_date, expiration_date, grace_period_until, status,
                        remaining_days_cached, last_recomputed_at
                 FROM school_subscriptions WHERE school_id = $1 LIMIT 1`,
                [id]
            );

            const contactRes = await client.query(
                `SELECT contact_type, full_name, email, phone, is_primary
                 FROM school_contacts WHERE school_id = $1
                 ORDER BY is_primary DESC, contact_type`,
                [id]
            );

            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id)
                 VALUES ($1, $2, 'view', 'school', $2)`,
                [platformAdminId, id]
            );

            return {
                ...schoolRes.rows[0],
                subscription: subRes.rows[0] || null,
                contacts: contactRes.rows,
            };
        }
    );
}

async function updateSchool(id, update, platformAdminId) {
    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const existing = await client.query(
                `SELECT id, status FROM schools WHERE id = $1 AND deleted_at IS NULL`,
                [id]
            );
            if (existing.rows.length === 0) throw new NotFound('School not found');
            if (existing.rows[0].status === 'deactivated') {
                throw new Conflict('Cannot modify a deactivated school');
            }

            const fields = Object.keys(update);
            const params = [id];
            const setClauses = [];
            for (let i = 0; i < fields.length; i++) {
                setClauses.push(`${toColumnName(fields[i])} = $${i + 2}`);
                params.push(update[fields[i]]);
            }

            const r = await client.query(
                `UPDATE schools SET ${setClauses.join(', ')}, updated_at = now()
                 WHERE id = $1
                 RETURNING id, code, short_code, name, school_type, country, province, district,
                           physical_address, official_email, telephone, status, updated_at`,
                params
            );

            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, 'update', 'school', $2, $3)`,
                [platformAdminId, id, JSON.stringify({ changed: fields })]
            );

            return r.rows[0];
        }
    );
}

// ---------------------------------------------------------------------------
// Lifecycle: activate / suspend / deactivate / renew / getSubscription
// ---------------------------------------------------------------------------

async function activateSchool(id, { activationDate, expirationDate, gracePeriodUntil, servicePlanId, agreementReference }, platformAdminId) {
    if (!activationDate || !expirationDate) {
        throw new BadRequest('activationDate and expirationDate are required');
    }
    const act = new Date(activationDate);
    const exp = new Date(expirationDate);
    if (exp <= act) throw new BadRequest('expirationDate must be after activationDate');

    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const s = await client.query(
                `SELECT id, status FROM schools WHERE id = $1 AND deleted_at IS NULL`,
                [id]
            );
            if (s.rows.length === 0) throw new NotFound('School not found');
            if (s.rows[0].status !== 'pending') {
                throw new Conflict(`School is already ${s.rows[0].status}`);
            }

            await client.query(
                `UPDATE schools SET status = 'active', activated_at = now(), updated_at = now() WHERE id = $1`,
                [id]
            );

            let agreementId = null;
            if (servicePlanId) {
                const a = await client.query(
                    `INSERT INTO school_agreements
                        (school_id, service_plan_id, agreement_reference, agreement_start_date, agreement_end_date)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [id, servicePlanId, agreementReference || `AGR-${Date.now()}`, activationDate, expirationDate]
                );
                agreementId = a.rows[0].id;
            }

            const existing = await client.query(
                `SELECT id FROM school_subscriptions WHERE school_id = $1`,
                [id]
            );
            let subId;
            if (existing.rows.length === 0) {
                const sub = await client.query(
                    `INSERT INTO school_subscriptions
                        (school_id, current_agreement_id, activation_date, expiration_date, grace_period_until, status)
                     VALUES ($1, $2, $3, $4, $5, 'active')
                     RETURNING id`,
                    [id, agreementId, activationDate, expirationDate, gracePeriodUntil || null]
                );
                subId = sub.rows[0].id;
            } else {
                subId = existing.rows[0].id;
                await client.query(
                    `UPDATE school_subscriptions
                     SET activation_date = $1, expiration_date = $2, grace_period_until = $3,
                         current_agreement_id = $4, status = 'active', updated_at = now()
                     WHERE id = $5`,
                    [activationDate, expirationDate, gracePeriodUntil || null, agreementId, subId]
                );
            }

            await client.query(
                `INSERT INTO subscription_history
                    (school_id, subscription_id, event_type, performed_by, new_state)
                 VALUES ($1, $2, 'activated', $3, $4)`,
                [id, subId, platformAdminId, JSON.stringify({ activationDate, expirationDate })]
            );

            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id)
                 VALUES ($1, $2, 'activate', 'school', $2)`,
                [platformAdminId, id]
            );

            return { id, status: 'active', subscriptionId: subId, agreementId };
        }
    );
}

async function suspendSchool(id, reason, platformAdminId) {
    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const s = await client.query(
                `SELECT id, status FROM schools WHERE id = $1 AND deleted_at IS NULL`,
                [id]
            );
            if (s.rows.length === 0) throw new NotFound('School not found');
            if (s.rows[0].status === 'suspended') throw new Conflict('Already suspended');
            if (s.rows[0].status === 'deactivated') throw new Conflict('School is deactivated');

            await client.query(
                `UPDATE schools SET status = 'suspended', updated_at = now() WHERE id = $1`,
                [id]
            );
            await client.query(
                `UPDATE school_subscriptions SET status = 'suspended', updated_at = now() WHERE school_id = $1`,
                [id]
            );
            await client.query(
                `INSERT INTO subscription_history
                    (school_id, subscription_id, event_type, performed_by, reason)
                 SELECT $1, id, 'suspended', $2, $3 FROM school_subscriptions WHERE school_id = $1`,
                [id, platformAdminId, reason || null]
            );
            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, 'suspend', 'school', $2, $3)`,
                [platformAdminId, id, JSON.stringify({ reason })]
            );

            return { id, status: 'suspended' };
        }
    );
}

async function deactivateSchool(id, reason, platformAdminId) {
    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const s = await client.query(
                `SELECT id, status FROM schools WHERE id = $1 AND deleted_at IS NULL`,
                [id]
            );
            if (s.rows.length === 0) throw new NotFound('School not found');
            if (s.rows[0].status === 'deactivated') throw new Conflict('School is already deactivated');

            await client.query(
                `UPDATE schools
                 SET status = 'deactivated', deactivated_at = now(), updated_at = now()
                 WHERE id = $1`,
                [id]
            );
            await client.query(
                `UPDATE school_subscriptions SET status = 'deactivated', updated_at = now() WHERE school_id = $1`,
                [id]
            );
            await client.query(
                `INSERT INTO subscription_history
                    (school_id, subscription_id, event_type, performed_by, reason)
                 SELECT $1, id, 'deactivated', $2, $3 FROM school_subscriptions WHERE school_id = $1`,
                [id, platformAdminId, reason || null]
            );
            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, 'deactivate', 'school', $2, $3)`,
                [platformAdminId, id, JSON.stringify({ reason })]
            );

            return { id, status: 'deactivated' };
        }
    );
}

async function renewSubscription(id, { newExpirationDate, servicePlanId, agreementReference }, platformAdminId) {
    if (!newExpirationDate) throw new BadRequest('newExpirationDate is required');

    return await withTenantContext(
        { schoolId: null, userId: platformAdminId, isPlatformAdmin: true },
        async (client) => {
            const s = await client.query(
                `SELECT s.id, s.status, ss.id AS sub_id, ss.expiration_date
                 FROM schools s
                 LEFT JOIN school_subscriptions ss ON ss.school_id = s.id
                 WHERE s.id = $1 AND s.deleted_at IS NULL`,
                [id]
            );
            if (s.rows.length === 0) throw new NotFound('School not found');
            const row = s.rows[0];
            if (!row.sub_id) throw new Conflict('School has no active subscription — activate first');

            const newExp = new Date(newExpirationDate);
            if (newExp <= new Date(row.expiration_date)) {
                throw new BadRequest('newExpirationDate must be later than current expiration');
            }

            let agreementId = null;
            if (servicePlanId) {
                const a = await client.query(
                    `INSERT INTO school_agreements
                        (school_id, service_plan_id, agreement_reference, agreement_start_date, agreement_end_date)
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [id, servicePlanId, agreementReference || `AGR-${Date.now()}`, row.expiration_date, newExpirationDate]
                );
                agreementId = a.rows[0].id;
            }

            await client.query(
                `UPDATE school_subscriptions
                 SET expiration_date = $1, status = 'active',
                     current_agreement_id = COALESCE($2, current_agreement_id),
                     updated_at = now()
                 WHERE id = $3`,
                [newExpirationDate, agreementId, row.sub_id]
            );
            await client.query(
                `UPDATE schools SET status = 'active', updated_at = now()
                 WHERE id = $1 AND status IN ('expired','suspended')`,
                [id]
            );
            await client.query(
                `INSERT INTO subscription_history
                    (school_id, subscription_id, event_type, performed_by, previous_state, new_state)
                 VALUES ($1, $2, 'renewed', $3, $4, $5)`,
                [
                    id, row.sub_id, platformAdminId,
                    JSON.stringify({ expiration_date: row.expiration_date }),
                    JSON.stringify({ expiration_date: newExpirationDate }),
                ]
            );
            await client.query(
                `INSERT INTO platform_audit_logs
                    (platform_admin_id, target_school_id, action, entity_type, entity_id)
                 VALUES ($1, $2, 'renew', 'school', $2)`,
                [platformAdminId, id]
            );

            return { id, status: 'active', newExpirationDate };
        }
    );
}

async function getSubscription(id) {
    return await withTenantContext(
        { schoolId: null, userId: null, isPlatformAdmin: true },
        async (client) => {
            const r = await client.query(
                `SELECT ss.*, sa.agreement_reference, sa.agreement_start_date, sa.agreement_end_date,
                        sp.name AS plan_name, sp.duration_months
                 FROM school_subscriptions ss
                 LEFT JOIN school_agreements sa ON sa.id = ss.current_agreement_id
                 LEFT JOIN service_plans sp ON sp.id = sa.service_plan_id
                 WHERE ss.school_id = $1 LIMIT 1`,
                [id]
            );
            if (r.rows.length === 0) throw new NotFound('No subscription for this school');

            const history = await client.query(
                `SELECT event_type, event_at, reason FROM subscription_history
                 WHERE school_id = $1 ORDER BY event_at DESC LIMIT 20`,
                [id]
            );

            return { subscription: r.rows[0], history: history.rows };
        }
    );
}

module.exports = {
    createSchool,
    listSchools,
    getSchoolById,
    updateSchool,
    activateSchool,
    suspendSchool,
    deactivateSchool,
    renewSubscription,
    getSubscription,
};