'use strict';
const express = require('express');
const ctrl = require('../controllers/classTeacherController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);
const P = requirePermission('academic.class.manage');

router.post('/', P, ctrl.assign);
router.get('/', P, ctrl.list);

module.exports = router;