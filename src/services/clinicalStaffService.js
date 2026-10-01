/**
 * Cordinia Clinical Staff Service (Frontend Local Storage Prototype)
 * Handles medical personnel records (Doctors & Nurses) for hospital round coordination.
 * Decoupled storage model designed to map naturally to future Firestore collections.
 */

const STORAGE_KEY = 'cordinia_clinical_staff';

/**
 * @typedef {Object} DoctorRecord
 * @property {string} doctorId - System unique identifier
 * @property {string} name - Doctor full name with title
 * @property {string} employeeId - Unique hospital employee/staff code
 * @property {string} department - Clinical department (e.g. Cardiology)
 * @property {string} specialization - Clinical role (e.g. Attending Cardiologist)
 * @property {string} phone - Contact phone number
 * @property {string} email - Contact email address
 * @property {'Active' | 'Inactive'} status - Active status
 */

/**
 * @typedef {Object} NurseRecord
 * @property {string} nurseId - System unique identifier
 * @property {string} name - Nurse full name
 * @property {string} employeeId - Unique hospital employee/staff code
 * @property {string} departmentOrWard - Primary assigned ward or department
 * @property {string} phone - Contact phone number
 * @property {string} email - Contact email address
 * @property {'Active' | 'Inactive'} status - Active status
 */

/**
 * @typedef {Object} ClinicalStaffData
 * @property {DoctorRecord[]} doctors
 * @property {NurseRecord[]} nurses
 */

const EMPTY_STAFF_DATA = {
  doctors: [],
  nurses: [],
};

/**
 * Read all clinical staff data from local storage.
 * @returns {ClinicalStaffData}
 */
export function getStaffData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STAFF_DATA };
    const parsed = JSON.parse(raw);
    return {
      doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
      nurses: Array.isArray(parsed.nurses) ? parsed.nurses : [],
    };
  } catch (err) {
    console.warn('Failed to read clinical staff from localStorage:', err);
    return { ...EMPTY_STAFF_DATA };
  }
}

/**
 * Save staff data to local storage.
 * @param {ClinicalStaffData} data
 */
export function saveStaffData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save clinical staff to localStorage:', err);
  }
}

/**
 * Helper to generate unique local prototype IDs
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// ==========================================
// DOCTOR OPERATIONS
// ==========================================

/**
 * Add a new doctor.
 * @param {Omit<DoctorRecord, 'doctorId'>} doctorData
 * @returns {DoctorRecord}
 */
export function addDoctor(doctorData) {
  const staff = getStaffData();
  const newDoctor = {
    doctorId: generateId('doc'),
    name: doctorData.name.trim(),
    employeeId: doctorData.employeeId.trim(),
    department: doctorData.department.trim(),
    specialization: doctorData.specialization.trim(),
    phone: doctorData.phone?.trim() || '',
    email: doctorData.email?.trim() || '',
    status: doctorData.status || 'Active',
  };

  staff.doctors.push(newDoctor);
  saveStaffData(staff);
  return newDoctor;
}

/**
 * Update an existing doctor record.
 * @param {string} doctorId
 * @param {Omit<DoctorRecord, 'doctorId'>} doctorData
 * @returns {DoctorRecord | null}
 */
export function updateDoctor(doctorId, doctorData) {
  const staff = getStaffData();
  const index = staff.doctors.findIndex((d) => d.doctorId === doctorId);
  if (index === -1) return null;

  staff.doctors[index] = {
    ...staff.doctors[index],
    name: doctorData.name.trim(),
    employeeId: doctorData.employeeId.trim(),
    department: doctorData.department.trim(),
    specialization: doctorData.specialization.trim(),
    phone: doctorData.phone?.trim() || '',
    email: doctorData.email?.trim() || '',
    status: doctorData.status || staff.doctors[index].status,
  };

  saveStaffData(staff);
  return staff.doctors[index];
}

/**
 * Delete a doctor.
 * @param {string} doctorId
 */
export function deleteDoctor(doctorId) {
  const staff = getStaffData();
  staff.doctors = staff.doctors.filter((d) => d.doctorId !== doctorId);
  saveStaffData(staff);
}

// ==========================================
// NURSE OPERATIONS
// ==========================================

/**
 * Add a new nurse.
 * @param {Omit<NurseRecord, 'nurseId'>} nurseData
 * @returns {NurseRecord}
 */
export function addNurse(nurseData) {
  const staff = getStaffData();
  const newNurse = {
    nurseId: generateId('nur'),
    name: nurseData.name.trim(),
    employeeId: nurseData.employeeId.trim(),
    departmentOrWard: nurseData.departmentOrWard.trim(),
    phone: nurseData.phone?.trim() || '',
    email: nurseData.email?.trim() || '',
    status: nurseData.status || 'Active',
  };

  staff.nurses.push(newNurse);
  saveStaffData(staff);
  return newNurse;
}

/**
 * Update an existing nurse record.
 * @param {string} nurseId
 * @param {Omit<NurseRecord, 'nurseId'>} nurseData
 * @returns {NurseRecord | null}
 */
export function updateNurse(nurseId, nurseData) {
  const staff = getStaffData();
  const index = staff.nurses.findIndex((n) => n.nurseId === nurseId);
  if (index === -1) return null;

  staff.nurses[index] = {
    ...staff.nurses[index],
    name: nurseData.name.trim(),
    employeeId: nurseData.employeeId.trim(),
    departmentOrWard: nurseData.departmentOrWard.trim(),
    phone: nurseData.phone?.trim() || '',
    email: nurseData.email?.trim() || '',
    status: nurseData.status || staff.nurses[index].status,
  };

  saveStaffData(staff);
  return staff.nurses[index];
}

/**
 * Delete a nurse.
 * @param {string} nurseId
 */
export function deleteNurse(nurseId) {
  const staff = getStaffData();
  staff.nurses = staff.nurses.filter((n) => n.nurseId !== nurseId);
  saveStaffData(staff);
}

// ==========================================
// SUMMARY METRICS
// ==========================================

/**
 * Retrieve counts of doctors and nurses.
 * @returns {{ totalDoctors: number, activeDoctors: number, totalNurses: number, activeNurses: number }}
 */
export function getStaffSummary() {
  const staff = getStaffData();
  const totalDoctors = staff.doctors.length;
  const activeDoctors = staff.doctors.filter((d) => d.status === 'Active').length;
  const totalNurses = staff.nurses.length;
  const activeNurses = staff.nurses.filter((n) => n.status === 'Active').length;

  return {
    totalDoctors,
    activeDoctors,
    totalNurses,
    activeNurses,
  };
}
