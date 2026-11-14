// backend/src/routes/academicRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/academicController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

function wire(path, handlers, perm) {
    router.post(path, requirePermission(perm), handlers.create);
    router.get(path, requirePermission('academic.level.manage'), handlers.list);
    router.patch(`${path}/:id`, requirePermission(perm), handlers.update);
    router.delete(`${path}/:id`, requirePermission(perm), handlers.delete);
}

wire('/academic-years',     ctrl.academicYears,     'academic.year.manage');
wire('/terms',              ctrl.terms,             'academic.year.manage');
wire('/educational-levels', ctrl.educationalLevels, 'academic.level.manage');
wire('/classes',            ctrl.classes,           'academic.class.manage');
wire('/student-groups',     ctrl.studentGroups,     'academic.class.manage');
wire('/holidays',           ctrl.holidays,          'academic.calendar.manage');
wire('/calendar-events',    ctrl.calendarEvents,    'academic.calendar.manage');

module.exports = router;