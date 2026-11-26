// backend/src/controllers/contactController.js
'use strict';

const service = require('../services/contactService');
const { BadRequest } = require('../utils/errors');

// Public — no auth
async function submit(req, res, next) {
    try {
        const { name, email, subject, message } = req.body || {};
        const result = await service.submitMessage({
            name: (name || '').trim(),
            email: (email || '').trim().toLowerCase(),
            subject: (subject || '').trim(),
            message: (message || '').trim(),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.status(201).json(result);
    } catch (err) { next(err); }
}

// Admin — requires auth + platform.school.manage permission
async function list(req, res, next) {
    try {
        const { status, search, page, pageSize } = req.query || {};
        res.json(await service.listMessages({
            status,
            search,
            page: parseInt(page, 10) || 1,
            pageSize: Math.min(parseInt(pageSize, 10) || 20, 100),
        }));
    } catch (err) { next(err); }
}

async function getOne(req, res, next) {
    try { res.json(await service.getMessage(req.params.id)); } catch (err) { next(err); }
}

async function reply(req, res, next) {
    try {
        const body = (req.body || {}).replyBody;
        res.json(await service.sendReply({
            messageId: req.params.id,
            adminUserId: req.user.id,
            replyBody: body,
        }));
    } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
    try { res.json(await service.updateStatus({ messageId: req.params.id, status: (req.body || {}).status })); }
    catch (err) { next(err); }
}

async function stats(req, res, next) {
    try { res.json(await service.getStats()); } catch (err) { next(err); }
}

module.exports = { submit, list, getOne, reply, updateStatus, stats };