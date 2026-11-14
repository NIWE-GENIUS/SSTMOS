// backend/src/routes/schoolRoutes.js
'use strict';

const express = require('express');
const schoolController = require('../controllers/schoolController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();

// Every route in this file requires authentication
router.use(authenticate);

// ---- CRUD ----
router.post('/', requirePermission('platform.school.register'), schoolController.create);
router.get('/', requirePermission('platform.school.manage'), schoolController.list);
router.get('/:id', requirePermission('platform.school.manage'), schoolController.getOne);
router.patch('/:id', requirePermission('platform.school.manage'), schoolController.update);

// ---- Lifecycle ----
router.post('/:id/activate', requirePermission('platform.school.manage'), schoolController.activate);
router.post('/:id/suspend', requirePermission('platform.school.manage'), schoolController.suspend);
router.post('/:id/deactivate', requirePermission('platform.school.manage'), schoolController.deactivate);
router.post('/:id/renew', requirePermission('platform.school.manage'), schoolController.renew);
router.get('/:id/subscription', requirePermission('platform.school.manage'), schoolController.subscription);

module.exports = router;