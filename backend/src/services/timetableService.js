// backend/src/services/timetableService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest, Conflict } = require('../utils/errors');

/**
 * Creates a new draft timetable version.
 * Validates IDs and handles term auto-resolution.
 */
async function createVersion(schoolId, actorId, data) {
    const { academicYearId, timetableFormatId, changeDescription } = data || {};
    let { termId } = data || {};

    if (!academicYearId) throw new BadRequest('academicYearId is required');
    if (!timetableFormatId) throw new BadRequest('timetableFormatId is required');

    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        // Verify year and format exist in this school
        const yearCheck = await client.query(`SELECT id FROM academic_years WHERE id = $1 AND school_id = $2`, [academicYearId, schoolId]);
        if (yearCheck.rows.length === 0) throw new NotFound('Academic year not found');
        
        const formatCheck = await client.query(`SELECT id FROM timetable_formats WHERE id = $1 AND school_id = $2`, [timetableFormatId, schoolId]);
        if (formatCheck.rows.length === 0) throw new NotFound('Timetable format not found');

        if (!termId) {
            const activeTerm = await client.query(`SELECT id FROM terms WHERE school_id = $1 AND academic_year_id = $2 AND is_active = true LIMIT 1`, [schoolId, academicYearId]);
            if (activeTerm.rows.length > 0) termId = activeTerm.rows[0].id;
        }

        // Advisory lock to prevent concurrent version number collisions
        await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || ':' || $2 || ':' || COALESCE($3::text, '')))`, [schoolId, academicYearId, termId || '']);

        const maxRes = await client.query(
            `SELECT COALESCE(MAX(version_number), 0) AS m FROM timetable_versions
             WHERE school_id = $1 AND academic_year_id = $2 AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
            [schoolId, academicYearId, termId || null]
        );
        const nextNumber = maxRes.rows[0].m + 1;

        const inserted = await client.query(
            `INSERT INTO timetable_versions (school_id, academic_year_id, term_id, timetable_format_id, version_number, status, change_description, created_by)
             VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7) RETURNING *`,
            [schoolId, academicYearId, termId || null, timetableFormatId, nextNumber, changeDescription || null, actorId]
        );

        return inserted.rows[0];
    });
}

async function listVersions(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT tv.*, u.full_name AS creator FROM timetable_versions tv
             LEFT JOIN users u ON u.id = tv.created_by WHERE tv.school_id = $1 ORDER BY tv.created_at DESC`,
            [schoolId]
        );
        return r.rows;
    });
}

async function submitForApproval(schoolId, actorId, versionId) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `UPDATE timetable_versions SET status = 'pending_approval', submitted_at = now()
             WHERE id = $1 AND school_id = $2 AND status = 'draft' RETURNING id, status`,
            [versionId, schoolId]
        );
        if (!r.rows.length) throw new Conflict('Only draft versions can be submitted');
        return r.rows[0];
    });
}

async function approveVersion(schoolId, actorId, versionId, decision, comments) {
    if (!['approved', 'rejected'].includes(decision)) throw new BadRequest("decision must be 'approved' or 'rejected'");
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const v = await client.query(`SELECT id, status FROM timetable_versions WHERE id = $1 AND school_id = $2`, [versionId, schoolId]);
        if (!v.rows.length) throw new NotFound('Version not found');
        if (v.rows[0].status !== 'pending_approval') throw new Conflict('Version is not pending approval');

        const newStatus = decision === 'approved' ? 'approved' : 'draft';
        await client.query(
            `UPDATE timetable_versions SET status = $1, approved_at = CASE WHEN $1 = 'approved' THEN now() ELSE NULL END WHERE id = $2`,
            [newStatus, versionId]
        );
        await client.query(
            `INSERT INTO timetable_approvals (school_id, timetable_version_id, approver_id, decision, comments) VALUES ($1, $2, $3, $4, $5)`,
            [schoolId, versionId, actorId, decision, comments || null]
        );
        return { id: versionId, status: newStatus };
    });
}

async function publishVersion(schoolId, actorId, versionId) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const v = await client.query(`SELECT id, status, academic_year_id, term_id FROM timetable_versions WHERE id = $1 AND school_id = $2`, [versionId, schoolId]);
        if (!v.rows.length) throw new NotFound('Version not found');
        const row = v.rows[0];
        if (row.status !== 'approved') throw new Conflict('Only approved versions can be published');

        await client.query(
            `UPDATE timetable_versions SET status = 'superseded', archived_at = now()
             WHERE school_id = $1 AND academic_year_id = $2 AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid) AND status = 'published'`,
            [schoolId, row.academic_year_id, row.term_id]
        );
        await client.query(`UPDATE timetable_versions SET status = 'published', published_at = now() WHERE id = $1`, [versionId]);
        return { id: versionId, status: 'published' };
    });
}

// ---------------------------------------------------------------------------
// ANALYTICS & VIEWS
// ---------------------------------------------------------------------------

async function getTimetableAnalytics(schoolId, versionId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const util = await client.query(
            `SELECT count(e.id)::int AS used_slots,
                    (SELECT count(*)::int * 5 FROM classes WHERE school_id = $1) AS total_slots_possible,
                    count(DISTINCT e.trainer_id)::int AS active_trainers,
                    count(DISTINCT e.room_id)::int AS active_rooms
             FROM timetable_entries e WHERE e.timetable_version_id = $2 AND e.school_id = $1`,
            [schoolId, versionId]
        );
        return util.rows[0];
    });
}

async function listEntries(schoolId, versionId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT e.*, m.code AS module_code, m.name AS module_name, cl.name AS class_name, 
                    t.full_name AS trainer_name, r.name AS room_name, p.period_number, p.start_time, p.end_time, p.session_id
             FROM timetable_entries e
             JOIN module_assignments ma ON ma.id = e.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             JOIN classes cl ON cl.id = e.class_id
             JOIN trainers t ON t.id = e.trainer_id
             LEFT JOIN rooms r ON r.id = e.room_id
             JOIN timetable_periods p ON p.id = e.timetable_period_id
             WHERE e.timetable_version_id = $1 AND e.school_id = $2
             ORDER BY e.day_of_week, p.period_number, cl.name`,
            [versionId, schoolId]
        );
        return r.rows;
    });
}

