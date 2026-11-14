// backend/src/services/authService.js
'use strict';

const { withTenantContext, rawQuery, authQuery } = require('../config/db');
const { verifyPassword, hashPassword } = require('./password');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('./jwt');
const { Unauthorized, BadRequest, NotFound } = require('../utils/errors');
const env = require('../config/env');

// Dev: effectively unlimited. Prod: 5 attempts per 15 minutes.
const MAX_FAILED_ATTEMPTS = env.isProd ? 5 : 1000;
const ATTEMPT_WINDOW_MINUTES = 15;

// School statuses that block login for school users
const SCHOOL_BLOCKED_MESSAGES = {
    suspended:   'School account is suspended. Contact your platform administrator.',
    expired:     'School subscription has expired. Please renew to restore access.',
    deactivated: 'School account has been deactivated.',
    pending:     'School has not been activated yet.',
};

async function recordLoginAttempt(email, ip, success) {
    try {
        await authQuery(
            `INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)`,
            [email, ip || null, success]
        );
    } catch (_) { /* non-fatal */ }
}

async function countRecentFailures(email) {
    const r = await authQuery(
        `SELECT count(*)::int AS n FROM login_attempts
         WHERE email = $1 AND success = false AND attempted_at > now() - ($2 || ' minutes')::interval`,
        [email, ATTEMPT_WINDOW_MINUTES]
    );
    return r.rows[0].n;
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
async function login({ email, password, ip, userAgent }) {
    if (!email || !password) throw new BadRequest('Email and password are required');

    // Brute-force protection
    const failures = await countRecentFailures(email);
    if (failures >= MAX_FAILED_ATTEMPTS) {
        throw new Unauthorized(`Too many failed attempts. Try again after ${ATTEMPT_WINDOW_MINUTES} minutes.`);
    }

    // Pre-auth user lookup uses privileged auth role (no tenant context yet)
    const userRes = await authQuery(
        `SELECT id, school_id, user_type, email, username, password_hash,
                full_name, status, deleted_at
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email]
    );
    const user = userRes.rows[0];

    if (!user || user.deleted_at) {
        await recordLoginAttempt(email, ip, false);
        throw new Unauthorized('Invalid credentials');
    }
    if (user.status !== 'active') {
        await recordLoginAttempt(email, ip, false);
        throw new Unauthorized(`Account is ${user.status}. Contact your administrator.`);
    }

    // Password verification BEFORE school status check (don't leak school status to wrong passwords)
    const passwordOk = await verifyPassword(password, user.password_hash);
    if (!passwordOk) {
        await recordLoginAttempt(email, ip, false);
        throw new Unauthorized('Invalid credentials');
    }

    // For school users, verify the school is active
    if (user.user_type === 'school' && user.school_id) {
        const schoolCheck = await authQuery(
            `SELECT status FROM schools WHERE id = $1`,
            [user.school_id]
        );
        const schoolStatus = schoolCheck.rows[0]?.status;
        if (schoolStatus && SCHOOL_BLOCKED_MESSAGES[schoolStatus]) {
            await recordLoginAttempt(email, ip, false);
            throw new Unauthorized(SCHOOL_BLOCKED_MESSAGES[schoolStatus]);
        }
    }

    // Load roles + permissions within the user's tenant context
    const { roles, permissions } = await withTenantContext(
        {
            schoolId: user.school_id,
            userId: user.id,
            isPlatformAdmin: user.user_type === 'platform',
        },
        async (client) => {
            const r = await client.query(
                `SELECT r.code
                 FROM user_roles ur
                 JOIN roles r ON r.id = ur.role_id
                 WHERE ur.user_id = $1`,
                [user.id]
            );
            const p = await client.query(
                `SELECT DISTINCT p.code
                 FROM user_roles ur
                 JOIN role_permissions rp ON rp.role_id = ur.role_id
                 JOIN permissions p ON p.id = rp.permission_id
                 WHERE ur.user_id = $1`,
                [user.id]
            );
            return {
                roles: r.rows.map((x) => x.code),
                permissions: p.rows.map((x) => x.code),
            };
        }
    );

    // Issue tokens
    const tokenPayload = {
        sub: user.id,
        schoolId: user.school_id,
        userType: user.user_type,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ sub: user.id });
    const refreshHash = hashToken(refreshToken);

    // Persist session
    const expiresInDays = 7;
    await authQuery(
        `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, now() + ($5 || ' days')::interval)`,
        [user.id, refreshHash, ip || null, userAgent || null, String(expiresInDays)]
    );

    await recordLoginAttempt(email, ip, true);

    // Update last login
    await authQuery(
        `UPDATE users SET last_login_at = now(), last_login_ip = $1 WHERE id = $2`,
        [ip || null, user.id]
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.full_name,
            userType: user.user_type,
            schoolId: user.school_id,
            roles,
            permissions,
        },
    };
}

// ---------------------------------------------------------------------------
// REFRESH
// ---------------------------------------------------------------------------
async function refresh({ refreshToken, ip, userAgent }) {
    if (!refreshToken) throw new BadRequest('Refresh token is required');

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw new Unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const sessionRes = await authQuery(
        `SELECT id, user_id, expires_at, revoked_at
         FROM user_sessions
         WHERE refresh_token_hash = $1
         LIMIT 1`,
        [tokenHash]
    );
    const session = sessionRes.rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
        throw new Unauthorized('Session expired or revoked');
    }

    const userRes = await authQuery(
        `SELECT id, school_id, user_type, email, username, full_name, status
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [payload.sub]
    );
    const user = userRes.rows[0];
    if (!user || user.status !== 'active') throw new Unauthorized('Account no longer active');

    // Block refresh if the school is no longer active
    if (user.user_type === 'school' && user.school_id) {
        const schoolCheck = await authQuery(
            `SELECT status FROM schools WHERE id = $1`,
            [user.school_id]
        );
        const schoolStatus = schoolCheck.rows[0]?.status;
        if (schoolStatus && SCHOOL_BLOCKED_MESSAGES[schoolStatus]) {
            throw new Unauthorized(SCHOOL_BLOCKED_MESSAGES[schoolStatus]);
        }
    }

    // Rotate: revoke old, insert new
    await authQuery(`UPDATE user_sessions SET revoked_at = now() WHERE id = $1`, [session.id]);

    const newAccess = signAccessToken({
        sub: user.id,
        schoolId: user.school_id,
        userType: user.user_type,
    });
    const newRefresh = signRefreshToken({ sub: user.id });
    const newRefreshHash = hashToken(newRefresh);

    await authQuery(
        `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, now() + interval '7 days')`,
        [user.id, newRefreshHash, ip || null, userAgent || null]
    );

    return { accessToken: newAccess, refreshToken: newRefresh };
}

