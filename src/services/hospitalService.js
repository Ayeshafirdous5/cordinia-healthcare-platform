/**
 * Cordinia Hospital Workspace Service (Frontend Local Prototype)
 * Handles local persistence of the hospital registration record.
 * Designed to map naturally to future Firestore hospital documents.
 */

const STORAGE_KEY = 'cordinia_hospital_workspace';

/**
 * @typedef {Object} HospitalRecord
 * @property {string} hospitalId - Temporary local prototype ID
 * @property {string} hospitalName - Legal/facility hospital name
 * @property {string} registrationId - Official registry or accreditation ID
 * @property {string} location - City and location
 * @property {string} contactEmail - Primary contact email
 * @property {string} contactPhone - Primary contact phone number
 * @property {number} floorCount - Total number of floors
 * @property {number} wardCount - Total number of active wards
 * @property {string} createdAt - ISO timestamp of workspace creation
 * @property {'workspace_created' | 'configured' | 'active'} status - Status lifecycle
 */

/**
 * Save newly registered hospital workspace to local storage.
 * @param {Omit<HospitalRecord, 'hospitalId' | 'createdAt' | 'status'>} inputData
 * @returns {HospitalRecord}
 */
export function saveHospitalWorkspace(inputData) {
  const record = {
    hospitalId: `proto-hosp-${Date.now().toString(36)}`,
    hospitalName: inputData.hospitalName?.trim() || '',
    registrationId: inputData.registrationId?.trim() || '',
    location: inputData.location?.trim() || '',
    contactEmail: inputData.contactEmail?.trim() || '',
    contactPhone: inputData.contactPhone?.trim() || '',
    floorCount: Number(inputData.floorCount) || 1,
    wardCount: Number(inputData.wardCount) || 1,
    createdAt: new Date().toISOString(),
    status: 'workspace_created',
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.warn('Failed to save hospital workspace to localStorage:', err);
  }

  return record;
}

/**
 * Retrieve current hospital workspace from local storage.
 * @returns {HospitalRecord | null}
 */
export function getHospitalWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read hospital workspace from localStorage:', err);
    return null;
  }
}

/**
 * Clear hospital workspace from local storage.
 */
export function clearHospitalWorkspace() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear hospital workspace:', err);
  }
}

/**
 * Default sample workspace for immediate prototype preview if accessed directly.
 * @returns {HospitalRecord}
 */
export function getDefaultWorkspace() {
  return {
    hospitalId: 'proto-hosp-sample',
    hospitalName: 'St. Jude Memorial Hospital',
    registrationId: 'MED-REG-84920-NA',
    location: 'Metropolis Health City',
    contactEmail: 'admin@stjudememorial.org',
    contactPhone: '+1 (555) 349-2041',
    floorCount: 5,
    wardCount: 12,
    createdAt: new Date().toISOString(),
    status: 'workspace_created',
  };
}
