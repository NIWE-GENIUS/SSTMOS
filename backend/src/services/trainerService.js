// backend/src/services/trainerService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest, Conflict } = require('../utils/errors');

async function createTrainer(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO trainers
                (school_id, staff_number, full_name, email, phone, employment_status,
                 academic_qualifications, professional_qualifications, specialization)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
                schoolId,
                data.staff_number,
                data.full_name,
                data.email || null,
                data.phone || null,
                data.employment_status || 'full_time',
                data.academic_qualifications || null,
                data.professional_qualifications || null,
                data.specialization || null,
            ]
        );
        return r.rows[0];
    });
}

async function listTrainers(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT t.*, twl.max_weekly_periods, twl.max_consecutive_periods
             FROM trainers t
             LEFT JOIN trainer_workload_limits twl ON twl.trainer_id = t.id
             WHERE t.school_id = $1
             ORDER BY t.full_name`,
            [schoolId]
        );
        return r.rows;
    });
}

async function getTrainer(schoolId, id) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT t.*, twl.max_weekly_periods, twl.min_weekly_periods, twl.max_consecutive_periods
             FROM trainers t
             LEFT JOIN trainer_workload_limits twl ON twl.trainer_id = t.id
             WHERE t.id = $1 AND t.school_id = $2`,
            [id, schoolId]
        );
        if (!r.rows.length) throw new NotFound('Trainer not found');
        return r.rows[0];
    });
}

async function updateTrainer(schoolId, actorId, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const fields = Object.keys(data);
        if (!fields.length) throw new BadRequest('No fields to update');
        const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const r = await c.query(
            `UPDATE trainers SET ${sets}, updated_at = now()
             WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, schoolId, ...Object.values(data)]
        );
        if (!r.rows.length) throw new NotFound('Trainer not found');
        return r.rows[0];
    });
}

async function deleteTrainer(schoolId, actorId, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        // Verify exists
        const t = await c.query(
            `SELECT id, full_name FROM trainers WHERE id = $1 AND school_id = $2`,
            [id, schoolId]
        );
        if (!t.rows.length) throw new NotFound('Trainer not found');

        // Block delete if trainer has module assignments
        const assigns = await c.query(
            `SELECT count(*)::int AS n FROM module_assignments
             WHERE trainer_id = $1 AND school_id = $2 AND status = 'active'`,
            [id, schoolId]
        );
        if (assigns.rows[0].n > 0) {
            throw new Conflict(
                `Cannot delete "${t.rows[0].full_name}": they have ${assigns.rows[0].n} active module assignment(s). ` +
                `Remove those assignments first, or set the trainer to inactive instead.`
            );
        }

        // Block delete if trainer has been used as a replacement
        const repl = await c.query(
            `SELECT count(*)::int AS n FROM trainer_replacements
             WHERE (original_trainer_id = $1 OR replacement_trainer_id = $1) AND school_id = $2`,
            [id, schoolId]
        );
        if (repl.rows[0].n > 0) {
            throw new Conflict(
                `Cannot delete "${t.rows[0].full_name}": they appear in ${repl.rows[0].n} replacement record(s). ` +
                `Set the trainer to inactive instead.`
            );
        }

        await c.query(
            `DELETE FROM trainers WHERE id = $1 AND school_id = $2`,
            [id, schoolId]
        );
        return { id, deleted: true };
    });
}

async function setWorkloadLimits(schoolId, actorId, trainerId, { maxWeeklyPeriods, minWeeklyPeriods, maxConsecutivePeriods }) {
    if (!maxWeeklyPeriods) throw new BadRequest('maxWeeklyPeriods is required');
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        await c.query(
            `INSERT INTO trainer_workload_limits
                (school_id, trainer_id, max_weekly_periods, min_weekly_periods, max_consecutive_periods)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (trainer_id) DO UPDATE
             SET max_weekly_periods = $3, min_weekly_periods = $4,
                 max_consecutive_periods = $5, updated_at = now()`,
            [schoolId, trainerId, maxWeeklyPeriods, minWeeklyPeriods || 0, maxConsecutivePeriods || 4]
        );
        return { trainerId, maxWeeklyPeriods, minWeeklyPeriods, maxConsecutivePeriods };
    });
}

async function setAvailability(schoolId, actorId, trainerId, slots) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        await c.query(
            `DELETE FROM trainer_availability WHERE trainer_id = $1 AND school_id = $2`,
            [trainerId, schoolId]
        );
        for (const s of slots) {
            await c.query(
                `INSERT INTO trainer_availability
                    (school_id, trainer_id, day_of_week, timetable_period_id, is_available, reason)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    schoolId, trainerId, s.dayOfWeek, s.timetablePeriodId || null,
                    s.isAvailable !== false, s.reason || null,
                ]
            );
        }
        return { trainerId, slots: slots.length };
    });
}

async function getAvailability(schoolId, trainerId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT * FROM trainer_availability
             WHERE trainer_id = $1 AND school_id = $2
             ORDER BY day_of_week, timetable_period_id`,
            [trainerId, schoolId]
        );
        return r.rows;
    });
}

module.exports = {
    createTrainer, listTrainers, getTrainer, updateTrainer, deleteTrainer,
    setWorkloadLimits, setAvailability, getAvailability,
};