// backend/src/controllers/marksController.js
'use strict';

const svc = require('../services/marksService');
const { BadRequest } = require('../utils/errors');

function sid(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}

module.exports = {
    record: async (req, res, next) => {
        try {
            res.status(201).json(await svc.recordMark(
                sid(req), req.user.id, req.user.roles || [], req.body || {}
            ));
        } catch (e) { next(e); }
    },
    listForClass: async (req, res, next) => {
        try {
            const { classId, academicYearId, termId } = req.query;
            if (!classId || !academicYearId) throw new BadRequest('classId and academicYearId are required');
            res.json({ data: await svc.listMarksForClass(sid(req), classId, academicYearId, termId) });
        } catch (e) { next(e); }
    },
    listForStudent: async (req, res, next) => {
        try {
            const { studentId, academicYearId, termId } = req.query;
            if (!studentId || !academicYearId) throw new BadRequest('studentId and academicYearId are required');
            res.json({ data: await svc.listMarksForStudent(sid(req), studentId, academicYearId, termId) });
        } catch (e) { next(e); }
    },
    update: async (req, res, next) => {
        try { res.json(await svc.updateMark(sid(req), req.user.id, req.params.id, req.body || {})); }
        catch (e) { next(e); }
    },
    delete: async (req, res, next) => {
        try { res.json(await svc.deleteMark(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
    overview: async (req, res, next) => {
        try {
            const { classId, academicYearId, termId } = req.query;
            if (!classId || !academicYearId) throw new BadRequest('classId and academicYearId are required');
            res.json({ data: await svc.getClassAssessmentOverview(sid(req), classId, academicYearId, termId) });
        } catch (e) { next(e); }
    },
};