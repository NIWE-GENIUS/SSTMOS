// backend/src/services/passwordResetService.js
'use strict';

const crypto = require('crypto');
const { rawQuery, authQuery } = require('../config/db');
const emailService = require('./emailService');
const { hashPassword } = require('./password');
const { BadRequest, NotFound } = require('../utils/errors');
const env = require('../config/env');
const logger = require('../utils/logger');

const RESET_EXPIRY_MINUTES = 30;

async function requestReset({ email }) {
    if (!email) throw new BadRequest('Email is required');

    // Look up user (via authQuery — no tenant context yet)
    const userRes = await authQuery(
        `SELECT id, email, full_name, status FROM users
         WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
        [email.toLowerCase().trim()]
    );

    // SECURITY: Do not reveal whether the email exists
    if (userRes.rows.length === 0) {
        logger.info('Password reset requested for unknown email', { email });
        return { ok: true, message: 'If that email exists, a reset link has been sent.' };
    }

    const user = userRes.rows[0];
    if (user.status !== 'active') {
        logger.info('Password reset for inactive user', { email });
        return { ok: true, message: 'If that email exists, a reset link has been sent.' };
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any previous unused tokens
    await authQuery(
        `UPDATE password_reset_tokens SET used_at = now()
         WHERE user_id = $1 AND used_at IS NULL`,
        [user.id]
    );

    await authQuery(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
    );

    const frontendBase = env.security.corsOrigin.split(',')[0].trim();
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}`;

    await emailService.sendPasswordReset({
        toName: user.full_name,
        toEmail: user.email,
        resetUrl,
        expiryMinutes: RESET_EXPIRY_MINUTES,
    });

    logger.info('Password reset email sent', { email: user.email });
    return { ok: true, message: 'If that email exists, a reset link has been sent.' };
}

async function validateToken(token) {
    if (!token) throw new BadRequest('Token is required');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const res = await authQuery(
        `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email, u.full_name
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token_hash = $1 AND prt.used_at IS NULL LIMIT 1`,
        [tokenHash]
    );
    if (res.rows.length === 0) throw new BadRequest('Invalid or expired reset link');
    const row = res.rows[0];
    if (new Date(row.expires_at) < new Date()) throw new BadRequest('Reset link has expired');
    return row;
}

async function completeReset({ token, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
        throw new BadRequest('Password must be at least 8 characters');
    }
    const tokenRow = await validateToken(token);
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await authQuery(
        `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
        [passwordHash, tokenRow.user_id]
    );

    // Mark token as used
    await authQuery(
        `UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`,
        [tokenRow.id]
    );

    // Revoke all sessions
    await authQuery(
        `UPDATE user_sessions SET revoked_at = now()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [tokenRow.user_id]
    );

    return { ok: true, message: 'Password updated. Please log in with your new password.' };
}

module.exports = { requestReset, validateToken, completeReset };