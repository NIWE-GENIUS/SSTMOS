'use strict';
const svc = require('../services/dashboardService');
async function stats(req, res, next) { try { res.json(await svc.getStats()); } catch (e) { next(e); } }
module.exports = { stats };