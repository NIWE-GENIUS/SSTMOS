'use strict';
const { withTenantContext } = require('../config/db');
const { NotFound } = require('../utils/errors');

async function assignTeacher(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        // Remove existing assignment for this class/year/term to ensure only one active
        await client.query(
            `DELETE FROM class_teacher_assignments WHERE school_id = $1 AND class_id = $2 AND academic_year_id = $3 AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($4::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
            [schoolId, data.classId, data.academicYearId, data.termId || null]
        );
        
        const r = await client.query(
            `INSERT INTO class_teacher_assignments (school_id, class_id, trainer_id, academic_year_id, term_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [schoolId, data.classId, data.trainerId, data.academicYearId, data.termId || null]
        );
        return r.rows[0];
    });
}

async function listAssignments(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT cta.*, c.name AS class_name, t.full_name AS trainer_name, ay.name AS year_name
             FROM class_teacher_assignments cta
             JOIN classes c ON c.id = cta.class_id
             JOIN trainers t ON t.id = cta.trainer_id
             JOIN academic_years ay ON ay.id = cta.academic_year_id
             WHERE cta.school_id = $1 ORDER BY c.name`,
            [schoolId]
        );
        return r.rows;
    });
}

module.exports = { assignTeacher, listAssignments };