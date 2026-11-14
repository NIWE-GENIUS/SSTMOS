// backend/src/routes/trainerRoutes.js
'use strict';

const express = require('express');
const ctrl = require('../controllers/trainerController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

const P = requirePermission('trainer.manage');

router.post('/', P, ctrl.create);
router.get('/', P, ctrl.list);
router.get('/:id', P, ctrl.getOne);
router.patch('/:id', P, ctrl.update);
router.delete('/:id', P, ctrl.delete);
router.put('/:id/workload-limits', P, ctrl.setLimits);
router.put('/:id/availability', P, ctrl.setAvailability);
router.get('/:id/availability', P, ctrl.getAvailability);

module.exports = router;