async function getPublishedMaster(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT tv.id AS version_id, tv.version_number, e.day_of_week, p.period_number, p.start_time, p.end_time, p.session_id,
                    cl.name AS class_name, m.code AS module_code, m.name AS module_name, t.full_name AS trainer_name, r.name AS room_name
             FROM timetable_versions tv
             JOIN timetable_entries e ON e.timetable_version_id = tv.id
             JOIN timetable_periods p ON p.id = e.timetable_period_id
             JOIN classes cl ON cl.id = e.class_id
             JOIN module_assignments ma ON ma.id = e.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             JOIN trainers t ON t.id = e.trainer_id
             LEFT JOIN rooms r ON r.id = e.room_id
             WHERE tv.school_id = $1 AND tv.status = 'published'
             ORDER BY cl.name, e.day_of_week, p.period_number`,
            [schoolId]
        );
        return r.rows;
    });
}

async function getTrainerTimetable(trainerId) {
    return await withTenantContext({ schoolId: null, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT e.day_of_week, p.period_number, p.start_time, p.end_time, p.session_id,
                    cl.name AS class_name, m.code AS module_code, m.name AS module_name, r.name AS room_name
             FROM timetable_versions tv
             JOIN timetable_entries e ON e.timetable_version_id = tv.id
             JOIN timetable_periods p ON p.id = e.timetable_period_id
             JOIN classes cl ON cl.id = e.class_id
             JOIN module_assignments ma ON ma.id = e.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             LEFT JOIN rooms r ON r.id = e.room_id
             WHERE tv.status = 'published' AND e.trainer_id = $1
             ORDER BY e.day_of_week, p.period_number`,
            [trainerId]
        );
        return r.rows;
    });
}

async function getClassTimetable(schoolId, classId, academicYearId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const ctRes = await client.query(
            `SELECT t.full_name FROM class_teacher_assignments cta
             JOIN trainers t ON t.id = cta.trainer_id
             WHERE cta.class_id = $1 AND cta.academic_year_id = $2 LIMIT 1`,
            [classId, academicYearId]
        );
        const classTeacher = ctRes.rows[0]?.full_name || null;

        const r = await client.query(
            `SELECT e.day_of_week, p.period_number, p.start_time, p.end_time, p.session_id,
                    m.code AS module_code, m.name AS module_name, t.full_name AS trainer_name, r.name AS room_name
             FROM timetable_versions tv
             JOIN timetable_entries e ON e.timetable_version_id = tv.id
             JOIN timetable_periods p ON p.id = e.timetable_period_id
             JOIN module_assignments ma ON ma.id = e.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             JOIN trainers t ON t.id = e.trainer_id
             LEFT JOIN rooms r ON r.id = e.room_id
             WHERE tv.school_id = $1 AND tv.status = 'published' AND e.class_id = $2
             ORDER BY e.day_of_week, p.period_number`,
            [schoolId, classId]
        );
        return { classTeacher, entries: r.rows };
    });
}

module.exports = {
    createVersion, listVersions, submitForApproval, approveVersion, publishVersion,
    getTimetableAnalytics, listEntries, getPublishedMaster, getTrainerTimetable, getClassTimetable
};