'use strict';
require('dotenv').config();

function required(name) {
    const v = process.env[name];
    if (!v || v.length === 0) throw new Error(`Missing required environment variable: ${name}`);
    return v;
}
function optional(name, fallback) {
    const v = process.env[name];
    return v === undefined || v === '' ? fallback : v;
}
function int(name, fallback) {
    const v = process.env[name];
    if (v === undefined || v === '') return fallback;
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) throw new Error(`Environment variable ${name} must be an integer`);
    return n;
}

const env = {
    nodeEnv: optional('NODE_ENV', 'development'),
    isProd: optional('NODE_ENV', 'development') === 'production',
    port: int('PORT', 4000),
    apiBaseUrl: optional('API_BASE_URL', 'http://localhost:4000'),
    db: {
        host: optional('DB_HOST', 'localhost'),
        port: int('DB_PORT', 5432),
        name: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASSWORD'),
        poolMax: int('DB_POOL_MAX', 20),
        idleTimeoutMs: int('DB_IDLE_TIMEOUT_MS', 30000),
        authUser: optional('DB_AUTH_USER', ''),
        authPassword: optional('DB_AUTH_PASSWORD', ''),
    },
    jwt: {
        secret: required('JWT_SECRET'),
        accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
    },
    security: {
    bcryptRounds:      int('BCRYPT_ROUNDS', 12),
    rateLimitWindow:   int('RATE_LIMIT_WINDOW_MS', 900000),
    rateLimitMax:      int('RATE_LIMIT_MAX', 100),
    rateLimitEnabled:  optional('RATE_LIMIT_ENABLED', 'true') !== 'false',
    corsOrigin:        optional('CORS_ORIGIN', 'http://localhost:5173'),
},
    smtp: {
        host: optional('SMTP_HOST', ''),
        port: int('SMTP_PORT', 587),
        user: optional('SMTP_USER', ''),
        pass: optional('SMTP_PASS', ''),
        from: optional('SMTP_FROM', 'noreply@sstmos.local'),
    },
    storage: {
        backend: optional('STORAGE_BACKEND', 'local'),
        localPath: optional('STORAGE_LOCAL_PATH', './storage'),
    },
};
module.exports = env;