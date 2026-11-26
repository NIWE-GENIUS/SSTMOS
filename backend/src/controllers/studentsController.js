// backend/src/controllers/studentsController.js
'use strict';

const svc = require('../services/studentsService');
const { BadRequest } = require('../utils/errors');

function sid(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}

module.exports = {
    create: async (req, res, next) => {
        try { res.status(201).json(await svc.createStudent(sid(req), req.user.id, req.body || {})); }
        catch (e) { next(e); }
    },
    list: async (req, res, next) => {
        try { res.json({ data: await svc.listStudents(sid(req), req.query || {}) }); }
        catch (e) { next(e); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await svc.getStudent(sid(req), req.params.id)); }
        catch (e) { next(e); }
    },
    update: async (req, res, next) => {
        try { res.json(await svc.updateStudent(sid(req), req.user.id, req.params.id, req.body || {})); }
        catch (e) { next(e); }
    },
    delete: async (req, res, next) => {
        try { res.json(await svc.deleteStudent(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
    enroll: async (req, res, next) => {
        try { res.status(201).json(await svc.enrollStudent(sid(req), req.user.id, req.body || {})); }
        catch (e) { next(e); }
    },
    listEnrollments: async (req, res, next) => {
        try { res.json({ data: await svc.listEnrollments(sid(req), req.query.classId) }); }
        catch (e) { next(e); }
    },
    removeEnrollment: async (req, res, next) => {
        try { res.json(await svc.removeEnrollment(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
};