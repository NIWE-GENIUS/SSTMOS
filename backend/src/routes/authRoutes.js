// backend/src/routes/authRoutes.js
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// Stricter rate limit on login (anti brute-force)
const env = require('../config/env');

// 100 attempts/15min in dev, 10 attempts/15min in production
const loginLimiter = env.security.rateLimitEnabled
    ? rateLimit({
          windowMs: 15 * 60 * 1000,
          max: env.isProd ? 10 : 1000,
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
      })
    : (req, res, next) => next();  // bypass entirely when disabled

router.post('/login',    loginLimiter, authController.login);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authController.logout);
router.get('/me',        authenticate, authController.me);
router.post('/password/change', authenticate, authController.changePassword);

module.exports = router;