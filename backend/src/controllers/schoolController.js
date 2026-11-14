// backend/src/controllers/schoolController.js
'use strict';

const schoolService = require('../services/schoolService');
const { validateCreateSchool, validateUpdateSchool, parseListQuery } = require('../validators/schoolValidators');

async function create(req, res, next) {
    try {
        const data = validateCreateSchool(req.body || {});
        const school = await schoolService.createSchool(data, req.user.id);
        res.status(201).json(school);
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        const query = parseListQuery(req.query || {});
        const result = await schoolService.listSchools(query);
        res.json(result);
    } catch (err) { next(err); }
}

async function getOne(req, res, next) {
    try {
        const school = await schoolService.getSchoolById(req.params.id, req.user.id);
        res.json(school);
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const data = validateUpdateSchool(req.body || {});
        const school = await schoolService.updateSchool(req.params.id, data, req.user.id);
        res.json(school);
    } catch (err) { next(err); }
}

async function activate(req, res, next) {
    try {
        const result = await schoolService.activateSchool(req.params.id, req.body || {}, req.user.id);
        res.json(result);
    } catch (err) { next(err); }
}

async function suspend(req, res, next) {
    try {
        const reason = (req.body && req.body.reason) || null;
        const result = await schoolService.suspendSchool(req.params.id, reason, req.user.id);
        res.json(result);
    } catch (err) { next(err); }
}

async function deactivate(req, res, next) {
    try {
        const reason = (req.body && req.body.reason) || null;
        const result = await schoolService.deactivateSchool(req.params.id, reason, req.user.id);
        res.json(result);
    } catch (err) { next(err); }
}

async function renew(req, res, next) {
    try {
        const result = await schoolService.renewSubscription(req.params.id, req.body || {}, req.user.id);
        res.json(result);
    } catch (err) { next(err); }
}

async function subscription(req, res, next) {
    try {
        const result = await schoolService.getSubscription(req.params.id);
        res.json(result);
    } catch (err) { next(err); }
}

module.exports = {
    create,
    list,
    getOne,
    update,
    activate,
    suspend,
    deactivate,
    renew,
    subscription,
};