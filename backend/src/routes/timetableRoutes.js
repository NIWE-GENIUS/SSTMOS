'use strict';
const express = require('express');
const ctrl = require('../controllers/timetableController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const router = express.Router();
router.use(authenticate);

router.post('/versions', requirePermission('timetable.edit'), ctrl.createVersion);
router.get('/versions', requirePermission('timetable.master.view'), ctrl.listVersions);
router.post('/versions/:id/submit', requirePermission('timetable.edit'), ctrl.submit);
router.post('/versions/:id/approve', requirePermission('timetable.approve'), ctrl.approve);
router.post('/versions/:id/publish', requirePermission('timetable.publish'), ctrl.publish);
router.get('/versions/:id/entries', requirePermission('timetable.master.view'), ctrl.listEntries);
router.get('/views/master', requirePermission('timetable.master.view'), ctrl.master);
router.get('/views/trainer/:trainerId', requirePermission('timetable.master.view'), ctrl.trainer);
router.get('/views/class/:classId', requirePermission('timetable.master.view'), ctrl.class);

module.exports = router;