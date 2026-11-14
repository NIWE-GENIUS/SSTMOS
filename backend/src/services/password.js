// backend/src/services/password.js
'use strict';

const bcrypt = require('bcryptjs');
const env = require('../config/env');

async function hashPassword(plain) {
    if (!plain || plain.length < 8) throw new Error('Password must be at least 8 characters');
    return bcrypt.hash(plain, env.security.bcryptRounds);
}

async function verifyPassword(plain, hash) {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };