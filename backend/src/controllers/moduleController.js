'use strict';
const svc = require('../services/moduleService');
const { BadRequest } = require('../utils/errors');
function sid(req) { if (!req.user.schoolId) throw new BadRequest('School context required'); return req.user.schoolId; }
const snake = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), v]));

module.exports = {
    create: async (req, res, next) => { try { res.status(201).json(await svc.createModule(sid(req), req.user.id, snake(req.body || {}))); } catch (e) { next(e); } },
    list: async (req, res, next) => { try { res.json({ data: await svc.listModules(sid(req)) }); } catch (e) { next(e); } },
    update: async (req, res, next) => { try { res.json(await svc.updateModule(sid(req), req.user.id, req.params.id, snake(req.body || {}))); } catch (e) { next(e); } },
    createAssignment: async (req, res, next) => { try { res.status(201).json(await svc.createAssignment(sid(req), req.user.id, snake(req.body || {}))); } catch (e) { next(e); } },
    listAssignments: async (req, res, next) => { try { res.json({ data: await svc.listAssignments(sid(req), req.query || {}) }); } catch (e) { next(e); } },
    authorizeTrainer: async (req, res, next) => { try { res.json(await svc.authorizeTrainer(sid(req), req.user.id, req.params.id, (req.body || {}).moduleId)); } catch (e) { next(e); } },
    setRoomRequirements: async (req, res, next) => { try { res.json(await svc.setRoomRequirements(sid(req), req.user.id, req.params.id, (req.body || {}).requirements || [])); } catch (e) { next(e); } },
};