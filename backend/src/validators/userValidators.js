// backend/src/validators/userValidators.js
'use strict';

const { BadRequest } = require('../utils/errors');

function validateCreateUser(body, { allowRoles }) {
    const errors = [];

    if (!body.email || !String(body.email).includes('@')) {
        errors.push({ field: 'email', message: 'valid email required' });
    }
    if (!body.fullName || !String(body.fullName).trim()) {
        errors.push({ field: 'fullName', message: 'required' });
    }
    if (!body.password || String(body.password).length < 8) {
        errors.push({ field: 'password', message: 'min 8 chars' });
    }
    if (!body.role || !allowRoles.includes(body.role)) {
        errors.push({ field: 'role', message: `must be one of: ${allowRoles.join(', ')}` });
    }

    if (errors.length) throw new BadRequest('Validation failed', errors);

    return {
        email: String(body.email).trim().toLowerCase(),
        fullName: String(body.fullName).trim(),
        password: String(body.password),
        role: String(body.role),
        username: body.username ? String(body.username).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
    };
}

module.exports = { validateCreateUser };