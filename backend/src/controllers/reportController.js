'use strict';
const svc = require('../services/reportService');
const { BadRequest } = require('../utils/errors');
function sid(req) { if (!req.user.schoolId) throw new BadRequest('School context required'); return req.user.schoolId; }
module.exports = {
    trainerWorkload: async (req, res, next) => { try { res.json({ data: await svc.trainerWorkload(sid(req)) }); } catch (e) { next(e); } },
    moduleCoverage: async (req, res, next) => { try { res.json({ data: await svc.moduleCoverage(sid(req), req.query.versionId) }); } catch (e) { next(e); } },
    roomUtilization: async (req, res, next) => { try { res.json({ data: await svc.roomUtilization(sid(req), req.query.versionId) }); } catch (e) { next(e); } },
};