async function logout({ refreshToken }) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await authQuery(
        `UPDATE user_sessions SET revoked_at = now()
         WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash]
    );
}

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------
async function getProfile(userId) {
    const userRes = await authQuery(
        `SELECT id, school_id, user_type, email, username, full_name, phone,
                status, last_login_at, email_verified
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [userId]
    );
    const user = userRes.rows[0];
    if (!user) throw new NotFound('User not found');

    const { roles, permissions } = await withTenantContext(
        {
            schoolId: user.school_id,
            userId: user.id,
            isPlatformAdmin: user.user_type === 'platform',
        },
        async (client) => {
            const r = await client.query(
                `SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
                [user.id]
            );
            const p = await client.query(
                `SELECT DISTINCT p.code
                 FROM user_roles ur
                 JOIN role_permissions rp ON rp.role_id = ur.role_id
                 JOIN permissions p ON p.id = rp.permission_id
                 WHERE ur.user_id = $1`,
                [user.id]
            );
            return {
                roles: r.rows.map((x) => x.code),
                permissions: p.rows.map((x) => x.code),
            };
        }
    );

    return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        phone: user.phone,
        userType: user.user_type,
        schoolId: user.school_id,
        status: user.status,
        lastLoginAt: user.last_login_at,
        emailVerified: user.email_verified,
        roles,
        permissions,
    };
}

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
async function changePassword({ userId, currentPassword, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
        throw new BadRequest('New password must be at least 8 characters');
    }

    const r = await authQuery(
        `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [userId]
    );
    const user = r.rows[0];
    if (!user) throw new NotFound('User not found');

    const ok = await verifyPassword(currentPassword, user.password_hash);
    if (!ok) throw new Unauthorized('Current password is incorrect');

    const newHash = await hashPassword(newPassword);
    await authQuery(
        `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
        [newHash, userId]
    );

    await authQuery(
        `UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
    );
}

module.exports = { login, refresh, logout, getProfile, changePassword };