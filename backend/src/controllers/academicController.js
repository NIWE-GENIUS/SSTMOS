// backend/src/controllers/academicController.js
'use strict';

const svc = require('../services/academicService');
const { BadRequest } = require('../utils/errors');

function school(req) {
    if (!req.user.schoolId) throw new BadRequest('School context required');
    return req.user.schoolId;
}

function camelToSnake(s) {
    return s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}

function filter(body, allowed) {
    const out = {};
    for (const k of allowed) {
        if (body[k] !== undefined) out[camelToSnake(k)] = body[k];
    }
    return out;
}

function makeHandlers(table, allowedFields, orderBy) {
    return {
        async create(req, res, next) {
            try {
                const data = filter(req.body || {}, allowedFields);
                res.status(201).json(await svc.createEntity(school(req), req.user.id, table, data));
            } catch (e) { next(e); }
        },
        async list(req, res, next) {
            try {
                res.json({ data: await svc.listEntities(school(req), table, orderBy) });
            } catch (e) { next(e); }
        },
        async update(req, res, next) {
            try {
                const data = filter(req.body || {}, allowedFields);
                res.json(await svc.updateEntity(school(req), req.user.id, table, req.params.id, data));
            } catch (e) { next(e); }
        },
        async delete(req, res, next) {
            try {
                res.json(await svc.deleteEntity(school(req), req.user.id, table, req.params.id));
            } catch (e) { next(e); }
        },
    };
}

module.exports = {
    academicYears: makeHandlers(
        'academic_years',
        ['name', 'startDate', 'endDate', 'isActive'],
        'start_date DESC'
    ),
    terms: makeHandlers(
        'terms',
        ['academicYearId', 'name', 'startDate', 'endDate', 'isActive'],
        'start_date ASC'
    ),
    educationalLevels: makeHandlers(
        'educational_levels',
        ['name', 'code', 'sortOrder', 'isActive'],
        'sort_order ASC, name ASC'
    ),
    classes: makeHandlers(
        'classes',
        ['educationalLevelId', 'academicYearId', 'name', 'tradeSpecialization', 'studentCount', 'homeRoomId', 'status'],
        'name ASC'
    ),
    studentGroups: makeHandlers(
        'student_groups',
        ['classId', 'name', 'capacity'],
        'name ASC'
    ),
    holidays: makeHandlers(
        'holidays',
        ['name', 'startDate', 'endDate'],
        'start_date ASC'
    ),
    calendarEvents: makeHandlers(
        'school_calendar_events',
        ['termId', 'name', 'eventType', 'startDate', 'endDate', 'affectsTimetable', 'notes'],
        'start_date ASC'
    ),
};