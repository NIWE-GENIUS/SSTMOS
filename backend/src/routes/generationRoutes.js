'use strict';
const express = require('express');
const ctrl = require('../controllers/generationController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const router = express.Router();
router.use(authenticate);
router.post('/run', requirePermission('timetable.generate'), ctrl.generate);
module.exports = router;