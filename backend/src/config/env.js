
'use strict';

require('dotenv').config();

function required(name) {
    const value = process.env[name];

    if (!value || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value.trim();
}

function optional(name, fallback) {
    const value = process.env[name];

    return value === undefined || value.trim() === ''
        ? fallback
        : value.trim();
}

function int(name, fallback) {
    const value = process.env[name];

    if (value === undefined || value.trim() === '') {
        return fallback;
    }

    const number = Number(value);

    if (!Number.isInteger(number)) {
        throw new Error(`Environment variable ${name} must be an integer`);
    }

    return number;
}

const nodeEnv = optional('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';

const env = {
    nodeEnv,
    isProd,

    port: int('PORT', 4000),

    apiBaseUrl: optional(
        'API_BASE_URL',
        'http://localhost:4000'
    ),

    db: {
        host: required('DB_HOST'),
        port: int('DB_PORT', 5432),
        name: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASSWORD'),

        poolMax: int('DB_POOL_MAX', 5),
        idleTimeoutMs: int('DB_IDLE_TIMEOUT_MS', 30000),

        // Optional separate authentication pool
        authUser: optional('DB_AUTH_USER', ''),
        authPassword: optional('DB_AUTH_PASSWORD', ''),
    },

    jwt: {
        secret: required('JWT_SECRET'),
        accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
    },

    security: {
        bcryptRounds: int('BCRYPT_ROUNDS', 12),
        rateLimitWindow: int('RATE_LIMIT_WINDOW_MS', 900000),
        rateLimitMax: int('RATE_LIMIT_MAX', 100),
        rateLimitEnabled:
            optional('RATE_LIMIT_ENABLED', 'true') === 'true',

        corsOrigin: optional(
            'CORS_ORIGIN',
            'http://localhost:5173'
        ),
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

if (env.db.authUser && !env.db.authPassword) {
    throw new Error(
        'DB_AUTH_PASSWORD is required when DB_AUTH_USER is configured'
    );
}

if (isProd && env.jwt.secret.length < 32) {
    throw new Error('Production JWT_SECRET must be at least 32 characters');
}
// Inside the `env` object, add:
email: {
    brevoApiKey:     optional('BREVO_API_KEY', ''),
    senderEmail:     optional('BREVO_SENDER_EMAIL', 'noreply@sstmos.com'),
    senderName:      optional('BREVO_SENDER_NAME', 'SSTMOS Support'),
    contactReceiver: optional('CONTACT_RECEIVER_EMAIL', 'habumugishayasson5@gmail.com'),
    adminUrl:        optional('ADMIN_DASHBOARD_URL', 'https://sstmos.vercel.app/platform'),
},

module.exports = env;
