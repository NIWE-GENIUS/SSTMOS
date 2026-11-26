// backend/src/services/reportCardService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest, Conflict } = require('../utils/errors');

function computeGrade(percent) {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 75) return 'B+';
    if (percent >= 70) return 'B';
    if (percent >= 65) return 'C+';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    if (percent >= 40) return 'E';
    return 'F';
}

async function buildReportData(client, schoolId, studentId, classId, academicYearId, termId) {
    const termClause = termId ? 'AND sm.term_id = $5' : '';
    const params = [schoolId, studentId, classId, academicYearId];
    if (termId) params.push(termId);

    const marksRes = await client.query(
        `SELECT sm.assessment_type, sm.assessment_name, sm.score, sm.max_score,
                m.id AS module_id, m.code AS module_code, m.name AS module_name
         FROM student_marks sm
         JOIN module_assignments ma ON ma.id = sm.module_assignment_id
         JOIN modules m ON m.id = ma.module_id
         WHERE sm.school_id = $1 AND sm.student_id = $2
           AND sm.class_id = $3 AND sm.academic_year_id = $4 ${termClause}`,
        params
    );

    const moduleMap = {};
    for (const row of marksRes.rows) {
        const key = row.module_id;
        if (!moduleMap[key]) {
            moduleMap[key] = {
                moduleId: row.module_id,
                moduleCode: row.module_code,
                moduleName: row.module_name,
                formative: [],
                summative: [],
                comprehensive: [],
            };
        }
        moduleMap[key][row.assessment_type].push({
            name: row.assessment_name,
            score: Number(row.score),
            maxScore: Number(row.max_score),
            percentage: (Number(row.score) / Number(row.max_score)) * 100,
        });
    }

    // Get weights
    const weightsRes = await client.query(
        `SELECT assessment_type, weight_percent FROM assessment_config
         WHERE school_id = $1 AND academic_year_id = $2
           AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid)
             = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
        [schoolId, academicYearId, termId]
    );
    const weights = { formative: 40, summative: 40, comprehensive: 20 };
    for (const w of weightsRes.rows) weights[w.assessment_type] = Number(w.weight_percent);

    const modules = Object.values(moduleMap).map((m) => {
        const avg = (arr) => arr.length === 0 ? null : arr.reduce((s, x) => s + x.percentage, 0) / arr.length;
        const f = avg(m.formative);
        const s = avg(m.summative);
        const c = avg(m.comprehensive);

        let weightedTotal = 0;
        let totalWeight = 0;
        if (f !== null) { weightedTotal += f * weights.formative; totalWeight += weights.formative; }
        if (s !== null) { weightedTotal += s * weights.summative; totalWeight += weights.summative; }
        if (c !== null) { weightedTotal += c * weights.comprehensive; totalWeight += weights.comprehensive; }

        const finalPercent = totalWeight > 0 ? weightedTotal / totalWeight : 0;

        return {
            moduleId: m.moduleId,
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            formativeAvg: f,
            summativeAvg: s,
            comprehensiveAvg: c,
            finalPercent: Math.round(finalPercent * 100) / 100,
            grade: computeGrade(finalPercent),
            assessments: {
                formative: m.formative,
                summative: m.summative,
                comprehensive: m.comprehensive,
            },
        };
    });

    const overallPercent = modules.length > 0
        ? modules.reduce((s, m) => s + m.finalPercent, 0) / modules.length
        : 0;

    return {
        modules,
        weights,
        overallPercent: Math.round(overallPercent * 100) / 100,
        overallGrade: computeGrade(overallPercent),
    };
}

async function generateReportCard(schoolId, actorId, data) {
    const required = ['studentId', 'classId', 'academicYearId'];
    for (const f of required) if (!data[f]) throw new BadRequest(`${f} is required`);

    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const reportData = await buildReportData(
            client, schoolId, data.studentId, data.classId, data.academicYearId, data.termId || null
        );

        // Get student + class details
        const student = await client.query(
            `SELECT first_name, last_name, student_number FROM students
             WHERE id = $1 AND school_id = $2`,
            [data.studentId, schoolId]
        );
        if (student.rows.length === 0) throw new NotFound('Student not found');

        // Upsert (replace draft if exists, reject if published)
        const existing = await client.query(
            `SELECT id, status FROM report_cards
             WHERE school_id = $1 AND student_id = $2 AND class_id = $3
               AND academic_year_id = $4
               AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid)
                 = COALESCE($5::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
            [schoolId, data.studentId, data.classId, data.academicYearId, data.termId || null]
        );
        if (existing.rows.length > 0 && existing.rows[0].status === 'published') {
            throw new Conflict('Report card is already published. Archive it before regenerating.');
        }

        // Compute position in class (compare overall percentage across students)
        const positionData = await client.query(
            `SELECT student_id, report_data->>'overallPercent' AS pct
             FROM report_cards
             WHERE school_id = $1 AND class_id = $2 AND academic_year_id = $3
               AND COALESCE(term_id, '00000000-0000-0000-0000-000000000000'::uuid)
                 = COALESCE($4::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
               AND status IN ('draft', 'published')`,
            [schoolId, data.classId, data.academicYearId, data.termId || null]
        );
        const allStudents = positionData.rows.concat([
            { student_id: data.studentId, pct: String(reportData.overallPercent) },
        ]);
        const higherCount = allStudents.filter(
            (x) => Number(x.pct) > reportData.overallPercent
        ).length;
        const position = higherCount + 1;
        const classSize = allStudents.length;

        let report;
        if (existing.rows.length > 0) {
            const upd = await client.query(
                `UPDATE report_cards
                 SET report_data = $1, total_percentage = $2, grade = $3,
                     position_in_class = $4, class_size = $5,
                     teacher_comment = COALESCE($6, teacher_comment),
                     head_teacher_comment = COALESCE($7, head_teacher_comment),
                     generated_by = $8, generated_at = now(), updated_at = now()
                 WHERE id = $9 RETURNING *`,
                [
                    JSON.stringify(reportData), reportData.overallPercent, reportData.overallGrade,
                    position, classSize, data.teacherComment || null, data.headTeacherComment || null,
                    actorId, existing.rows[0].id,
                ]
            );
            report = upd.rows[0];
        } else {
            const ins = await client.query(
                `INSERT INTO report_cards
                    (school_id, student_id, class_id, academic_year_id, term_id,
                     report_data, total_percentage, grade, position_in_class, class_size,
                     teacher_comment, head_teacher_comment, generated_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                 RETURNING *`,
                [
                    schoolId, data.studentId, data.classId, data.academicYearId, data.termId || null,
                    JSON.stringify(reportData), reportData.overallPercent, reportData.overallGrade,
                    position, classSize, data.teacherComment || null, data.headTeacherComment || null, actorId,
                ]
            );
            report = ins.rows[0];
        }

        return { ...report, student: student.rows[0] };
    });
}

