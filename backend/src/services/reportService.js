'use strict';
const { withTenantContext } = require('../config/db');

async function trainerWorkload(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT t.id, t.full_name, t.staff_number,
                    COALESCE(SUM(CASE WHEN tv.status = 'published' THEN e.sequence_length ELSE 0 END), 0)::int AS scheduled_periods,
                    twl.max_weekly_periods,
                    count(DISTINCT e.class_id)::int AS classes_taught,
                    count(DISTINCT ma.module_id)::int AS modules_taught
             FROM trainers t
             LEFT JOIN module_assignments ma ON ma.trainer_id = t.id
             LEFT JOIN timetable_entries e ON e.module_assignment_id = ma.id
             LEFT JOIN timetable_versions tv ON tv.id = e.timetable_version_id
             LEFT JOIN trainer_workload_limits twl ON twl.trainer_id = t.id
             WHERE t.school_id = $1
             GROUP BY t.id, t.full_name, t.staff_number, twl.max_weekly_periods
             ORDER BY t.full_name`, [schoolId]
        );
        return r.rows;
    });
}

async function moduleCoverage(schoolId, versionId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT m.id AS module_id, m.code, m.name, cl.name AS class_name,
                    ma.weekly_periods AS required_periods,
                    COALESCE(SUM(e.sequence_length), 0)::int AS scheduled_periods,
                    (ma.weekly_periods - COALESCE(SUM(e.sequence_length), 0))::int AS gap
             FROM module_assignments ma
             JOIN modules m ON m.id = ma.module_id
             JOIN classes cl ON cl.id = ma.class_id
             LEFT JOIN timetable_entries e ON e.module_assignment_id = ma.id
                                          AND e.timetable_version_id = $2
             WHERE ma.school_id = $1
             GROUP BY m.id, m.code, m.name, cl.name, ma.weekly_periods
             ORDER BY cl.name, m.code`, [schoolId, versionId]
        );
        return r.rows;
    });
}

async function roomUtilization(schoolId, versionId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT r.id, r.name, r.capacity, rt.name AS room_type,
                    count(e.id)::int AS scheduled_count
             FROM rooms r
             JOIN room_types rt ON rt.id = r.room_type_id
             LEFT JOIN timetable_entries e ON e.room_id = r.id AND e.timetable_version_id = $2
             WHERE r.school_id = $1
             GROUP BY r.id, r.name, r.capacity, rt.name
             ORDER BY scheduled_count DESC`, [schoolId, versionId]
        );
        return r.rows;
    });
}

module.exports = { trainerWorkload, moduleCoverage, roomUtilization };