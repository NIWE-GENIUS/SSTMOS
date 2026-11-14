// backend/src/services/academicService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest } = require('../utils/errors');

async function createEntity(schoolId, actorId, table, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const cols = Object.keys(data);
        if (cols.length === 0) throw new BadRequest('No fields to insert');
        const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
        const r = await client.query(
            `INSERT INTO ${table} (school_id, ${cols.join(', ')}) VALUES ($1, ${placeholders}) RETURNING *`,
            [schoolId, ...Object.values(data)]
        );
        return r.rows[0];
    });
}

async function listEntities(schoolId, table, orderBy = 'created_at DESC') {
    return await withTenantContext({ schoolId, userId: null }, async (client) => {
        const r = await client.query(
            `SELECT * FROM ${table} WHERE school_id = $1 ORDER BY ${orderBy}`,
            [schoolId]
        );
        return r.rows;
    });
}

async function updateEntity(schoolId, actorId, table, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const cols = Object.keys(data);
        if (cols.length === 0) throw new BadRequest('No fields to update');
        const sets = cols.map((c, i) => `${c} = $${i + 3}`).join(', ');
        const r = await client.query(
            `UPDATE ${table} SET ${sets}, updated_at = now()
             WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, schoolId, ...Object.values(data)]
        );
        if (r.rows.length === 0) throw new NotFound('Not found');
        return r.rows[0];
    });
}

async function deleteEntity(schoolId, actorId, table, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (client) => {
        const r = await client.query(
            `DELETE FROM ${table} WHERE id = $1 AND school_id = $2 RETURNING id`,
            [id, schoolId]
        );
        if (r.rows.length === 0) throw new NotFound('Not found');
        return { id, deleted: true };
    });
}

module.exports = { createEntity, listEntities, updateEntity, deleteEntity };