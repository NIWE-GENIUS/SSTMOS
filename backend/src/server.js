// backend/src/server.js
'use strict';

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { shutdown: shutdownDb } = require('./config/db');

const server = http.createServer(app);

server.listen(env.port, () => {
    logger.info('SSTMOS backend listening', {
        port: env.port,
        env: env.nodeEnv,
        url: `${env.apiBaseUrl}/health`,
    });

    // Only start background jobs when running locally.
    // On Vercel, use a Vercel Cron Job instead of node-cron.
    if (!process.env.VERCEL) {
        try {
            const { startScheduler } = require('./jobs/scheduler');
            startScheduler();
        } catch (err) {
            logger.error('Failed to start scheduler', { message: err.message });
        }
    }
});

async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
        try { await shutdownDb(); } catch (e) { logger.error('DB shutdown failed', { message: e.message }); }
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection', { message: err.message, stack: err.stack });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message, stack: err.stack });
    gracefulShutdown('uncaughtException');
});

module.exports = server;