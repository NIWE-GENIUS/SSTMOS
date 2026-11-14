// backend/src/middleware/errorHandler.js
'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const env = require('../config/env');

function notFoundHandler(req, res) {
    res.status(404).json({
        error: { code: 'ROUTE_NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}` },
    });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: { code: err.code, message: err.message, details: err.details },
        });
    }

    if (err.code === '23505') {
        return res.status(409).json({
            error: { code: 'DUPLICATE', message: 'A record with this value already exists', details: err.detail },
        });
    }
    if (err.code === '23503') {
        return res.status(409).json({
            error: { code: 'FK_VIOLATION', message: 'Referenced record does not exist or is in use', details: err.detail },
        });
    }
    if (err.code === '23514') {
        return res.status(422).json({
            error: { code: 'CHECK_VIOLATION', message: 'Data violates a required constraint', details: err.detail },
        });
    }
      if (err.code === '42501') {
        return res.status(403).json({
            error: {
                code: 'INSUFFICIENT_PRIVILEGE',
                message: 'Operation not permitted (RLS policy or missing privilege)',
                details: err.message,
            },
        });
    }

    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });

    logger.error('Unhandled error', {
        message: err.message,
        stack: env.isProd ? undefined : err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: env.isProd ? 'An internal error occurred' : err.message,
        },
    });
}

module.exports = { notFoundHandler, errorHandler };