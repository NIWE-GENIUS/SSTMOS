// backend/src/services/timetableConfigService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound } = require('../utils/errors');

async function getActiveFormat(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const f = await client.query(`SELECT * FROM timetable_formats WHERE school_id = $1 AND is_active LIMIT 1`, [schoolId]);
        if (!f.rows.length) throw new NotFound('No active timetable format');
        const format = f.rows[0];

        const [periods, sessions, breaks] = await Promise.all([
            client.query(`SELECT * FROM timetable_periods WHERE timetable_format_id = $1 ORDER BY period_number`, [format.id]),
            client.query(`SELECT * FROM timetable_sessions WHERE timetable_format_id = $1 ORDER BY sort_order`, [format.id]),
            client.query(`SELECT * FROM timetable_breaks WHERE timetable_format_id = $1 ORDER BY sort_order`, [format.id]),
        ]);
        return { format, periods: periods.rows, sessions: sessions.rows, breaks: breaks.rows };
    });
}

async function buildFullFormat(schoolId, actorId, spec) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        await c.query(`UPDATE timetable_formats SET is_active = false WHERE school_id = $1 AND is_active`, [schoolId]);

        const totalPeriods = spec.sessions.reduce((s, x) => s + x.periods, 0);
        const f = await c.query(
            `INSERT INTO timetable_formats (school_id, name, start_time, period_duration_minutes, total_periods, is_active)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
            [schoolId, spec.name, spec.startTime, spec.periodDurationMinutes, totalPeriods]
        );
        const format = f.rows[0];

        let periodNum = 0;
        let currentTime = timeToMinutes(spec.startTime);
        const breakMap = new Map();
        (spec.breaks || []).forEach(b => breakMap.set(b.afterPeriod, b));

        for (let sIdx = 0; sIdx < spec.sessions.length; sIdx++) {
            const sess = spec.sessions[sIdx];
            const sr = await c.query(
                `INSERT INTO timetable_sessions (school_id, timetable_format_id, name, sort_order, periods_in_session, color)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [schoolId, format.id, sess.name, sIdx + 1, sess.periods, sess.color || '#3b82f6']
            );
            const sessionId = sr.rows[0].id;

            for (let p = 0; p < sess.periods; p++) {
                periodNum++;
                const start = currentTime;
                const end = currentTime + spec.periodDurationMinutes;

                await c.query(
                    `INSERT INTO timetable_periods (school_id, timetable_format_id, session_id, period_number, label, start_time, end_time)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [schoolId, format.id, sessionId, periodNum, `P${periodNum}`, minutesToTime(start), minutesToTime(end)]
                );
                currentTime = end;

                if (breakMap.has(periodNum)) {
                    const b = breakMap.get(periodNum);
                    const bStart = currentTime;
                    const bEnd = currentTime + b.durationMinutes;
                    await c.query(
                        `INSERT INTO timetable_breaks (school_id, timetable_format_id, name, sort_order, start_time, end_time, duration_minutes)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [schoolId, format.id, b.name, periodNum, minutesToTime(bStart), minutesToTime(bEnd), b.durationMinutes]
                    );
                    currentTime = bEnd;
                }
            }
        }
        return { format, totalPeriods, schoolCloseTime: minutesToTime(currentTime) };
    });
}

function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
}
function minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

module.exports = { getActiveFormat, buildFullFormat };