// backend/src/routes/userRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();

// Every route requires authentication
router.use(authenticate);

// Platform admin onboards first DOS for a school
router.post(
    '/:id/onboarding',
    requirePermission('platform.school.manage'),
    ctrl.createFirstDos
);

// School-scoped user CRUD (DOS manages their own school)
router.post('/users', requirePermission('school.user.manage'), ctrl.createInSchool);
router.get('/users', requirePermission('school.user.manage'), ctrl.list);
router.delete('/users/:id', requirePermission('school.user.manage'), ctrl.deactivate);

module.exports = router;