'use strict';
const express = require('express');
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const router = express.Router();
router.use(authenticate);
router.get('/stats', requirePermission('platform.school.manage'), ctrl.stats);
module.exports = router;