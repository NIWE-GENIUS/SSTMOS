// backend/src/services/roomService.js
'use strict';

const { withTenantContext } = require('../config/db');
const { NotFound, BadRequest } = require('../utils/errors');

async function createRoomType(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO room_types (school_id, code, name, description)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [schoolId, data.code, data.name, data.description || null]
        );
        return r.rows[0];
    });
}

async function listRoomTypes(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT * FROM room_types
             WHERE (school_id = $1 OR school_id IS NULL) AND is_active
             ORDER BY school_id NULLS FIRST, code`,
            [schoolId]
        );
        return r.rows;
    });
}

async function createRoom(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO rooms (school_id, room_type_id, name, location, capacity, equipment, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                schoolId,
                data.room_type_id,
                data.name,
                data.location || null,
                data.capacity || 0,
                JSON.stringify(data.equipment || []),
                data.status || 'active',
            ]
        );
        return r.rows[0];
    });
}

async function listRooms(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT r.*, rt.code AS room_type_code, rt.name AS room_type_name
             FROM rooms r
             JOIN room_types rt ON rt.id = r.room_type_id
             WHERE r.school_id = $1
             ORDER BY r.name`,
            [schoolId]
        );
        return r.rows;
    });
}

async function updateRoom(schoolId, actorId, id, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const fields = Object.keys(data);
        if (!fields.length) throw new BadRequest('No fields to update');
        const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const r = await c.query(
            `UPDATE rooms SET ${sets}, updated_at = now()
             WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, schoolId, ...Object.values(data)]
        );
        if (!r.rows.length) throw new NotFound('Room not found');
        return r.rows[0];
    });
}

async function deleteRoom(schoolId, actorId, id) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `DELETE FROM rooms WHERE id = $1 AND school_id = $2 RETURNING id`,
            [id, schoolId]
        );
        if (!r.rows.length) throw new NotFound('Room not found');
        return { id, deleted: true };
    });
}

async function createMaintenance(schoolId, actorId, data) {
    return await withTenantContext({ schoolId, userId: actorId }, async (c) => {
        const r = await c.query(
            `INSERT INTO room_maintenance (school_id, room_id, start_at, end_at, reason, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [schoolId, data.room_id, data.start_at, data.end_at, data.reason || null, actorId]
        );
        return r.rows[0];
    });
}

async function listMaintenance(schoolId) {
    return await withTenantContext({ schoolId, userId: null }, async (c) => {
        const r = await c.query(
            `SELECT rm.*, r.name AS room_name
             FROM room_maintenance rm
             JOIN rooms r ON r.id = rm.room_id
             WHERE rm.school_id = $1
             ORDER BY rm.start_at DESC`,
            [schoolId]
        );
        return r.rows;
    });
}

module.exports = {
    createRoomType, listRoomTypes,
    createRoom, listRooms, updateRoom, deleteRoom,
    createMaintenance, listMaintenance,
};