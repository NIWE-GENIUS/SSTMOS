'use strict';
const service = require('../services/schoolRegistrationService');

async function submit(req, res, next) {
    try { res.status(201).json(await service.submitRegistration(req.body || {}, req)); }
    catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        const { status, search, page, pageSize } = req.query || {};
        res.json(await service.listRequests({
            status, search,
            page: parseInt(page, 10) || 1,
            pageSize: Math.min(parseInt(pageSize, 10) || 20, 100),
        }));
    } catch (err) { next(err); }
}

async function getOne(req, res, next) {
    try { res.json(await service.getRequest(req.params.id)); }
    catch (err) { next(err); }
}

async function approve(req, res, next) {
    try {
        const result = await service.approveRequest({
            requestId: req.params.id,
            adminUserId: req.user.id,
            adminOverrides: req.body || {},
        });
        res.json(result);
    } catch (err) { next(err); }
}

async function reject(req, res, next) {
    try {
        res.json(await service.rejectRequest({
            requestId: req.params.id,
            adminUserId: req.user.id,
            reason: (req.body || {}).reason,
        }));
    } catch (err) { next(err); }
}

async function stats(req, res, next) {
    try { res.json(await service.getStats()); }
    catch (err) { next(err); }
}

module.exports = { submit, list, getOne, approve, reject, stats };