async function listReportCards(schoolId, filters = {}) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const where = ['rc.school_id = $1'];
        const params = [schoolId];
        let i = 2;
        if (filters.classId) { where.push(`rc.class_id = $${i++}`); params.push(filters.classId); }
        if (filters.academicYearId) { where.push(`rc.academic_year_id = $${i++}`); params.push(filters.academicYearId); }
        if (filters.termId) { where.push(`rc.term_id = $${i++}`); params.push(filters.termId); }
        if (filters.status) { where.push(`rc.status = $${i++}`); params.push(filters.status); }

        const r = await client.query(
            `SELECT rc.*, s.first_name, s.last_name, s.student_number, c.name AS class_name
             FROM report_cards rc
             JOIN students s ON s.id = rc.student_id
             JOIN classes c ON c.id = rc.class_id
             WHERE ${where.join(' AND ')}
             ORDER BY rc.generated_at DESC LIMIT 500`,
            params
        );
        return r.rows;
    });
}

async function getReportCard(schoolId, id) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT rc.*, s.first_name, s.last_name, s.student_number,
                    s.date_of_birth, s.gender, c.name AS class_name
             FROM report_cards rc
             JOIN students s ON s.id = rc.student_id
             JOIN classes c ON c.id = rc.class_id
             WHERE rc.id = $1 AND rc.school_id = $2`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Report card not found');
        return r.rows[0];
    });
}

async function publishReportCard(schoolId, actorId, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `UPDATE report_cards SET status = 'published', published_at = now(), updated_at = now()
             WHERE id = $1 AND school_id = $2 AND status = 'draft'
             RETURNING id, status`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Draft report card not found');
        return r.rows[0];
    });
}

module.exports = { generateReportCard, listReportCards, getReportCard, publishReportCard };