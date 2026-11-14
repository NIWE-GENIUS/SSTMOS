// backend/src/services/dashboardService.js
'use strict';

const { withTenantContext } = require('../config/db');

async function getStats() {
    return await withTenantContext(
        { schoolId: null, userId: null, isPlatformAdmin: true },
        async (client) => {
            const stats = await client.query(`
                SELECT
                    (SELECT count(*)::int FROM schools WHERE deleted_at IS NULL) AS total_schools,
                    (SELECT count(*)::int FROM schools WHERE status='active' AND deleted_at IS NULL) AS active_schools,
                    (SELECT count(*)::int FROM schools WHERE status='pending' AND deleted_at IS NULL) AS pending_schools,
                    (SELECT count(*)::int FROM schools WHERE status='suspended' AND deleted_at IS NULL) AS suspended_schools,
                    (SELECT count(*)::int FROM schools WHERE status='expired' AND deleted_at IS NULL) AS expired_schools,
                    (SELECT count(*)::int FROM schools WHERE status='deactivated' AND deleted_at IS NULL) AS deactivated_schools,
                    (SELECT count(*)::int FROM users WHERE deleted_at IS NULL) AS total_users,
                    (SELECT count(*)::int FROM users WHERE user_type='school' AND deleted_at IS NULL) AS school_users,
                    (SELECT count(*)::int FROM users WHERE user_type='platform' AND deleted_at IS NULL) AS platform_users,
                    (SELECT count(*)::int FROM school_subscriptions
                     WHERE expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
                       AND status = 'active') AS expiring_soon,
                    (SELECT count(*)::int FROM school_subscriptions
                     WHERE expiration_date < CURRENT_DATE AND status IN ('active','grace')) AS overdue
            `);

            const byStatus = await client.query(`
                SELECT status, count(*)::int AS count
                FROM schools WHERE deleted_at IS NULL
                GROUP BY status
                ORDER BY count DESC
            `);

            const byMonth = await client.query(`
                SELECT
                    to_char(date_trunc('month', created_at), 'Mon YY') AS label,
                    count(*)::int AS count
                FROM schools
                WHERE created_at > now() - interval '12 months' AND deleted_at IS NULL
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at)
            `);

            const byRole = await client.query(`
                SELECT r.code AS role, count(DISTINCT u.id)::int AS count
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                WHERE u.deleted_at IS NULL
                GROUP BY r.code
                ORDER BY count DESC
            `);

            const recent = await client.query(`
                SELECT id, code, name, status, created_at, activated_at
                FROM schools WHERE deleted_at IS NULL
                ORDER BY created_at DESC LIMIT 6
            `);

            const recentAudit = await client.query(`
                SELECT pal.action, pal.target_school_id, pal.details, pal.created_at,
                       s.name AS school_name
                FROM platform_audit_logs pal
                LEFT JOIN schools s ON s.id = pal.target_school_id
                ORDER BY pal.created_at DESC LIMIT 12
            `);

            const expiring = await client.query(`
                SELECT s.id, s.name, s.code, ss.expiration_date,
                       (ss.expiration_date - CURRENT_DATE)::int AS days_left
                FROM school_subscriptions ss
                JOIN schools s ON s.id = ss.school_id
                WHERE ss.status = 'active'
                  AND ss.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 60
                ORDER BY ss.expiration_date ASC
                LIMIT 8
            `);

            return {
                ...stats.rows[0],
                schoolsByStatus: byStatus.rows,
                schoolsByMonth: byMonth.rows,
                usersByRole: byRole.rows,
                recentSchools: recent.rows,
                recentActivity: recentAudit.rows,
                expiringSubscriptions: expiring.rows,
            };
        }
    );
}

module.exports = { getStats };