// backend/src/controllers/timetableController.js
'use strict';

const svc = require('../services/timetableService');
const { BadRequest } = require('../utils/errors');

function sid(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}

// NOTE: no snake() — the timetable service expects camelCase (academicYearId,
// timetableFormatId, changeDescription, etc.). Sending snake_case caused
// null academic_year_id inserts.
module.exports = {
    createVersion: async (req, res, next) => {
        try {
            res.status(201).json(await svc.createVersion(sid(req), req.user.id, req.body || {}));
        } catch (e) { next(e); }
    },
    listVersions: async (req, res, next) => {
        try { res.json({ data: await svc.listVersions(sid(req)) }); }
        catch (e) { next(e); }
    },
    submit: async (req, res, next) => {
        try { res.json(await svc.submitForApproval(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
    approve: async (req, res, next) => {
        try {
            const b = req.body || {};
            res.json(await svc.approveVersion(sid(req), req.user.id, req.params.id, b.decision, b.comments));
        } catch (e) { next(e); }
    },
    publish: async (req, res, next) => {
        try { res.json(await svc.publishVersion(sid(req), req.user.id, req.params.id)); }
        catch (e) { next(e); }
    },
    listEntries: async (req, res, next) => {
        try { res.json({ data: await svc.listEntries(sid(req), req.params.id) }); }
        catch (e) { next(e); }
    },
    master: async (req, res, next) => {
        try { res.json({ data: await svc.getPublishedMaster(sid(req)) }); }
        catch (e) { next(e); }
    },
    trainer: async (req, res, next) => {
        try { res.json({ data: await svc.getTrainerTimetable(req.params.trainerId) }); }
        catch (e) { next(e); }
    },
    class: async (req, res, next) => {
        try { res.json({ data: await svc.getClassTimetable(sid(req), req.params.classId) }); }
        catch (e) { next(e); }
    },
};