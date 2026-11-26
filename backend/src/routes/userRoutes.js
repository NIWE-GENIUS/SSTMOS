// backend/src/routes/authRoutes.js
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const passwordResetCtrl = require('../controllers/passwordResetController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
});

// Public auth
router.post('/login',   loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout',  authController.logout);

// Password reset (public)
router.post('/password-reset/request',  passwordResetCtrl.requestReset);
router.get('/password-reset/validate',  passwordResetCtrl.validateToken);
router.post('/password-reset/complete', passwordResetCtrl.completeReset);

// Authenticated
router.get('/me', authenticate, authController.me);
router.post('/password/change', authenticate, authController.changePassword);

module.exports = router;