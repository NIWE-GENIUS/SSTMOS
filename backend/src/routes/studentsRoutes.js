// backend/src/routes/studentsRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/studentsController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.post('/', requirePermission('student.manage'), ctrl.create);
router.get('/', requirePermission('student.manage'), ctrl.list);
router.get('/:id', requirePermission('student.manage'), ctrl.getOne);
router.patch('/:id', requirePermission('student.manage'), ctrl.update);
router.delete('/:id', requirePermission('student.manage'), ctrl.delete);

router.post('/enrollments', requirePermission('student.enroll'), ctrl.enroll);
router.get('/enrollments/list', requirePermission('student.manage'), ctrl.listEnrollments);
router.delete('/enrollments/:id', requirePermission('student.enroll'), ctrl.removeEnrollment);

module.exports = router;