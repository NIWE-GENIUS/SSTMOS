'use strict';
const svc = require('../services/timetableConfigService');
const { BadRequest } = require('../utils/errors');
function sid(req) { if (!req.user.schoolId) throw new BadRequest('School context required'); return req.user.schoolId; }
const snake = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), v]));

module.exports = {
    create: async (req, res, next) => { try { res.status(201).json(await svc.createFormat(sid(req), req.user.id, snake(req.body || {}))); } catch (e) { next(e); } },
    getActive: async (req, res, next) => { try { res.json(await svc.getActiveFormat(sid(req))); } catch (e) { next(e); } },
    buildFull: async (req, res, next) => { try { res.status(201).json(await svc.buildFullFormat(sid(req), req.user.id, req.body || {})); } catch (e) { next(e); } },
};