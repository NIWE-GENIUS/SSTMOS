// backend/src/routes/contactRoutes.js
'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/contactController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many messages. Try again later.' } },
});

// PUBLIC
router.post('/', contactLimiter, ctrl.submit);

// ADMIN-ONLY
router.use(authenticate);
router.get('/', requirePermission('platform.school.manage'), ctrl.list);
router.get('/stats', requirePermission('platform.school.manage'), ctrl.stats);
router.get('/:id', requirePermission('platform.school.manage'), ctrl.getOne);
router.post('/:id/reply', requirePermission('platform.school.manage'), ctrl.reply);
router.patch('/:id/status', requirePermission('platform.school.manage'), ctrl.updateStatus);

module.exports = router;