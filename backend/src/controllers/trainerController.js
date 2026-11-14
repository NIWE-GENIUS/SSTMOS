// backend/src/controllers/trainerController.js
'use strict';

const svc = require('../services/trainerService');
const { BadRequest } = require('../utils/errors');

function sid(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}
function snake(o) {
    return Object.fromEntries(
        Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase()), v])
    );
}

module.exports = {
    create: async (req, res, next) => {
        try { res.status(201).json(await svc.createTrainer(sid(req), req.user.id, snake(req.body || {}))); }
        catch (e) { next(e); }
    },
    list: async (req, res, next) => {
        try { res.json({ data: await svc.listTrainers(sid(req)) }); }
        catch (e) { next(e); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await svc.getTrainer(sid(req), req.params.id)); }
        catch (e) { next(e); }
    },
    update: async (req, res, next) => {
        try { res.json(await svc.updateTrainer(sid(req), req.user.id, req.params.id, snake(req.body || {}))); }
        catch (e) { next(e); }
    },
    delete: async (req, res, next) => {
        try { res.json(await svc.deleteTrainer(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
    setLimits: async (req, res, next) => {
        try { res.json(await svc.setWorkloadLimits(sid(req), req.user.id, req.params.id, req.body || {})); }
        catch (e) { next(e); }
    },
    setAvailability: async (req, res, next) => {
        try { res.json(await svc.setAvailability(sid(req), req.user.id, req.params.id, (req.body || {}).slots || [])); }
        catch (e) { next(e); }
    },
    getAvailability: async (req, res, next) => {
        try { res.json({ data: await svc.getAvailability(sid(req), req.params.id) }); }
        catch (e) { next(e); }
    },
};