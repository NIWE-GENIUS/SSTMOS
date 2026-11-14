// backend/src/utils/logger.js
'use strict';

const env = require('../config/env');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = env.isProd ? levels.info : levels.debug;

function log(level, message, meta = {}) {
    if (levels[level] > currentLevel) return;
    const entry = { ts: new Date().toISOString(), level, msg: message, ...meta };
    const line = env.isProd
        ? JSON.stringify(entry)
        : `[${entry.ts}] ${level.toUpperCase()} ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    if (level === 'error') console.error(line);
    else console.log(line);
}

module.exports = {
    error: (m, meta) => log('error', m, meta),
    warn:  (m, meta) => log('warn',  m, meta),
    info:  (m, meta) => log('info',  m, meta),
    debug: (m, meta) => log('debug', m, meta),
};