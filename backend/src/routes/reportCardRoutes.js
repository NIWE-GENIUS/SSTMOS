// backend/src/routes/reportCardRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/reportCardController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.post('/generate', requirePermission('report.grade'), ctrl.generate);
router.get('/', requirePermission('report.grade'), ctrl.list);
router.get('/:id', requirePermission('report.grade'), ctrl.getOne);
router.post('/:id/publish', requirePermission('report.grade'), ctrl.publish);

module.exports = router;