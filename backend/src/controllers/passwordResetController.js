// backend/src/controllers/passwordResetController.js
'use strict';

const service = require('../services/passwordResetService');

async function requestReset(req, res, next) {
    try {
        res.json(await service.requestReset({ email: (req.body || {}).email }));
    } catch (err) { next(err); }
}

async function validateToken(req, res, next) {
    try {
        const row = await service.validateToken(req.query.token);
        res.json({ valid: true, email: row.email });
    } catch (err) {
        res.status(400).json({ valid: false, message: err.message });
    }
}

async function completeReset(req, res, next) {
    try {
        const { token, newPassword } = req.body || {};
        res.json(await service.completeReset({ token, newPassword }));
    } catch (err) { next(err); }
}

module.exports = { requestReset, validateToken, completeReset };