'use strict';
const { withTenantContext } = require('../config/db');

async function listForUser(userId, schoolId) {
    return await withTenantContext({ schoolId, userId }, async (c) => {
        const r = await c.query(
            `SELECT id, category, title, body, payload, read_at, created_at
             FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [userId]
        );
        return r.rows;
    });
}

async function markRead(userId, schoolId, notificationId) {
    return await withTenantContext({ schoolId, userId }, async (c) => {
        await c.query(`UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
        return { id: notificationId, read: true };
    });
}

async function createAnnouncement(schoolId, actorId, { title, body, expiresAt }) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO announcements (school_id, title, body, created_by, expires_at)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [schoolId, title, body, actorId, expiresAt || null]
        );
        return r.rows[0];
    });
}

async function listAnnouncements(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT * FROM announcements WHERE school_id = $1
             AND publish_at <= now() AND (expires_at IS NULL OR expires_at > now())
             ORDER BY publish_at DESC`, [schoolId]
        );
        return r.rows;
    });
}

module.exports = { listForUser, markRead, createAnnouncement, listAnnouncements };