/**
 * Cordinia Round Service (Frontend Local Storage Prototype)
 * Manages doctor rounds and their patient queues.
 *
 * Storage keys:
 *   cordinia_doctor_rounds        → RoundRecord[]
 *   cordinia_round_patients       → RoundPatientRecord[]
 *
 * Future-ready: designed to map cleanly to Firestore collections.
 * Queue generation logic is isolated so it can be replaced by an
 * optimisation algorithm (routing, clinical priority) without touching the UI.
 */

import { getPatients } from './patientService';
import { getHospitalStructure } from './hospitalStructureService';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ROUNDS_KEY = 'cordinia_doctor_rounds';
const QUEUE_KEY = 'cordinia_round_patients';

// ─── Typedefs ──────────────────────────────────────────────────────────────────

/**
 * @typedef {'ACTIVE' | 'COMPLETED'} RoundStatus
 *
 * @typedef {Object} RoundRecord
 * @property {string}      roundId
 * @property {string}      doctorId
 * @property {string}      startedAt         - ISO 8601
 * @property {string|null} endedAt           - ISO 8601, null while active
 * @property {RoundStatus} status
 * @property {string|null} currentPatientId  - patientId of the patient currently being visited
 * @property {string}      createdAt         - ISO 8601
 */

/**
 * @typedef {'WAITING' | 'CURRENT' | 'COMPLETED'} QueueEntryStatus
 *
 * @typedef {Object} RoundPatientRecord
 * @property {string}           roundPatientId
 * @property {string}           roundId
 * @property {string}           patientId
 * @property {number}           sequence       - 1-based position in queue
 * @property {QueueEntryStatus} status
 * @property {string|null}      completedAt    - ISO 8601, null while not completed
 */

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** @returns {RoundRecord[]} */
export function getRounds() {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[roundService] Failed to read rounds:', err);
    return [];
  }
}

/** @param {RoundRecord[]} rounds */
function saveRounds(rounds) {
  try {
    localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds));
  } catch (err) {
    console.warn('[roundService] Failed to save rounds:', err);
  }
}

/** @returns {RoundPatientRecord[]} */
export function getRoundPatients() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[roundService] Failed to read round patients:', err);
    return [];
  }
}

/** @param {RoundPatientRecord[]} entries */
function saveRoundPatients(entries) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[roundService] Failed to save round patients:', err);
  }
}

// ─── ID generation ────────────────────────────────────────────────────────────

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// ─── Queue generation (isolated, replaceable) ─────────────────────────────────

/**
 * Deterministic, location-aware queue generation.
 *
 * Strategy (MVP):
 *   1. Group patients by floor (ascending floor number).
 *   2. Within each floor, group by ward (stable ward insertion order).
 *   3. Within each ward, preserve the patient's original creation order
 *      (createdAt ascending).
 *   Room numbers are used only for display. They are NOT used as sort keys.
 *
 * This function is intentionally pure (no side effects) so it can be
 * replaced by a routing-optimised algorithm without any UI changes.
 *
 * @param {import('./patientService').PatientRecord[]} patients
 * @param {{ floors: object[], wards: object[] }} structure
 * @returns {import('./patientService').PatientRecord[]} ordered patients
 */
