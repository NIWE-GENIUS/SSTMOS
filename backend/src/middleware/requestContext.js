// backend/src/middleware/requestContext.js
'use strict';

const crypto = require('crypto');

function requestContext(req, res, next) {
    req.id = req.headers['x-request-id'] || crypto.randomUUID();
    req.startedAt = Date.now();
    res.setHeader('X-Request-Id', req.id);
    next();
}

module.exports = requestContext;