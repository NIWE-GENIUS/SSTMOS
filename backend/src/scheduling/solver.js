'use strict';

/**
 * SSTMOS scheduling engine.
 * Greedy-with-scoring heuristic.
 *
 * Input:
 *   {
 *     periods: [{ id, period_number, start_time, end_time, session_id }],
 *     breaks:  [{ start_time, end_time }],  // to detect break-adjacency
 *     classes: [{ id, name }],
 *     assignments: [{
 *       id, module_id, module_code, module_name, class_id, trainer_id, trainer_name,
 *       weekly_periods, sequence_length, split_session_pattern, module_type, priority,
 *       required_room_type_ids: [uuid, ...],       // mandatory room types
 *       trainer_available_map: { [day]: { [period_id]: bool } },  // from availability
 *       trainer_max_weekly: number
 *     }],
 *     rooms: [{ id, room_type_id }],
 *     workingDays: [1,2,3,4,5]
 *   }
 *
 * Output:
 *   {
 *     entries: [{ assignment_id, class_id, trainer_id, room_id, day_of_week,
 *                 period_id, sequence_length, split_session_pattern, segment_period_ids }],
 *     unassigned: [{ assignment_id, reason }],
 *     conflicts: [],
 *     summary: { total_required, scheduled, unscheduled }
 *   }
 */
function solve(input) {
    const { periods, classes, assignments, rooms, workingDays } = input;

    // Resource occupancy: `${day}|${periodId}` → Set of trainerId/classId/roomId
    const trainerBusy = new Map();
    const classBusy   = new Map();
    const roomBusy    = new Map();
    const trainerWeekly = new Map();  // trainerId → count of scheduled periods
    const modulePerDay  = new Map();  // `${classId}|${day}|${moduleId}` → count

    const entries = [];
    const unassigned = [];

    // Sort: constrained-first. Higher priority first, then more weekly periods,
    // then trainers with tighter caps, then practical (lab) modules.
    const sorted = [...assignments].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.weekly_periods !== a.weekly_periods) return b.weekly_periods - a.weekly_periods;
        const aCap = a.trainer_max_weekly || 99, bCap = b.trainer_max_weekly || 99;
        if (aCap !== bCap) return aCap - bCap;
        if (a.module_type === 'practical' && b.module_type !== 'practical') return -1;
        if (b.module_type === 'practical' && a.module_type !== 'practical') return 1;
        return 0;
    });

    for (const asn of sorted) {
        const remaining = asn.weekly_periods;
        let placed = 0;
        let attempts = 0;

        // Try each day, then each period, for each remaining occurrence.
        // Occurrences = ceil(remaining / sequence_length).
        // Split session means one occurrence spans two segments separated by a break.

        const occurrencesNeeded = asn.split_session_pattern !== 'none'
            ? remaining / 2
            : Math.ceil(remaining / asn.sequence_length);

        let occ = 0;
        while (placed < remaining && occ < occurrencesNeeded) {
            occ++;
            attempts++;
            if (attempts > 200) break;

            const placement = findPlacement(asn, { periods, workingDays, trainerBusy, classBusy, roomBusy, modulePerDay, rooms, trainerWeekly });

            if (!placement) {
                // Give up on this assignment
                break;
            }

            // Commit
            for (const slot of placement.slots) {
                const key = `${slot.day}|${slot.periodId}`;
                markBusy(trainerBusy, key, asn.trainer_id);
                markBusy(classBusy, key, asn.class_id);
                if (placement.roomId) markBusy(roomBusy, key, placement.roomId);
                trainerWeekly.set(asn.trainer_id, (trainerWeekly.get(asn.trainer_id) || 0) + 1);
            }
            const dayKey = `${asn.class_id}|${placement.slots[0].day}|${asn.module_id}`;
            modulePerDay.set(dayKey, (modulePerDay.get(dayKey) || 0) + 1);

            entries.push({
                assignment_id: asn.id,
                class_id: asn.class_id,
                trainer_id: asn.trainer_id,
                room_id: placement.roomId,
                day_of_week: placement.slots[0].day,
                period_id: placement.slots[0].periodId,
                sequence_length: placement.slots.length,
                split_session_pattern: asn.split_session_pattern,
                segment_period_ids: placement.slots.map(s => s.periodId),
            });
            placed += placement.slots.length;
        }

        if (placed < asn.weekly_periods) {
            unassigned.push({
                assignment_id: asn.id,
                module: asn.module_code,
                class: classes.find(c => c.id === asn.class_id)?.name,
                trainer: asn.trainer_name,
                needed: asn.weekly_periods,
                placed,
                reason: placed === 0 ? 'No feasible slot found' : `Only ${placed}/${asn.weekly_periods} placed`,
            });
        }
    }

    const totalRequired = assignments.reduce((s, a) => s + a.weekly_periods, 0);
    const scheduled = entries.reduce((s, e) => s + e.sequence_length, 0);

    return {
        entries,
        unassigned,
        conflicts: [],   // hard constraint violations should never happen given checks
        summary: {
            totalRequired,
            scheduled,
            unscheduled: totalRequired - scheduled,
            fullyScheduled: unassigned.length === 0,
        },
    };
}

