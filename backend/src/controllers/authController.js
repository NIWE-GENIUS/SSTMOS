// backend/src/controllers/authController.js
'use strict';

const authService = require('../services/authService');
const { BadRequest } = require('../utils/errors');

async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};
        const result = await authService.login({
            email,
            password,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.json(result);
    } catch (err) { next(err); }
}

async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body || {};
        const result = await authService.refresh({
            refreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.json(result);
    } catch (err) { next(err); }
}

async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body || {};
        await authService.logout({ refreshToken });
        res.json({ ok: true });
    } catch (err) { next(err); }
}

async function me(req, res, next) {
    try {
        const profile = await authService.getProfile(req.user.id);
        res.json(profile);
    } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) throw new BadRequest('currentPassword and newPassword are required');
        await authService.changePassword({ userId: req.user.id, currentPassword, newPassword });
        res.json({ ok: true, message: 'Password changed. All other sessions have been logged out.' });
    } catch (err) { next(err); }
}

module.exports = { login, refresh, logout, me, changePassword };