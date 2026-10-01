/**
 * Cordinia Patient Service (Frontend Local Storage Prototype)
 * Manages inpatient records and keeps bed occupancy in sync with hospitalStructureService.
 * Key: cordinia_patients  →  PatientRecord[]
 */

import {
  getHospitalStructure,
  saveHospitalStructure,
} from './hospitalStructureService';

const STORAGE_KEY = 'cordinia_patients';

/**
 * @typedef {Object} PatientRecord
 * @property {string} patientId       - "pat-<base36ts>-<rand4>"
 * @property {string} name            - Full name
 * @property {number} age             - 1–120
 * @property {string} gender          - 'Male' | 'Female' | 'Other'
 * @property {string} assignedDoctorId
 * @property {string} floorId
 * @property {string} wardId
 * @property {string} roomId
 * @property {string} bedId
 * @property {string} accessCode      - "ACC-XXXXXX" unique per patient
 * @property {'Active'|'Discharged'} status
 * @property {string} createdAt       - ISO 8601
 */

// ─── Storage helpers ─────────────────────────────────────────────────────────

/** @returns {PatientRecord[]} */
export function getPatients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read patients from localStorage:', err);
    return [];
  }
}

/** @param {PatientRecord[]} patients */
export function savePatients(patients) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (err) {
    console.warn('Failed to save patients to localStorage:', err);
  }
}

// ─── ID / access-code generation ─────────────────────────────────────────────

function generatePatientId() {
  return `pat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Generate a unique 6-char alphanumeric access code in "ACC-XXXXXX" format.
 * @param {PatientRecord[]} existing
 * @returns {string}
 */
function generateAccessCode(existing) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O, I, 0, 1 for readability
  const used = new Set(existing.map((p) => p.accessCode));
  let code;
  do {
    code = 'ACC-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (used.has(code));
  return code;
}

// ─── Bed occupancy helpers ────────────────────────────────────────────────────

/**
 * Mark a bed as Occupied in hospitalStructureService storage.
 * @param {string} bedId
 */
function occupyBed(bedId) {
  if (!bedId) return;
  const structure = getHospitalStructure();
  const idx = structure.beds.findIndex((b) => b.bedId === bedId);
  if (idx !== -1) {
    structure.beds[idx] = { ...structure.beds[idx], status: 'Occupied' };
    saveHospitalStructure(structure);
  }
}

/**
 * Mark a bed as Available in hospitalStructureService storage.
 * @param {string} bedId
 */
function freeBed(bedId) {
  if (!bedId) return;
  const structure = getHospitalStructure();
  const idx = structure.beds.findIndex((b) => b.bedId === bedId);
  if (idx !== -1) {
    structure.beds[idx] = { ...structure.beds[idx], status: 'Available' };
    saveHospitalStructure(structure);
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Register a new patient and occupy their bed.
 * @param {{ name, age, gender, assignedDoctorId, floorId, wardId, roomId, bedId }} data
 * @returns {PatientRecord}
 */
export function addPatient(data) {
  const patients = getPatients();
  const newPatient = {
    patientId: generatePatientId(),
    name: data.name.trim(),
    age: Number(data.age),
    gender: data.gender,
    assignedDoctorId: data.assignedDoctorId,
    floorId: data.floorId,
    wardId: data.wardId,
    roomId: data.roomId,
    bedId: data.bedId,
    accessCode: generateAccessCode(patients),
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  occupyBed(newPatient.bedId);
  patients.push(newPatient);
  savePatients(patients);
  return newPatient;
}

/**
 * Update an existing active patient.
 * If bedId changes, free the old bed and occupy the new one.
 * Doctor assignment can change independently of bed assignment.
 * @param {string} patientId
 * @param {{ name, age, gender, assignedDoctorId, floorId, wardId, roomId, bedId }} data
 * @returns {PatientRecord | null}
 */
export function updatePatient(patientId, data) {
  const patients = getPatients();
  const idx = patients.findIndex((p) => p.patientId === patientId);
  if (idx === -1) return null;

  const existing = patients[idx];

  // Handle bed swap
  if (data.bedId !== existing.bedId) {
    freeBed(existing.bedId);
    occupyBed(data.bedId);
  }

  patients[idx] = {
    ...existing,
    name: data.name.trim(),
    age: Number(data.age),
    gender: data.gender,
    assignedDoctorId: data.assignedDoctorId,
    floorId: data.floorId,
    wardId: data.wardId,
    roomId: data.roomId,
    bedId: data.bedId,
  };

  savePatients(patients);
  return patients[idx];
}

/**
 * Discharge a patient (soft delete). Frees their bed.
 * @param {string} patientId
 * @returns {PatientRecord | null}
 */
export function dischargePatient(patientId) {
  const patients = getPatients();
  const idx = patients.findIndex((p) => p.patientId === patientId);
  if (idx === -1) return null;

  // Free bed first, then mark discharged
  freeBed(patients[idx].bedId);

  patients[idx] = {
    ...patients[idx],
    status: 'Discharged',
  };

  savePatients(patients);
  return patients[idx];
}

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * @returns {{ total: number, active: number, discharged: number, occupiedBeds: number, availableBeds: number }}
 */
export function getPatientSummary() {
  const patients = getPatients();
  const structure = getHospitalStructure();

  const total = patients.length;
  const active = patients.filter((p) => p.status === 'Active').length;
  const discharged = patients.filter((p) => p.status === 'Discharged').length;
  const occupiedBeds = structure.beds.filter((b) => b.status === 'Occupied').length;
  const availableBeds = structure.beds.filter((b) => b.status === 'Available').length;

  return { total, active, discharged, occupiedBeds, availableBeds };
}
