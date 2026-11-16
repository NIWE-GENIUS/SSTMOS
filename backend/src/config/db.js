// backend/src/config/db.js
'use strict';

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    max: env.db.poolMax,
    idleTimeoutMillis: env.db.idleTimeoutMs,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
});

const authPool = env.db.authUser
    ? new Pool({
          host: env.db.host,
          port: env.db.port,
          database: env.db.name,
          user: env.db.authUser,
          password: env.db.authPassword,
          max: 5,
          idleTimeoutMillis: env.db.idleTimeoutMs,
          connectionTimeoutMillis: 5000,
          ssl: { rejectUnauthorized: false },
      })
    : null;

async function withTenantContext(context, fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const schoolId = context.schoolId || '';
        const userId = context.userId || '';
        const isAdmin = context.isPlatformAdmin === true ? 'true' : 'false';
        await client.query(`SET LOCAL app.current_school_id = '${schoolId.replace(/'/g, "''")}'`);
        await client.query(`SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}'`);
        await client.query(`SET LOCAL app.is_platform_admin = '${isAdmin}'`);
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err;
    } finally {
        client.release();
    }
}

async function rawQuery(text, params) { return pool.query(text, params); }
async function authQuery(text, params) {
    if (!authPool) throw new Error('Auth pool not configured');
    return authPool.query(text, params);
}
async function shutdown() {
    await pool.end();
    if (authPool) await authPool.end();
}

module.exports = { pool, authPool, withTenantContext, rawQuery, authQuery, shutdown };