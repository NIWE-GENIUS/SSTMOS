'use strict';
const express = require('express');
const ctrl = require('../controllers/roomController');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);
const P = requirePermission('room.manage');

router.post('/types', P, ctrl.createType);
router.get('/types', P, ctrl.listTypes);
router.post('/rooms', P, ctrl.createRoom);
router.get('/rooms', P, ctrl.listRooms);
router.patch('/rooms/:id', P, ctrl.updateRoom);
router.delete('/rooms/:id', P, ctrl.deleteRoom);
router.post('/maintenance', P, ctrl.createMaintenance);
router.get('/maintenance', P, ctrl.listMaintenance);

module.exports = router;