'use strict';
const svc = require('../services/generationService');
const { BadRequest } = require('../utils/errors');
function sid(req) { if (!req.user.schoolId) throw new BadRequest('School context required'); return req.user.schoolId; }
module.exports = {
    generate: async (req, res, next) => {
        try { res.status(201).json(await svc.runGeneration(sid(req), req.user.id, req.body || {})); }
        catch (e) { next(e); }
    },
};