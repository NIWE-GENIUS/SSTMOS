// backend/src/services/studentsService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest, Conflict } = require('../utils/errors');

async function generateStudentNumber(schoolId, client) {
    const year = new Date().getFullYear();
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`STU-${schoolId}-${year}`]);
    const r = await client.query(
        `SELECT student_number FROM students
         WHERE school_id = $1 AND student_number LIKE $2
         ORDER BY student_number DESC LIMIT 1`,
        [schoolId, `STU-${year}-%`]
    );
    let next = 1;
    if (r.rows.length > 0) {
        next = parseInt(r.rows[0].student_number.split('-')[2], 10) + 1;
    }
    return `STU-${year}-${String(next).padStart(4, '0')}`;
}

async function createStudent(schoolId, actorId, data) {
    if (!data.firstName || !data.lastName) {
        throw new BadRequest('First name and last name are required');
    }

    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const studentNumber = data.studentNumber || await generateStudentNumber(schoolId, client);
        const r = await client.query(
            `INSERT INTO students
                (school_id, student_number, first_name, middle_name, last_name, gender,
                 date_of_birth, guardian_name, guardian_phone, guardian_email, address,
                 photo_url, status, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
             RETURNING *`,
            [
                schoolId, studentNumber,
                data.firstName.trim(),
                data.middleName ? data.middleName.trim() : null,
                data.lastName.trim(),
                data.gender || null,
                data.dateOfBirth || null,
                data.guardianName || null,
                data.guardianPhone || null,
                data.guardianEmail ? data.guardianEmail.toLowerCase() : null,
                data.address || null,
                data.photoUrl || null,
                data.status || 'active',
                data.notes || null,
                actorId,
            ]
        );
        return r.rows[0];
    });
}

async function listStudents(schoolId, filters = {}) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const where = ['deleted_at IS NULL'];
        const params = [schoolId];
        let i = 2;

        if (filters.search) {
            where.push(`(first_name ILIKE $${i} OR last_name ILIKE $${i} OR student_number ILIKE $${i})`);
            params.push(`%${filters.search}%`);
            i++;
        }
        if (filters.status) {
            where.push(`status = $${i++}`);
            params.push(filters.status);
        }
        if (filters.classId) {
            where.push(`id IN (SELECT student_id FROM student_enrollments WHERE class_id = $${i++} AND status = 'active')`);
            params.push(filters.classId);
        }

        const r = await client.query(
            `SELECT s.*,
                    (SELECT c.name FROM student_enrollments se
                     JOIN classes c ON c.id = se.class_id
                     WHERE se.student_id = s.id AND se.status = 'active'
                     ORDER BY se.created_at DESC LIMIT 1) AS current_class_name,
                    (SELECT se.class_id FROM student_enrollments se
                     WHERE se.student_id = s.id AND se.status = 'active'
                     ORDER BY se.created_at DESC LIMIT 1) AS current_class_id
             FROM students s
             WHERE s.school_id = $1 AND ${where.join(' AND ')}
             ORDER BY s.last_name, s.first_name
             LIMIT 500`,
            params
        );
        return r.rows;
    });
}

async function getStudent(schoolId, id) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT * FROM students WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Student not found');

        const enrollments = await client.query(
            `SELECT se.*, c.name AS class_name, ay.name AS year_name, t.name AS term_name
             FROM student_enrollments se
             JOIN classes c ON c.id = se.class_id
             JOIN academic_years ay ON ay.id = se.academic_year_id
             LEFT JOIN terms t ON t.id = se.term_id
             WHERE se.student_id = $1
             ORDER BY se.created_at DESC`,
            [id]
        );

        return { ...r.rows[0], enrollments: enrollments.rows };
    });
}

async function updateStudent(schoolId, actorId, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const allowed = ['first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth',
                         'guardian_name', 'guardian_phone', 'guardian_email', 'address',
                         'photo_url', 'status', 'notes'];
        const fields = Object.keys(data).filter((k) => allowed.includes(k));
        if (fields.length === 0) throw new BadRequest('No valid fields to update');

        const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const r = await client.query(
            `UPDATE students SET ${sets}, updated_at = now()
             WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL RETURNING *`,
            [id, schoolId, ...fields.map((f) => data[f])]
        );
        if (r.rows.length === 0) throw new NotFound('Student not found');
        return r.rows[0];
    });
}

async function deleteStudent(schoolId, actorId, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `UPDATE students SET deleted_at = now(), status = 'inactive'
             WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL RETURNING id`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Student not found');
        return { id, deleted: true };
    });
}

async function enrollStudent(schoolId, actorId, data) {
    const required = ['studentId', 'classId', 'academicYearId'];
    for (const f of required) if (!data[f]) throw new BadRequest(`${f} is required`);

    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `INSERT INTO student_enrollments
                (school_id, student_id, class_id, student_group_id, academic_year_id, term_id, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
             RETURNING *`,
            [schoolId, data.studentId, data.classId, data.studentGroupId || null,
             data.academicYearId, data.termId || null, actorId]
        );
        return r.rows[0];
    });
}

async function listEnrollments(schoolId, classId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const params = [schoolId];
        let extra = '';
        if (classId) { extra = 'AND se.class_id = $2'; params.push(classId); }
        const r = await client.query(
            `SELECT se.*, s.first_name, s.last_name, s.student_number, c.name AS class_name
             FROM student_enrollments se
             JOIN students s ON s.id = se.student_id
             JOIN classes c ON c.id = se.class_id
             WHERE se.school_id = $1 AND se.status = 'active' ${extra}
             ORDER BY s.last_name, s.first_name`,
            params
        );
        return r.rows;
    });
}

async function removeEnrollment(schoolId, actorId, enrollmentId) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `UPDATE student_enrollments SET status = 'withdrawn', updated_at = now()
             WHERE id = $1 AND school_id = $2 RETURNING id`,
            [enrollmentId, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Enrollment not found');
        return { id: enrollmentId, status: 'withdrawn' };
    });
}

module.exports = {
    createStudent, listStudents, getStudent, updateStudent, deleteStudent,
    enrollStudent, listEnrollments, removeEnrollment,
};