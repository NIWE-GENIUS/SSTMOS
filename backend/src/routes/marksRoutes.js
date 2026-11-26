// backend/src/routes/marksRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/marksController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.post('/', requirePermission('marks.record'), ctrl.record);
router.patch('/:id', requirePermission('marks.record'), ctrl.update);
router.delete('/:id', requirePermission('marks.record'), ctrl.delete);
router.get('/class', requirePermission('marks.view.class'), ctrl.listForClass);
router.get('/student', requirePermission('marks.view.class'), ctrl.listForStudent);
router.get('/overview', requirePermission('marks.view.class'), ctrl.overview);

module.exports = router;