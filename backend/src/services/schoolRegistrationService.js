// backend/src/services/schoolRegistrationService.js
'use strict';

const { rawQuery, withTenantContext } = require('../config/db');
const { hashPassword } = require('./password');
const emailService = require('./emailService');
const { BadRequest, Conflict, NotFound } = require('../utils/errors');
const logger = require('../utils/logger');

async function generateReference() {
    const year = new Date().getFullYear();
    const res = await rawQuery(
        `SELECT reference_number FROM school_registration_requests
         WHERE reference_number LIKE $1 ORDER BY reference_number DESC LIMIT 1`,
        [`REG-${year}-%`]
    );
    let next = 1;
    if (res.rows.length > 0) {
        next = parseInt(res.rows[0].reference_number.split('-')[2], 10) + 1;
    }
    return `REG-${year}-${String(next).padStart(4, '0')}`;
}

async function submitRegistration(data, req) {
    const required = ['schoolName', 'schoolType', 'country', 'officialEmail',
                      'contactFullName', 'contactEmail', 'password'];
    for (const f of required) {
        if (!data[f]) throw new BadRequest(`${f} is required`);
    }
    if (data.password.length < 8) throw new BadRequest('Password must be at least 8 characters');
    if (!data.contactEmail.includes('@') || !data.officialEmail.includes('@')) {
        throw new BadRequest('Invalid email address');
    }

    // Check duplicate
    const dupe = await rawQuery(
        `SELECT id FROM school_registration_requests
         WHERE official_email = $1 AND status IN ('pending','approved') LIMIT 1`,
        [data.officialEmail.toLowerCase().trim()]
    );
    if (dupe.rows.length > 0) {
        throw new Conflict('A registration request already exists for this email');
    }
    const existingSchool = await rawQuery(
        `SELECT id FROM schools WHERE official_email = $1 LIMIT 1`,
        [data.officialEmail.toLowerCase().trim()]
    );
    if (existingSchool.rows.length > 0) {
        throw new Conflict('A school with this email is already registered');
    }

    const reference = await generateReference();
    const passwordHash = await hashPassword(data.password);

    const insert = await rawQuery(
        `INSERT INTO school_registration_requests
            (reference_number, school_name, school_type, country, province, district,
             physical_address, official_email, telephone,
             contact_full_name, contact_email, contact_phone, contact_role,
             password_hash, visitor_ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING id, reference_number, created_at`,
        [
            reference,
            data.schoolName.trim(),
            data.schoolType,
            data.country,
            data.province || null,
            data.district || null,
            data.physicalAddress || null,
            data.officialEmail.toLowerCase().trim(),
            data.telephone || null,
            data.contactFullName.trim(),
            data.contactEmail.toLowerCase().trim(),
            data.contactPhone || null,
            data.contactRole || null,
            passwordHash,
            req.ip,
            req.headers['user-agent'] || null,
        ]
    );

    // Fire-and-forget notifications
    emailService.sendSchoolRegistrationNotification({
        schoolName: data.schoolName,
        contactName: data.contactFullName,
        contactEmail: data.contactEmail,
        country: data.country,
        notes: `Reference: ${reference}\nPhone: ${data.telephone || 'N/A'}\nRole: ${data.contactRole || 'N/A'}`,
    }).catch((err) => logger.error('School reg notification failed', { error: err.message }));

    return {
        referenceNumber: reference,
        message: 'Your registration request has been submitted. We will contact you after review.',
    };
}

