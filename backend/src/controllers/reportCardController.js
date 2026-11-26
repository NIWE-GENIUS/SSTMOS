// backend/src/controllers/reportCardController.js
'use strict';

const svc = require('../services/reportCardService');
const { BadRequest } = require('../utils/errors');

function sid(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}

module.exports = {
    generate: async (req, res, next) => {
        try { res.status(201).json(await svc.generateReportCard(sid(req), req.user.id, req.body || {})); }
        catch (e) { next(e); }
    },
    list: async (req, res, next) => {
        try { res.json({ data: await svc.listReportCards(sid(req), req.query || {}) }); }
        catch (e) { next(e); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await svc.getReportCard(sid(req), req.params.id)); }
        catch (e) { next(e); }
    },
    publish: async (req, res, next) => {
        try { res.json(await svc.publishReportCard(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
};