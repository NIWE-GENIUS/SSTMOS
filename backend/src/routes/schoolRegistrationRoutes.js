'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/schoolRegistrationController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();

// Public rate limit on registration submissions
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many submissions from this IP.' } },
});

// PUBLIC
router.post('/', submitLimiter, ctrl.submit);

// ADMIN-ONLY
router.use(authenticate);
router.get('/', requirePermission('platform.school.manage'), ctrl.list);
router.get('/stats', requirePermission('platform.school.manage'), ctrl.stats);
router.get('/:id', requirePermission('platform.school.manage'), ctrl.getOne);
router.post('/:id/approve', requirePermission('platform.school.register'), ctrl.approve);
router.post('/:id/reject', requirePermission('platform.school.register'), ctrl.reject);

module.exports = router;