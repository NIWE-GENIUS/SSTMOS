// backend/src/services/contactService.js
'use strict';

const { rawQuery } = require('../config/db');
const emailService = require('./emailService');
const { NotFound, BadRequest, Conflict } = require('../utils/errors');
const logger = require('../utils/logger');

async function generateReference() {
    const year = new Date().getFullYear();
    const res = await rawQuery(
        `SELECT reference_number FROM contact_messages
         WHERE reference_number LIKE $1 ORDER BY reference_number DESC LIMIT 1`,
        [`CNT-${year}-%`]
    );
    let next = 1;
    if (res.rows.length > 0) {
        next = parseInt(res.rows[0].reference_number.split('-')[2], 10) + 1;
    }
    return `CNT-${year}-${String(next).padStart(4, '0')}`;
}

async function submitMessage({ name, email, subject, message, ip, userAgent }) {
    if (!name || !email || !subject || !message) {
        throw new BadRequest('All fields are required');
    }
    if (name.length > 255 || email.length > 255 || subject.length > 500) {
        throw new BadRequest('Field length exceeded');
    }
    if (message.length > 5000) {
        throw new BadRequest('Message is too long (max 5000 characters)');
    }

    const reference = await generateReference();

    const insert = await rawQuery(
        `INSERT INTO contact_messages
            (reference_number, sender_name, sender_email, subject, message, visitor_ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, reference_number, created_at`,
        [reference, name, email, subject, message, ip || null, userAgent || null]
    );
    const row = insert.rows[0];

    // Fire-and-forget emails (don't block the API response)
    Promise.all([
        emailService.sendContactConfirmation({
            toName: name,
            toEmail: email,
            referenceNumber: reference,
            subject,
        }),
        emailService.sendContactNotification({
            referenceNumber: reference,
            senderName: name,
            senderEmail: email,
            subject,
            message,
        }),
        emailService.addToSubscribers({ email, fullName: name, source: 'contact_form' }),
    ]).catch((err) => {
        logger.error('Contact email delivery failed', { reference, error: err.message });
    });

    return {
        id: row.id,
        referenceNumber: row.reference_number,
        message: 'Your message has been received. Check your email for confirmation.',
    };
}

async function listMessages({ status, search, page = 1, pageSize = 20 }) {
    const conditions = ['1=1'];
    const params = [];
    let i = 1;

    if (status) {
        conditions.push(`status = $${i++}`);
        params.push(status);
    }
    if (search) {
        conditions.push(`(sender_name ILIKE $${i} OR sender_email ILIKE $${i} OR subject ILIKE $${i} OR reference_number ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const countRes = await rawQuery(`SELECT count(*)::int AS total FROM contact_messages ${where}`, params);
    const listRes = await rawQuery(
        `SELECT id, reference_number, sender_name, sender_email, subject, status, priority, category, created_at, replied_at
         FROM contact_messages ${where}
         ORDER BY created_at DESC
         LIMIT $${i++} OFFSET $${i++}`,
        [...params, pageSize, offset]
    );

    return {
        data: listRes.rows,
        pagination: { page, pageSize, total: countRes.rows[0].total, totalPages: Math.ceil(countRes.rows[0].total / pageSize) },
    };
}

async function getMessage(id) {
    const msgRes = await rawQuery(`SELECT * FROM contact_messages WHERE id = $1`, [id]);
    if (!msgRes.rows.length) throw new NotFound('Message not found');
    const message = msgRes.rows[0];

    const repliesRes = await rawQuery(
        `SELECT cr.*, u.full_name AS admin_name
         FROM contact_replies cr
         LEFT JOIN users u ON u.id = cr.admin_user_id
         WHERE cr.message_id = $1
         ORDER BY cr.created_at ASC`,
        [id]
    );

    return { ...message, replies: repliesRes.rows };
}

async function sendReply({ messageId, adminUserId, replyBody }) {
    if (!replyBody || replyBody.trim().length < 5) {
        throw new BadRequest('Reply body is required');
    }

    const msgRes = await rawQuery(`SELECT * FROM contact_messages WHERE id = $1`, [messageId]);
    if (!msgRes.rows.length) throw new NotFound('Message not found');
    const message = msgRes.rows[0];

    const emailResult = await emailService.sendContactReply({
        toName: message.sender_name,
        toEmail: message.sender_email,
        referenceNumber: message.reference_number,
        originalSubject: message.subject,
        replyBody,
    });

    const insert = await rawQuery(
        `INSERT INTO contact_replies
            (message_id, admin_user_id, reply_body, email_sent, email_sent_at, email_error)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            messageId,
            adminUserId,
            replyBody,
            emailResult.success === true,
            emailResult.success ? new Date() : null,
            emailResult.error ? String(emailResult.error).slice(0, 500) : null,
        ]
    );

    await rawQuery(
        `UPDATE contact_messages
         SET status = 'replied', replied_at = now(), replied_by = $2, updated_at = now()
         WHERE id = $1`,
        [messageId, adminUserId]
    );

    return {
        reply: insert.rows[0],
        emailSent: emailResult.success === true,
        emailError: emailResult.error || null,
    };
}

async function updateStatus({ messageId, status }) {
    const allowed = ['pending', 'replied', 'closed', 'spam'];
    if (!allowed.includes(status)) throw new BadRequest(`Status must be one of: ${allowed.join(', ')}`);

    const res = await rawQuery(
        `UPDATE contact_messages SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status`,
        [status, messageId]
    );
    if (!res.rows.length) throw new NotFound('Message not found');
    return res.rows[0];
}

async function getStats() {
    const res = await rawQuery(`
        SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE status = 'pending')::int AS pending,
            count(*) FILTER (WHERE status = 'replied')::int AS replied,
            count(*) FILTER (WHERE status = 'spam')::int AS spam
        FROM contact_messages
    `);
    return res.rows[0];
}

module.exports = { submitMessage, listMessages, getMessage, sendReply, updateStatus, getStats };