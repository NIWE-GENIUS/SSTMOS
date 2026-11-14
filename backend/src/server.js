// backend/src/server.js
'use strict';

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { shutdown: shutdownDb } = require('./config/db');
const { startScheduler } = require('./jobs/scheduler');

const server = http.createServer(app);

server.listen(env.port, () => {
    logger.info('SSTMOS backend listening', {
        port: env.port,
        env: env.nodeEnv,
        url: `${env.apiBaseUrl}/health`,
    });

    // Start background jobs once the server is ready
    try {
        startScheduler();
    } catch (err) {
        logger.error('Failed to start scheduler', { message: err.message, stack: err.stack });
    }
});

async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
        try { await shutdownDb(); } catch (e) { logger.error('DB shutdown failed', { message: e.message }); }
        logger.info('Shutdown complete');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection', { message: err.message, stack: err.stack });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — shutting down', { message: err.message, stack: err.stack });
    gracefulShutdown('uncaughtException');
});

module.exports = server;