async function listRequests({ status, search, page = 1, pageSize = 20 }) {
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (search) {
        conditions.push(`(school_name ILIKE $${i} OR contact_email ILIKE $${i} OR official_email ILIKE $${i} OR reference_number ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const countRes = await rawQuery(`SELECT count(*)::int AS total FROM school_registration_requests ${where}`, params);
    const listRes = await rawQuery(
        `SELECT id, reference_number, school_name, school_type, country, official_email,
                contact_full_name, contact_email, contact_phone, status, created_at
         FROM school_registration_requests ${where}
         ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
        [...params, pageSize, offset]
    );
    return {
        data: listRes.rows,
        pagination: { page, pageSize, total: countRes.rows[0].total, totalPages: Math.ceil(countRes.rows[0].total / pageSize) },
    };
}

async function getRequest(id) {
    const res = await rawQuery(`SELECT * FROM school_registration_requests WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new NotFound('Registration not found');
    return res.rows[0];
}

async function approveRequest({ requestId, adminUserId, adminOverrides = {} }) {
    const reqRes = await rawQuery(
        `SELECT * FROM school_registration_requests WHERE id = $1 AND status = 'pending'`,
        [requestId]
    );
    if (reqRes.rows.length === 0) throw new NotFound('Pending request not found');
    const request = reqRes.rows[0];

    return await withTenantContext({ schoolId: null, userId: adminUserId, isPlatformAdmin: true }, async (client) => {
        // 1. Create school
        const year = new Date().getFullYear();
        const codeRes = await client.query(
            `SELECT code FROM schools WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
            [`SCH-${year}-%`]
        );
        let nextNum = 1;
        if (codeRes.rows.length > 0) {
            nextNum = parseInt(codeRes.rows[0].code.split('-')[2], 10) + 1;
        }
        const schoolCode = `SCH-${year}-${String(nextNum).padStart(4, '0')}`;
        const shortCode = (adminOverrides.shortCode || request.school_name.replace(/[^A-Z]/gi, '').slice(0, 6).toUpperCase() || `SCH${nextNum}`);

        const schoolInsert = await client.query(
            `INSERT INTO schools
                (code, short_code, name, school_type, country, province, district,
                 physical_address, official_email, telephone, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)
             RETURNING id`,
            [
                schoolCode, shortCode, request.school_name, request.school_type,
                request.country, request.province, request.district,
                request.physical_address, request.official_email, request.telephone,
                adminUserId,
            ]
        );
        const schoolId = schoolInsert.rows[0].id;

        // 2. Create the DOS user
        const userInsert = await client.query(
            `INSERT INTO users
                (school_id, user_type, email, username, password_hash, full_name, phone, status, email_verified)
             VALUES ($1,'school',$2,$3,$4,$5,$6,'active',true)
             RETURNING id`,
            [
                schoolId,
                request.contact_email,
                request.contact_email.split('@')[0],
                request.password_hash,
                request.contact_full_name,
                request.contact_phone,
            ]
        );
        const dosUserId = userInsert.rows[0].id;

        // 3. Assign DOS role
        await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             SELECT $1, id FROM roles WHERE code = 'dos' AND is_system = true LIMIT 1`,
            [dosUserId]
        );

        // 4. Create active subscription (12 months)
        const activationDate = new Date().toISOString().slice(0, 10);
        const expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        await client.query(
            `INSERT INTO school_subscriptions
                (school_id, activation_date, expiration_date, status)
             VALUES ($1,$2,$3,'active')`,
            [schoolId, activationDate, expDate]
        );

        // 5. Mark request approved
        await client.query(
            `UPDATE school_registration_requests
             SET status = 'approved', approved_by = $1, approved_at = now(),
                 created_school_id = $2, updated_at = now()
             WHERE id = $3`,
            [adminUserId, schoolId, requestId]
        );

        // 6. Audit
        await client.query(
            `INSERT INTO platform_audit_logs
                (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
             VALUES ($1,$2,'create','school',$2,$3)`,
            [adminUserId, schoolId, JSON.stringify({ source: 'registration_approval', requestId })]
        );

        // 7. Fire welcome email (non-blocking)
        emailService.sendWelcomeEmail({
            toName: request.contact_full_name,
            toEmail: request.contact_email,
            schoolName: request.school_name,
        }).catch((err) => logger.error('Welcome email failed', { error: err.message }));

        return {
            schoolId,
            schoolCode,
            dosUserId,
            email: request.contact_email,
        };
    });
}

async function rejectRequest({ requestId, adminUserId, reason }) {
    const res = await rawQuery(
        `UPDATE school_registration_requests
         SET status = 'rejected', approved_by = $1, approved_at = now(),
             rejected_reason = $2, updated_at = now()
         WHERE id = $3 AND status = 'pending'
         RETURNING id, contact_email, school_name`,
        [adminUserId, reason || null, requestId]
    );
    if (res.rows.length === 0) throw new NotFound('Pending request not found');
    return res.rows[0];
}

async function getStats() {
    const res = await rawQuery(`
        SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE status = 'pending')::int AS pending,
            count(*) FILTER (WHERE status = 'approved')::int AS approved,
            count(*) FILTER (WHERE status = 'rejected')::int AS rejected
        FROM school_registration_requests
    `);
    return res.rows[0];
}

module.exports = { submitRegistration, listRequests, getRequest, approveRequest, rejectRequest, getStats };