function generateOrderedQueue(patients, structure) {
  // Build floor number lookup  { floorId → floorNumber }
  const floorNumberMap = {};
  structure.floors.forEach((f) => {
    floorNumberMap[f.floorId] = f.floorNumber;
  });

  // Build ward insertion-order index  { wardId → index in structure.wards array }
  const wardOrderMap = {};
  structure.wards.forEach((w, idx) => {
    wardOrderMap[w.wardId] = idx;
  });

  return [...patients].sort((a, b) => {
    // 1. Floor number (ascending)
    const floorA = floorNumberMap[a.floorId] ?? 9999;
    const floorB = floorNumberMap[b.floorId] ?? 9999;
    if (floorA !== floorB) return floorA - floorB;

    // 2. Ward insertion order (stable admin-defined ward ordering)
    const wardA = wardOrderMap[a.wardId] ?? 9999;
    const wardB = wardOrderMap[b.wardId] ?? 9999;
    if (wardA !== wardB) return wardA - wardB;

    // 3. Patient creation time (stable tiebreaker within a ward)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

// ─── Core round operations ────────────────────────────────────────────────────

/**
 * Find the currently ACTIVE round for a given doctor.
 * @param {string} doctorId
 * @returns {RoundRecord | null}
 */
export function getActiveRound(doctorId) {
  const rounds = getRounds();
  return rounds.find((r) => r.doctorId === doctorId && r.status === 'ACTIVE') || null;
}

/**
 * Get all queue entries for a given round, sorted by sequence.
 * @param {string} roundId
 * @returns {RoundPatientRecord[]}
 */
export function getQueueForRound(roundId) {
  const all = getRoundPatients();
  return all.filter((rp) => rp.roundId === roundId).sort((a, b) => a.sequence - b.sequence);
}

/**
 * Start a new round for a doctor.
 *
 * Rules:
 * - If an ACTIVE round already exists for this doctor, return it (no duplicate).
 * - Only ACTIVE patients assigned to this doctor are included.
 * - Queue is generated with generateOrderedQueue().
 * - First patient → CURRENT; rest → WAITING.
 *
 * @param {string} doctorId
 * @returns {{ round: RoundRecord, queue: RoundPatientRecord[], alreadyActive: boolean, patientCount: number }}
 */
export function startRound(doctorId) {
  // Guard: return existing active round if one exists
  const existing = getActiveRound(doctorId);
  if (existing) {
    const queue = getQueueForRound(existing.roundId);
    return {
      round: existing,
      queue,
      alreadyActive: true,
      patientCount: queue.length,
    };
  }

  // Find assigned active patients
  const allPatients = getPatients();
  const assignedPatients = allPatients.filter(
    (p) => p.assignedDoctorId === doctorId && p.status === 'Active'
  );

  if (assignedPatients.length === 0) {
    return { round: null, queue: [], alreadyActive: false, patientCount: 0 };
  }

  // Load structure for queue ordering
  const structure = getHospitalStructure();

  // Generate ordered queue
  const ordered = generateOrderedQueue(assignedPatients, structure);

  // Build round record
  const now = new Date().toISOString();
  const round = {
    roundId: generateId('rnd'),
    doctorId,
    startedAt: now,
    endedAt: null,
    status: 'ACTIVE',
    currentPatientId: ordered[0].patientId,
    createdAt: now,
  };

  // Build queue entries
  const queueEntries = ordered.map((patient, idx) => ({
    roundPatientId: generateId('rp'),
    roundId: round.roundId,
    patientId: patient.patientId,
    sequence: idx + 1,
    status: idx === 0 ? 'CURRENT' : 'WAITING',
    startedAt: idx === 0 ? now : null,
    completedAt: null,
  }));

  // Persist
  const rounds = getRounds();
  rounds.push(round);
  saveRounds(rounds);

  const allQueue = getRoundPatients();
  allQueue.push(...queueEntries);
  saveRoundPatients(allQueue);

  return {
    round,
    queue: queueEntries,
    alreadyActive: false,
    patientCount: queueEntries.length,
  };
}

/**
 * Advance the round to the next patient.
 * Marks the current entry as COMPLETED, sets next as CURRENT.
 * If no next patient, marks round as COMPLETED.
 *
 * @param {string} roundId
 * @returns {{ round: RoundRecord, queue: RoundPatientRecord[], roundCompleted: boolean }}
 */
export function advanceRound(roundId) {
  const rounds = getRounds();
  const roundIdx = rounds.findIndex((r) => r.roundId === roundId);
  if (roundIdx === -1) return null;

  const allQueue = getRoundPatients();
  const roundQueue = allQueue
    .filter((rp) => rp.roundId === roundId)
    .sort((a, b) => a.sequence - b.sequence);

  const currentIdx = roundQueue.findIndex((rp) => rp.status === 'CURRENT');
  const now = new Date().toISOString();

  // Mark current as COMPLETED
  if (currentIdx !== -1) {
    const currentEntry = roundQueue[currentIdx];
    const globalIdx = allQueue.findIndex((rp) => rp.roundPatientId === currentEntry.roundPatientId);
    if (globalIdx !== -1) {
      let actualDurationMinutes = null;
      if (currentEntry.startedAt) {
        const startMs = new Date(currentEntry.startedAt).getTime();
        const endMs = new Date(now).getTime();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
          actualDurationMinutes = Math.max(1, Math.floor((endMs - startMs) / (1000 * 60)));
        }
      }

      allQueue[globalIdx] = {
        ...allQueue[globalIdx],
        status: 'COMPLETED',
        completedAt: now,
        actualDurationMinutes: actualDurationMinutes !== null ? actualDurationMinutes : (allQueue[globalIdx].actualDurationMinutes || null),
      };
    }
  }

  // Advance to next WAITING
  const nextEntry = roundQueue.find((rp) => rp.status === 'WAITING');
  let roundCompleted = false;

  if (nextEntry) {
    const nextGlobalIdx = allQueue.findIndex((rp) => rp.roundPatientId === nextEntry.roundPatientId);
    if (nextGlobalIdx !== -1) {
      allQueue[nextGlobalIdx] = { ...allQueue[nextGlobalIdx], status: 'CURRENT', startedAt: now };
    }
    rounds[roundIdx] = { ...rounds[roundIdx], currentPatientId: nextEntry.patientId };
  } else {
    // All patients done → complete the round
    rounds[roundIdx] = { ...rounds[roundIdx], status: 'COMPLETED', endedAt: now, currentPatientId: null };
    roundCompleted = true;
  }

  saveRounds(rounds);
  saveRoundPatients(allQueue);

  const updatedQueue = allQueue
    .filter((rp) => rp.roundId === roundId)
    .sort((a, b) => a.sequence - b.sequence);

  return { round: rounds[roundIdx], queue: updatedQueue, roundCompleted };
}
