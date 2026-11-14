// backend/src/validators/schoolValidators.js
'use strict';

const { BadRequest } = require('../utils/errors');

const COUNTRY_RE = /^[A-Z]{2,3}$/;

function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validates + normalizes payload for POST /schools (register).
 */
function validateCreateSchool(body) {
    const errors = [];

    const required = ['name', 'shortCode', 'schoolType', 'country', 'officialEmail'];
    for (const field of required) {
        if (!isNonEmptyString(body[field])) {
            errors.push({ field, message: `${field} is required` });
        }
    }

    if (isNonEmptyString(body.country) && !COUNTRY_RE.test(body.country.trim().toUpperCase())) {
        errors.push({ field: 'country', message: 'country must be 2–3 uppercase letters (ISO code)' });
    }

    if (isNonEmptyString(body.officialEmail) && !body.officialEmail.includes('@')) {
        errors.push({ field: 'officialEmail', message: 'officialEmail must be a valid email' });
    }

    if (errors.length > 0) throw new BadRequest('Validation failed', errors);

    return {
        name: body.name.trim(),
        shortCode: body.shortCode.trim().toUpperCase(),
        schoolType: body.schoolType.trim(),
        country: body.country.trim().toUpperCase(),
        province: body.province ? String(body.province).trim() : null,
        district: body.district ? String(body.district).trim() : null,
        physicalAddress: body.physicalAddress ? String(body.physicalAddress).trim() : null,
        officialEmail: body.officialEmail.trim().toLowerCase(),
        telephone: body.telephone ? String(body.telephone).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
    };
}

/**
 * Validates + normalizes payload for PATCH /schools/:id.
 * All fields optional; only include ones the caller sent.
 */
function validateUpdateSchool(body) {
    const update = {};

    if (body.name !== undefined) {
        if (!isNonEmptyString(body.name)) throw new BadRequest('name must be non-empty');
        update.name = body.name.trim();
    }
    if (body.schoolType !== undefined) {
        if (!isNonEmptyString(body.schoolType)) throw new BadRequest('schoolType must be non-empty');
        update.schoolType = body.schoolType.trim();
    }
    if (body.country !== undefined) {
        if (!isNonEmptyString(body.country) || !COUNTRY_RE.test(body.country.trim().toUpperCase())) {
            throw new BadRequest('country must be 2–3 uppercase letters');
        }
        update.country = body.country.trim().toUpperCase();
    }
    if (body.province !== undefined) update.province = body.province || null;
    if (body.district !== undefined) update.district = body.district || null;
    if (body.physicalAddress !== undefined) update.physicalAddress = body.physicalAddress || null;
    if (body.officialEmail !== undefined) {
        if (!isNonEmptyString(body.officialEmail) || !body.officialEmail.includes('@')) {
            throw new BadRequest('officialEmail must be a valid email');
        }
        update.officialEmail = body.officialEmail.trim().toLowerCase();
    }
    if (body.telephone !== undefined) update.telephone = body.telephone || null;
    if (body.notes !== undefined) update.notes = body.notes || null;

    if (Object.keys(update).length === 0) throw new BadRequest('No fields to update');
    return update;
}

/**
 * Parses pagination + filter query params for GET /schools.
 */
function parseListQuery(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
    const status = query.status ? String(query.status).trim() : null;
    const search = query.search ? String(query.search).trim() : null;

    const allowedStatuses = ['pending', 'active', 'suspended', 'expired', 'deactivated'];
    if (status && !allowedStatuses.includes(status)) {
        throw new BadRequest(`status must be one of: ${allowedStatuses.join(', ')}`);
    }

    return { page, pageSize, status, search, offset: (page - 1) * pageSize };
}

module.exports = { validateCreateSchool, validateUpdateSchool, parseListQuery };