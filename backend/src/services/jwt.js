// backend/src/services/jwt.js
'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(payload) {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.accessExpiresIn,
        issuer: 'sstmos',
        audience: 'sstmos-app',
    });
}

function signRefreshToken(payload) {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.refreshExpiresIn,
        issuer: 'sstmos',
        audience: 'sstmos-refresh',
    });
}

function verifyAccessToken(token) {
    return jwt.verify(token, env.jwt.secret, {
        issuer: 'sstmos',
        audience: 'sstmos-app',
    });
}

function verifyRefreshToken(token) {
    return jwt.verify(token, env.jwt.secret, {
        issuer: 'sstmos',
        audience: 'sstmos-refresh',
    });
}

// Refresh tokens are stored hashed in user_sessions so a DB leak can't
// be replayed. Same principle as password reset tokens.
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashToken,
};