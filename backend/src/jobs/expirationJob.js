// backend/src/jobs/expirationJob.js
'use strict';

const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Scans school_subscriptions and transitions past-due ones:
 *   active + past expiration + no grace  → expired
 *   active + past expiration + has grace → grace
 *   grace  + past grace_period_until     → expired
 *
 * Also mirrors the status onto schools.status.
 */
async function expireSubscriptions() {
    const result = { expired: 0, inGrace: 0, skipped: 0, errors: 0 };
    let client;
    try {
        client = await pool.connect();

        const candidates = await client.query(`
            SELECT ss.id, ss.school_id, ss.expiration_date, ss.grace_period_until, ss.status
            FROM school_subscriptions ss
            WHERE ss.status IN ('active', 'grace')
              AND ss.expiration_date < CURRENT_DATE
        `);

        for (const sub of candidates.rows) {
            try {
                const today = new Date();
                const graceUntil = sub.grace_period_until ? new Date(sub.grace_period_until) : null;
                const inGraceWindow = graceUntil && graceUntil >= today;
                const targetStatus = inGraceWindow ? 'grace' : 'expired';
                const targetSchoolStatus = inGraceWindow ? 'active' : 'expired';

                if (sub.status === targetStatus) { result.skipped++; continue; }

                await client.query('BEGIN');

                await client.query(
                    `UPDATE school_subscriptions
                     SET status = $1, updated_at = now()
                     WHERE id = $2`,
                    [targetStatus, sub.id]
                );

                await client.query(
                    `UPDATE schools
                     SET status = $1, updated_at = now()
                     WHERE id = $2 AND status IN ('active','expired')`,
                    [targetSchoolStatus, sub.school_id]
                );

                await client.query(
                    `INSERT INTO subscription_history
                        (school_id, subscription_id, event_type, previous_state, new_state)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        sub.school_id,
                        sub.id,
                        inGraceWindow ? 'grace_started' : 'expired',
                        JSON.stringify({ status: sub.status }),
                        JSON.stringify({ status: targetStatus }),
                    ]
                );

                await client.query(
                    `INSERT INTO platform_audit_logs
                        (platform_admin_id, target_school_id, action, entity_type, entity_id, details)
                     SELECT id, $1, 'expire', 'school', $1, $2
                     FROM users WHERE user_type = 'platform' LIMIT 1`,
                    [
                        sub.school_id,
                        JSON.stringify({ previousStatus: sub.status, newStatus: targetStatus, automated: true }),
                    ]
                );

                await client.query('COMMIT');

                if (inGraceWindow) result.inGrace++;
                else result.expired++;
            } catch (err) {
                try { await client.query('ROLLBACK'); } catch (_) {}
                logger.error('Expiration: failed on subscription', { subId: sub.id, message: err.message });
                result.errors++;
            }
        }
    } catch (err) {
        logger.error('Expiration job failed', { message: err.message, stack: err.stack });
    } finally {
        if (client) client.release();
    }
    return result;
}

module.exports = { expireSubscriptions };