'use strict';
const svc = require('../services/classTeacherService');
const { BadRequest } = require('../utils/errors');

module.exports = {
    assign: async (req, res, next) => {
        try {
            if (!req.user.schoolId) throw new BadRequest('School context required');
            res.status(201).json(await svc.assignTeacher(req.user.schoolId, req.user.id, req.body));
        } catch (e) { next(e); }
    },
    list: async (req, res, next) => {
        try {
            if (!req.user.schoolId) throw new BadRequest('School context required');
            res.json({ data: await svc.listAssignments(req.user.schoolId) });
        } catch (e) { next(e); }
    }
};