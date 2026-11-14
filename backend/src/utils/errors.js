// backend/src/utils/errors.js
'use strict';

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequest     extends AppError { constructor(m, d) { super(m, 400, 'BAD_REQUEST', d); } }
class Unauthorized   extends AppError { constructor(m = 'Authentication required', d) { super(m, 401, 'UNAUTHORIZED', d); } }
class Forbidden      extends AppError { constructor(m = 'Access denied', d) { super(m, 403, 'FORBIDDEN', d); } }
class NotFound       extends AppError { constructor(m = 'Resource not found', d) { super(m, 404, 'NOT_FOUND', d); } }
class Conflict       extends AppError { constructor(m, d) { super(m, 409, 'CONFLICT', d); } }
class Unprocessable  extends AppError { constructor(m, d) { super(m, 422, 'UNPROCESSABLE', d); } }

module.exports = { AppError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Unprocessable };