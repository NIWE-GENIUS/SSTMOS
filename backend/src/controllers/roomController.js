'use strict';
const svc = require('../services/roomService');
const { BadRequest } = require('../utils/errors');
function sid(req) { if (!req.user.schoolId) throw new BadRequest('School context required'); return req.user.schoolId; }
const snake = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, m => '_' + m.toLowerCase()), v]));

module.exports = {
    createType: async (req, res, next) => { try { res.status(201).json(await svc.createRoomType(sid(req), req.user.id, req.body || {})); } catch (e) { next(e); } },
    listTypes: async (req, res, next) => { try { res.json({ data: await svc.listRoomTypes(sid(req)) }); } catch (e) { next(e); } },
    createRoom: async (req, res, next) => { try { res.status(201).json(await svc.createRoom(sid(req), req.user.id, snake(req.body || {}))); } catch (e) { next(e); } },
    listRooms: async (req, res, next) => { try { res.json({ data: await svc.listRooms(sid(req)) }); } catch (e) { next(e); } },
    updateRoom: async (req, res, next) => { try { res.json(await svc.updateRoom(sid(req), req.user.id, req.params.id, snake(req.body || {}))); } catch (e) { next(e); } },
    deleteRoom: async (req, res, next) => { try { res.json(await svc.deleteRoom(sid(req), req.user.id, req.params.id)); } catch (e) { next(e); } },
    createMaintenance: async (req, res, next) => { try { res.status(201).json(await svc.createMaintenance(sid(req), req.user.id, snake(req.body || {}))); } catch (e) { next(e); } },
    listMaintenance: async (req, res, next) => { try { res.json({ data: await svc.listMaintenance(sid(req)) }); } catch (e) { next(e); } },
};