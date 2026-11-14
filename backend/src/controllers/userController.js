// backend/src/controllers/userController.js
'use strict';

const svc = require('../services/userService');
const { validateCreateUser } = require('../validators/userValidators');
const { BadRequest } = require('../utils/errors');

async function createFirstDos(req, res, next) {
    try {
        const data = validateCreateUser(req.body || {}, { allowRoles: ['dos'] });
        const user = await svc.onboardFirstDOS(req.params.id, data, req.user.id);
        res.status(201).json(user);
    } catch (err) { next(err); }
}

async function createInSchool(req, res, next) {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) throw new BadRequest('School context required');
        const data = validateCreateUser(req.body || {}, { allowRoles: svc.SCHOOL_ROLES });
        if (data.role === 'dos') throw new BadRequest('Cannot create another DOS this way');
        const user = await svc.createSchoolUser(schoolId, data, req.user.id);
        res.status(201).json(user);
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) throw new BadRequest('School context required');
        res.json({ data: await svc.listSchoolUsers(schoolId) });
    } catch (err) { next(err); }
}

async function deactivate(req, res, next) {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) throw new BadRequest('School context required');
        res.json(await svc.deactivateUser(schoolId, req.params.id, req.user.id));
    } catch (err) { next(err); }
}

module.exports = { createFirstDos, createInSchool, list, deactivate };