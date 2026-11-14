'use strict';
const { withTenantContext } = require('../config/db');
const { solve } = require('../scheduling/solver');
const { NotFound, BadRequest } = require('../utils/errors');

async function loadGeneratorInput(schoolId, { academicYearId, termId, formatId }) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        // Format + periods
        const f = await c.query(
            `SELECT * FROM timetable_formats WHERE id = $1 AND school_id = $2`,
            [formatId, schoolId]
        );
        if (!f.rows.length) throw new NotFound('Format not found');
        const format = f.rows[0];

        const periods = (await c.query(
            `SELECT id, period_number, start_time, end_time, session_id
             FROM timetable_periods WHERE timetable_format_id = $1 ORDER BY period_number`,
            [formatId]
        )).rows;

        const breaks = (await c.query(
            `SELECT name, start_time, end_time FROM timetable_breaks WHERE timetable_format_id = $1`,
            [formatId]
        )).rows;

        // Classes
        const classes = (await c.query(
            `SELECT id, name FROM classes WHERE school_id = $1 AND academic_year_id = $2 AND status = 'active'`,
            [schoolId, academicYearId]
        )).rows;

        // Assignments with module info
        const assignments = (await c.query(
            `SELECT ma.id, ma.module_id, ma.class_id, ma.trainer_id, ma.weekly_periods,
                    m.code AS module_code, m.name AS module_name, m.sequence_length,
                    m.split_session_pattern, m.module_type, m.priority,
                    t.full_name AS trainer_name,
                    twl.max_weekly_periods AS trainer_max_weekly
             FROM module_assignments ma
             JOIN modules m ON m.id = ma.module_id
             JOIN trainers t ON t.id = ma.trainer_id
             LEFT JOIN trainer_workload_limits twl ON twl.trainer_id = ma.trainer_id
             WHERE ma.school_id = $1 AND ma.academic_year_id = $2
               AND ($3::uuid IS NULL OR ma.term_id = $3)
               AND ma.status = 'active'`,
            [schoolId, academicYearId, termId || null]
        )).rows;

        // Per-assignment room requirements + trainer availability
        for (const a of assignments) {
            const reqs = (await c.query(
                `SELECT room_type_id FROM module_room_requirements
                 WHERE module_id = $1 AND school_id = $2 AND mandatory = true`,
                [a.module_id, schoolId]
            )).rows;
            a.required_room_type_ids = reqs.map(r => r.room_type_id);

            const avail = (await c.query(
                `SELECT day_of_week, timetable_period_id, is_available
                 FROM trainer_availability WHERE trainer_id = $1 AND school_id = $2`,
                [a.trainer_id, schoolId]
            )).rows;
            const map = {};
            for (const v of avail) {
                map[v.day_of_week] = map[v.day_of_week] || {};
                if (v.timetable_period_id) map[v.day_of_week][v.timetable_period_id] = v.is_available;
            }
            a.trainer_available_map = map;
        }

        const rooms = (await c.query(
            `SELECT id, room_type_id FROM rooms WHERE school_id = $1 AND status = 'active'`,
            [schoolId]
        )).rows;

        return {
            periods, breaks, classes, assignments, rooms,
            workingDays: [1, 2, 3, 4, 5],
        };
    });
}

async function runGeneration(schoolId, actorId, params) {
    if (!params.academicYearId || !params.formatId) {
        throw new BadRequest('academicYearId and formatId are required');
    }

    // Create job row
    const job = await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const j = await c.query(
            `INSERT INTO timetable_generation_jobs
                (school_id, timetable_version_id, status, input_parameters, started_at, requested_by)
             VALUES ($1, $2, 'running', $3, now(), $4) RETURNING id`,
            [schoolId, params.timetableVersionId || null, JSON.stringify(params), actorId]
        );
        return j.rows[0];
    });

    try {
        const input = await loadGeneratorInput(schoolId, params);
        const result = solve(input);

        // Persist entries + segments
        await withTenantContext({ schoolId, userId: actorId }, async (c) => {
            // Only persist if a version was specified
            if (params.timetableVersionId) {
                for (const e of result.entries) {
                    const ins = await c.query(
                        `INSERT INTO timetable_entries
                            (school_id, timetable_version_id, module_assignment_id, class_id, trainer_id, room_id,
                             day_of_week, timetable_period_id, sequence_length, split_session_pattern)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                        [schoolId, params.timetableVersionId, e.assignment_id, e.class_id, e.trainer_id,
                         e.room_id, e.day_of_week, e.period_id, e.sequence_length, e.split_session_pattern]
                    );
                    const entryId = ins.rows[0].id;
                    // Segments
                    for (let i = 0; i < e.segment_period_ids.length; i++) {
                        await c.query(
                            `INSERT INTO timetable_entry_segments
                                (school_id, timetable_entry_id, timetable_period_id, day_of_week, segment_order)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [schoolId, entryId, e.segment_period_ids[i], e.day_of_week, i + 1]
                        );
                    }
                }
            }

            await c.query(
                `INSERT INTO timetable_generation_reports (school_id, job_id, summary, unscheduled)
                 VALUES ($1, $2, $3, $4)`,
                [schoolId, job.id, JSON.stringify(result.summary), JSON.stringify(result.unassigned)]
            );
            await c.query(
                `UPDATE timetable_generation_jobs SET status = 'completed', finished_at = now() WHERE id = $1`,
                [job.id]
            );
        });

        return { jobId: job.id, result };
    } catch (err) {
        await withTenantContext({ schoolId, userId: actorId }, async (c) => {
            await c.query(
                `UPDATE timetable_generation_jobs SET status = 'failed', finished_at = now(), error_message = $2 WHERE id = $1`,
                [job.id, err.message]
            );
        });
        throw err;
    }
}

module.exports = { runGeneration };