function findPlacement(asn, ctx) {
    const { periods, workingDays, trainerBusy, classBusy, roomBusy, modulePerDay, rooms, trainerWeekly } = ctx;
    const maxWeekly = asn.trainer_max_weekly || Infinity;
    const currentWeekly = trainerWeekly.get(asn.trainer_id) || 0;
    if (currentWeekly + asn.sequence_length > maxWeekly) return null;

    const sortedPeriods = [...periods].sort((a, b) => a.period_number - b.period_number);

    // Build period adjacency for sequences: for a sequence of N, need N consecutive periods
    const sequences = [];
    for (let i = 0; i <= sortedPeriods.length - asn.sequence_length; i++) {
        const seq = sortedPeriods.slice(i, i + asn.sequence_length);
        // Must be consecutive period_number
        let ok = true;
        for (let j = 1; j < seq.length; j++) {
            if (seq[j].period_number !== seq[j - 1].period_number + 1) { ok = false; break; }
        }
        if (ok) sequences.push(seq);
    }

    // Split session: sequence must have 1 period on each side of a break
    // We detect "break-adjacent" by looking at period_number gaps: a break exists between period N and N+1 if that pair is not consecutive in the sequence candidates
    // Simpler: with split_pattern=morning_break, we want one segment in the first session, one in the second session — detect via session_id difference
    let candidateSlots;

    if (asn.split_session_pattern !== 'none') {
        // Pair of periods across a break: find two single-periods in different sessions
        candidateSlots = [];
        for (let i = 0; i < sortedPeriods.length; i++) {
            for (let j = i + 1; j < sortedPeriods.length; j++) {
                const a = sortedPeriods[i], b = sortedPeriods[j];
                if (a.session_id && b.session_id && a.session_id !== b.session_id) {
                    candidateSlots.push([a, b]);
                }
            }
        }
    } else {
        candidateSlots = sequences;
    }

    // Score each candidate slot, pick first valid (or best if optimizing later)
    for (const day of workingDays) {
        for (const slot of candidateSlots) {
            // Check trainer availability on this day
            const availMap = asn.trainer_available_map || {};
            const dayAvail = availMap[day] || {};
            let availOk = true;
            for (const p of slot) {
                if (dayAvail[p.id] === false) { availOk = false; break; }
            }
            if (!availOk) continue;

            // Daily occurrence rule: module once per day per class
            const dayKey = `${asn.class_id}|${day}|${asn.module_id}`;
            if (modulePerDay.get(dayKey)) continue;

            // Resource checks
            let ok = true;
            for (const p of slot) {
                const key = `${day}|${p.id}`;
                if (trainerBusy.get(key)?.has(asn.trainer_id)) { ok = false; break; }
                if (classBusy.get(key)?.has(asn.class_id)) { ok = false; break; }
            }
            if (!ok) continue;

            // Room: find one that fits the required type AND is free for all slot periods
            let roomId = null;
            const requiredTypes = asn.required_room_type_ids || [];
            if (asn.module_type === 'practical' || requiredTypes.length) {
                for (const r of rooms) {
                    if (requiredTypes.length && !requiredTypes.includes(r.room_type_id)) continue;
                    let roomOk = true;
                    for (const p of slot) {
                        if (roomBusy.get(`${day}|${p.id}`)?.has(r.id)) { roomOk = false; break; }
                    }
                    if (roomOk) { roomId = r.id; break; }
                }
                if (!roomId) continue;
            }

            return { slots: slot.map(p => ({ day, periodId: p.id })), roomId };
        }
    }
    return null;
}

function markBusy(map, key, id) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(id);
}

module.exports = { solve };