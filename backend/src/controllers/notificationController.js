'use strict';
const svc = require('../services/notificationService');
const { BadRequest } = require('../utils/errors');
module.exports = {
    list: async (req, res, next) => {
        try { res.json({ data: await svc.listForUser(req.user.id, req.user.schoolId) }); } catch (e) { next(e); }
    },
    markRead: async (req, res, next) => {
        try { res.json(await svc.markRead(req.user.id, req.user.schoolId, req.params.id)); } catch (e) { next(e); }
    },
    createAnnouncement: async (req, res, next) => {
        try {
            if (!req.user.schoolId) throw new BadRequest('School context required');
            res.status(201).json(await svc.createAnnouncement(req.user.schoolId, req.user.id, req.body || {}));
        } catch (e) { next(e); }
    },
    listAnnouncements: async (req, res, next) => {
        try {
            if (!req.user.schoolId) throw new BadRequest('School context required');
            res.json({ data: await svc.listAnnouncements(req.user.schoolId) });
        } catch (e) { next(e); }
    },
};