// backend/src/services/marksService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest, Forbidden } = require('../utils/errors');

async function recordMark(schoolId, actorId, actorRoles, data) {
    const required = ['studentId', 'moduleAssignmentId', 'classId', 'academicYearId', 'assessmentType', 'score'];
    for (const f of required) if (data[f] === undefined || data[f] === null) throw new BadRequest(`${f} is required`);
    if (!['formative', 'summative', 'comprehensive'].includes(data.assessmentType)) {
        throw new BadRequest('assessmentType must be formative, summative, or comprehensive');
    }
    const max = data.maxScore || 100;
    if (data.score < 0 || data.score > max) throw new BadRequest('Score must be between 0 and maxScore');

    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        // Verify trainer is assigned to this module assignment (unless DOS/admin)
        const isPrivileged = actorRoles.includes('dos') || actorRoles.includes('head_teacher');
        if (!isPrivileged) {
            const check = await client.query(
                `SELECT ma.trainer_id, t.user_id
                 FROM module_assignments ma
                 LEFT JOIN trainers t ON t.id = ma.trainer_id
                 WHERE ma.id = $1 AND ma.school_id = $2`,
                [data.moduleAssignmentId, schoolId]
            );
            if (check.rows.length === 0) throw new NotFound('Module assignment not found');
            if (check.rows[0].user_id !== actorId) {
                throw new Forbidden('You can only record marks for your own module assignments');
            }
        }

        const r = await client.query(
            `INSERT INTO student_marks
                (school_id, student_id, module_assignment_id, class_id, academic_year_id, term_id,
                 assessment_type, assessment_name, score, max_score, recorded_by, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [schoolId, data.studentId, data.moduleAssignmentId, data.classId, data.academicYearId,
             data.termId || null, data.assessmentType, data.assessmentName || null,
             data.score, max, actorId, data.notes || null]
        );
        return r.rows[0];
    });
}

async function listMarksForClass(schoolId, classId, academicYearId, termId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const params = [schoolId, classId, academicYearId];
        let termClause = '';
        if (termId) { params.push(termId); termClause = 'AND sm.term_id = $4'; }
        const r = await client.query(
            `SELECT sm.*,
                    s.first_name, s.last_name, s.student_number,
                    m.code AS module_code, m.name AS module_name,
                    t.full_name AS trainer_name
             FROM student_marks sm
             JOIN students s ON s.id = sm.student_id
             JOIN module_assignments ma ON ma.id = sm.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             LEFT JOIN trainers t ON t.id = ma.trainer_id
             WHERE sm.school_id = $1 AND sm.class_id = $2 AND sm.academic_year_id = $3 ${termClause}
             ORDER BY s.last_name, s.first_name, m.code, sm.assessment_type`,
            params
        );
        return r.rows;
    });
}

async function listMarksForStudent(schoolId, studentId, academicYearId, termId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const params = [schoolId, studentId, academicYearId];
        let termClause = '';
        if (termId) { params.push(termId); termClause = 'AND sm.term_id = $4'; }
        const r = await client.query(
            `SELECT sm.*,
                    m.code AS module_code, m.name AS module_name,
                    t.full_name AS trainer_name
             FROM student_marks sm
             JOIN module_assignments ma ON ma.id = sm.module_assignment_id
             JOIN modules m ON m.id = ma.module_id
             LEFT JOIN trainers t ON t.id = ma.trainer_id
             WHERE sm.school_id = $1 AND sm.student_id = $2 AND sm.academic_year_id = $3 ${termClause}
             ORDER BY m.code, sm.assessment_type`,
            params
        );
        return r.rows;
    });
}

async function updateMark(schoolId, actorId, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const allowed = ['score', 'max_score', 'assessment_name', 'notes'];
        const fields = Object.keys(data).filter((k) => allowed.includes(k));
        if (fields.length === 0) throw new BadRequest('No valid fields to update');
        const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const r = await client.query(
            `UPDATE student_marks SET ${sets}
             WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, schoolId, ...fields.map((f) => data[f])]
        );
        if (r.rows.length === 0) throw new NotFound('Mark not found');
        return r.rows[0];
    });
}

async function deleteMark(schoolId, actorId, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `DELETE FROM student_marks WHERE id = $1 AND school_id = $2 RETURNING id`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Mark not found');
        return { id, deleted: true };
    });
}

async function getClassAssessmentOverview(schoolId, classId, academicYearId, termId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const params = [schoolId, classId, academicYearId];
        let termClause = '';
        if (termId) { params.push(termId); termClause = 'AND sm.term_id = $4'; }
        const r = await client.query(
            `SELECT
                m.id AS module_id, m.code AS module_code, m.name AS module_name,
                count(DISTINCT sm.student_id)::int AS students_marked,
                count(sm.id)::int AS total_marks,
                count(sm.id) FILTER (WHERE sm.assessment_type = 'formative')::int AS formative_count,
                count(sm.id) FILTER (WHERE sm.assessment_type = 'summative')::int AS summative_count,
                count(sm.id) FILTER (WHERE sm.assessment_type = 'comprehensive')::int AS comprehensive_count,
                round(avg(sm.score * 100.0 / sm.max_score)::numeric, 2) AS avg_percentage
             FROM module_assignments ma
             JOIN modules m ON m.id = ma.module_id
             LEFT JOIN student_marks sm ON sm.module_assignment_id = ma.id
                                       AND sm.school_id = $1
                                       AND sm.class_id = $2
                                       AND sm.academic_year_id = $3
                                       ${termClause}
             WHERE ma.school_id = $1 AND ma.class_id = $2 AND ma.academic_year_id = $3
             GROUP BY m.id, m.code, m.name
             ORDER BY m.code`,
            params
        );
        return r.rows;
    });
}

module.exports = {
    recordMark, listMarksForClass, listMarksForStudent,
    updateMark, deleteMark, getClassAssessmentOverview,
};