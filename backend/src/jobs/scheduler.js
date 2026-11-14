// backend/src/jobs/scheduler.js
'use strict';

const cron = require('node-cron');
const { expireSubscriptions } = require('./expirationJob');
const logger = require('../utils/logger');

let started = false;

function startScheduler() {
    if (started) return;
    started = true;

    // Hourly: expire overdue subscriptions
    cron.schedule('0 * * * *', async () => {
        logger.info('Expiration cron: running');
        const result = await expireSubscriptions();
        logger.info('Expiration cron: complete', result);
    });

    // Startup check (5s delay so DB connection is warm)
    setTimeout(async () => {
        const result = await expireSubscriptions();
        logger.info('Expiration cron: startup check complete', result);
    }, 5000);

    logger.info('Scheduler started (expiration runs hourly + on startup)');
}

module.exports = { startScheduler };