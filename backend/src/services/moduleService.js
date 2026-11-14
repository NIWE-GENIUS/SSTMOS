// backend/src/services/moduleService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest } = require('../utils/errors');

async function createModule(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO modules
                (school_id, educational_level_id, code, name, module_type,
                 weekly_periods_required, sequence_length, daily_occurrence_rule,
                 split_session_pattern, priority)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [
                schoolId,
                data.educational_level_id || null,
                data.code,
                data.name,
                data.module_type || 'theoretical',
                data.weekly_periods_required,
                data.sequence_length || 1,
                data.daily_occurrence_rule || 'once_per_day',
                data.split_session_pattern || 'none',
                data.priority || 5,
            ]
        );
        return r.rows[0];
    });
}

async function listModules(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT * FROM modules WHERE school_id = $1 ORDER BY code`,
            [schoolId]
        );
        return r.rows;
    });
}

async function updateModule(schoolId, actorId, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const fields = Object.keys(data);
        if (!fields.length) throw new BadRequest('No fields to update');
        const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const r = await c.query(
            `UPDATE modules SET ${sets}, updated_at = now()
             WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, schoolId, ...Object.values(data)]
        );
        if (!r.rows.length) throw new NotFound('Module not found');
        return r.rows[0];
    });
}

async function createAssignment(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO module_assignments
                (school_id, module_id, class_id, trainer_id, academic_year_id, term_id, weekly_periods)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [
                schoolId,
                data.module_id,
                data.class_id,
                data.trainer_id,
                data.academic_year_id,
                data.term_id || null,
                data.weekly_periods,
            ]
        );
        return r.rows[0];
    });
}

async function listAssignments(schoolId, filters = {}) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const where = ['ma.school_id = $1'];
        const params = [schoolId];
        let i = 2;
        if (filters.classId)        { where.push(`ma.class_id = $${i++}`);        params.push(filters.classId); }
        if (filters.trainerId)      { where.push(`ma.trainer_id = $${i++}`);      params.push(filters.trainerId); }
        if (filters.academicYearId) { where.push(`ma.academic_year_id = $${i++}`); params.push(filters.academicYearId); }

        const r = await c.query(
            `SELECT ma.*, m.code AS module_code, m.name AS module_name, m.sequence_length,
                    m.weekly_periods_required, m.split_session_pattern, m.module_type,
                    c.name AS class_name, t.full_name AS trainer_name
             FROM module_assignments ma
             JOIN modules m ON m.id = ma.module_id
             JOIN classes c ON c.id = ma.class_id
             JOIN trainers t ON t.id = ma.trainer_id
             WHERE ${where.join(' AND ')}
             ORDER BY c.name, m.code`,
            params
        );
        return r.rows;
    });
}

async function authorizeTrainer(schoolId, actorId, trainerId, moduleId) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        await c.query(
            `INSERT INTO trainer_authorized_modules (school_id, trainer_id, module_id, is_authorized)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (trainer_id, module_id) DO UPDATE SET is_authorized = true`,
            [schoolId, trainerId, moduleId]
        );
        return { trainerId, moduleId, authorized: true };
    });
}

async function setRoomRequirements(schoolId, actorId, moduleId, requirements) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        await c.query(
            `DELETE FROM module_room_requirements WHERE module_id = $1 AND school_id = $2`,
            [moduleId, schoolId]
        );
        for (const req of requirements) {
            await c.query(
                `INSERT INTO module_room_requirements (school_id, module_id, room_type_id, mandatory)
                 VALUES ($1, $2, $3, $4)`,
                [schoolId, moduleId, req.roomTypeId, req.mandatory !== false]
            );
        }
        return { moduleId, requirements: requirements.length };
    });
}

module.exports = {
    createModule, listModules, updateModule,
    createAssignment, listAssignments,
    authorizeTrainer, setRoomRequirements,
};