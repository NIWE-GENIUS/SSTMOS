// backend/src/middleware/authenticate.js
'use strict';

const { verifyAccessToken } = require('../services/jwt');
const { Unauthorized } = require('../utils/errors');

/**
 * Verifies the JWT on the Authorization header and attaches:
 *   req.user = { id, schoolId, userType }
 *   req.isPlatformAdmin = boolean
 *   req.tenantContext = { schoolId, userId, isPlatformAdmin }   ← for withTenantContext
 */
function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new Unauthorized('Missing authorization header'));

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            schoolId: payload.schoolId,
            userType: payload.userType,
        };
        req.isPlatformAdmin = payload.userType === 'platform';
        req.tenantContext = {
            schoolId: payload.schoolId,
            userId: payload.sub,
            isPlatformAdmin: req.isPlatformAdmin,
        };
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Same as authenticate but does NOT reject if the token is missing.
 * Useful for endpoints that behave differently when authenticated.
 */
function optionalAuthenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, schoolId: payload.schoolId, userType: payload.userType };
        req.isPlatformAdmin = payload.userType === 'platform';
        req.tenantContext = {
            schoolId: payload.schoolId,
            userId: payload.sub,
            isPlatformAdmin: req.isPlatformAdmin,
        };
    } catch (_) { /* silent — treated as unauthenticated */ }
    next();
}

module.exports = { authenticate, optionalAuthenticate };