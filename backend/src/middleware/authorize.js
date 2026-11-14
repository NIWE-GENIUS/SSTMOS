// backend/src/middleware/authorize.js
'use strict';

const { Forbidden, Unauthorized } = require('../utils/errors');
const { withTenantContext } = require('../config/db');

/**
 * Loads the current user's permissions from the DB once per request and
 * caches on req.user.permissions. Safe to call multiple times.
 */
async function loadUserPermissions(req) {
    if (req.user.permissions) return req.user.permissions;

    const r = await withTenantContext(req.tenantContext, async (client) => {
        const result = await client.query(
            `SELECT DISTINCT p.code
             FROM user_roles ur
             JOIN role_permissions rp ON rp.role_id = ur.role_id
             JOIN permissions p ON p.id = rp.permission_id
             WHERE ur.user_id = $1`,
            [req.user.id]
        );
        return result.rows.map(x => x.code);
    });

    req.user.permissions = r;
    return r;
}

/**
 * Middleware factory: requires one or more permission codes.
 * Must be used AFTER authenticate.
 *
 * Usage:
 *   router.get('/schools', authenticate, requirePermission('platform.school.manage'), handler)
 *   router.get('/mixed', authenticate, requirePermission(['a.b', 'c.d']), handler)
 */
function requirePermission(required) {
    const list = Array.isArray(required) ? required : [required];
    return async (req, res, next) => {
        try {
            if (!req.user) return next(new Unauthorized('Authentication required'));
            const have = await loadUserPermissions(req);
            const missing = list.filter(p => !have.includes(p));
            if (missing.length > 0) {
                return next(new Forbidden(`Missing permission(s): ${missing.join(', ')}`));
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Requires at least one of the listed permissions.
 */
function requireAnyPermission(list) {
    return async (req, res, next) => {
        try {
            if (!req.user) return next(new Unauthorized('Authentication required'));
            const have = await loadUserPermissions(req);
            if (!list.some(p => have.includes(p))) {
                return next(new Forbidden(`Requires one of: ${list.join(', ')}`));
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Requires the caller to be a platform admin.
 */
function requirePlatformAdmin(req, res, next) {
    if (!req.user) return next(new Unauthorized('Authentication required'));
    if (!req.isPlatformAdmin) return next(new Forbidden('Platform admin only'));
    next();
}

module.exports = { requirePermission, requireAnyPermission, requirePlatformAdmin, loadUserPermissions };