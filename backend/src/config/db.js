// backend/src/config/db.js
'use strict';

const { Pool } = require('pg');
const env = require('./env');

// Determine environment
const isProduction = env.nodeEnv === 'production';

// PostgreSQL SSL configuration
const sslConfig = isProduction
    ? { rejectUnauthorized: false }
    : false;

// Shared database configuration
const baseConfig = {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    max: env.db.poolMax,
    idleTimeoutMillis: env.db.idleTimeoutMs,
    connectionTimeoutMillis: 30000,

    // Neon PostgreSQL SSL
    ssl: sslConfig,
};

// ==========================================
// MAIN DATABASE POOL
// ==========================================

const pool = new Pool({
    ...baseConfig,
    user: env.db.user,
    password: env.db.password,
});

// ==========================================
// AUTH DATABASE POOL
// ==========================================

const authPool = env.db.authUser
    ? new Pool({
          ...baseConfig,
          user: env.db.authUser,
          password: env.db.authPassword,
          max: 5,
      })
    : null;

// ==========================================
// DATABASE ERROR HANDLING
// ==========================================

pool.on('error', (err) => {
    console.error('[DB] Unexpected main pool error:', err.message);
});

if (authPool) {
    authPool.on('error', (err) => {
        console.error('[DB] Unexpected auth pool error:', err.message);
    });
}

// ==========================================
// TENANT CONTEXT
// ==========================================

async function withTenantContext(context, fn) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const schoolId = context.schoolId || '';
        const userId = context.userId || '';
        const isAdmin = context.isPlatformAdmin === true ? 'true' : 'false';

        await client.query(
            `SET LOCAL app.current_school_id = '${schoolId.replace(/'/g, "''")}'`
        );

        await client.query(
            `SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}'`
        );

        await client.query(
            `SET LOCAL app.is_platform_admin = '${isAdmin}'`
        );

        const result = await fn(client);

        await client.query('COMMIT');

        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {
            // Ignore rollback errors
        }

        throw err;
    } finally {
        client.release();
    }
}

// ==========================================
// QUERY HELPERS
// ==========================================

async function rawQuery(text, params) {
    return pool.query(text, params);
}

async function authQuery(text, params) {
    if (!authPool) {
        throw new Error('Auth pool not configured');
    }

    return authPool.query(text, params);
}

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

async function checkDatabaseConnection() {
    try {
        const result = await pool.query(
            'SELECT NOW() AS server_time, current_database() AS database_name'
        );

        return {
            connected: true,
            database: result.rows[0].database_name,
            serverTime: result.rows[0].server_time,
        };
    } catch (err) {
        console.error('[DB] Connection check failed:', err.message);

        return {
            connected: false,
            error: err.message,
        };
    }
}

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

async function shutdown() {
    await pool.end();

    if (authPool) {
        await authPool.end();
    }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    pool,
    authPool,
    withTenantContext,
    rawQuery,
    authQuery,
    checkDatabaseConnection,
    shutdown,
};