/**
 * Cordinia Hospital Physical Structure Service (Frontend Local Storage Prototype)
 * Handles physical layout: Hospital -> Floors -> Wards -> Rooms -> Beds
 * Cleanly decouples storage logic from React components to enable future Firestore migration.
 */

const STORAGE_KEY = 'cordinia_hospital_structure';

/**
 * @typedef {Object} BedRecord
 * @property {string} bedId
 * @property {string} roomId
 * @property {string} bedNumber
 * @property {'Available' | 'Occupied'} status
 */

/**
 * @typedef {Object} RoomRecord
 * @property {string} roomId
 * @property {string} wardId
 * @property {string} roomNumber
 * @property {string} roomType
 * @property {number} bedCount
 * @property {'Available' | 'Maintenance'} status
 */

/**
 * @typedef {Object} WardRecord
 * @property {string} wardId
 * @property {string} floorId
 * @property {string} wardName
 * @property {string} wardType
 * @property {'Active' | 'Inactive'} status
 */

/**
 * @typedef {Object} FloorRecord
 * @property {string} floorId
 * @property {string} floorName
 * @property {number} floorNumber
 * @property {'Active' | 'Inactive'} status
 */

/**
 * @typedef {Object} HospitalStructure
 * @property {FloorRecord[]} floors
 * @property {WardRecord[]} wards
 * @property {RoomRecord[]} rooms
 * @property {BedRecord[]} beds
 */

const EMPTY_STRUCTURE = {
  floors: [],
  wards: [],
  rooms: [],
  beds: [],
};

/**
 * Read the entire hospital structure from local storage.
 * @returns {HospitalStructure}
 */
export function getHospitalStructure() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STRUCTURE };
    const parsed = JSON.parse(raw);
    return {
      floors: Array.isArray(parsed.floors) ? parsed.floors : [],
      wards: Array.isArray(parsed.wards) ? parsed.wards : [],
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
      beds: Array.isArray(parsed.beds) ? parsed.beds : [],
    };
  } catch (err) {
    console.warn('Failed to read hospital structure from localStorage:', err);
    return { ...EMPTY_STRUCTURE };
  }
}

/**
 * Save hospital structure to local storage.
 * @param {HospitalStructure} structure
 */
export function saveHospitalStructure(structure) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structure));
  } catch (err) {
    console.warn('Failed to save hospital structure to localStorage:', err);
  }
}

/**
 * Generate helper for unique local IDs
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// ==========================================
// FLOOR OPERATIONS
// ==========================================

/**
 * Add a new floor.
 * @param {{ floorName: string, floorNumber: number, status?: 'Active' | 'Inactive' }} data
 * @returns {FloorRecord}
 */
export function addFloor({ floorName, floorNumber, status = 'Active' }) {
  const structure = getHospitalStructure();
  const newFloor = {
    floorId: generateId('fl'),
    floorName: floorName.trim(),
    floorNumber: Number(floorNumber),
    status,
  };

  structure.floors.push(newFloor);
  // Sort floors ascending by floorNumber
  structure.floors.sort((a, b) => a.floorNumber - b.floorNumber);

  saveHospitalStructure(structure);
  return newFloor;
}

/**
 * Update an existing floor.
 * @param {string} floorId
 * @param {{ floorName: string, floorNumber: number, status?: 'Active' | 'Inactive' }} data
 * @returns {FloorRecord | null}
 */
export function updateFloor(floorId, { floorName, floorNumber, status = 'Active' }) {
  const structure = getHospitalStructure();
  const index = structure.floors.findIndex((f) => f.floorId === floorId);
  if (index === -1) return null;

  structure.floors[index] = {
    ...structure.floors[index],
    floorName: floorName.trim(),
    floorNumber: Number(floorNumber),
    status,
  };

  structure.floors.sort((a, b) => a.floorNumber - b.floorNumber);
  saveHospitalStructure(structure);
  return structure.floors[index];
}

/**
 * Delete a floor with cascade to its wards, rooms, and beds.
 * @param {string} floorId
 */
export function deleteFloor(floorId) {
  const structure = getHospitalStructure();

  // Find wards on this floor
  const wardIdsToDelete = structure.wards
    .filter((w) => w.floorId === floorId)
    .map((w) => w.wardId);

  // Find rooms in these wards
  const roomIdsToDelete = structure.rooms
    .filter((r) => wardIdsToDelete.includes(r.wardId))
    .map((r) => r.roomId);

  // Cascade delete
  structure.floors = structure.floors.filter((f) => f.floorId !== floorId);
  structure.wards = structure.wards.filter((w) => w.floorId !== floorId);
  structure.rooms = structure.rooms.filter((r) => !wardIdsToDelete.includes(r.wardId));
  structure.beds = structure.beds.filter((b) => !roomIdsToDelete.includes(b.roomId));

  saveHospitalStructure(structure);
}

// ==========================================
// WARD OPERATIONS
// ==========================================

/**
 * Add a new ward to a floor.
 * @param {{ floorId: string, wardName: string, wardType: string, status?: 'Active' | 'Inactive' }} data
 * @returns {WardRecord}
 */
export function addWard({ floorId, wardName, wardType, status = 'Active' }) {
  const structure = getHospitalStructure();
  const newWard = {
    wardId: generateId('wd'),
    floorId,
    wardName: wardName.trim(),
    wardType: wardType || 'General Ward',
    status,
  };

  structure.wards.push(newWard);
  saveHospitalStructure(structure);
  return newWard;
}

/**
 * Update an existing ward.
 * @param {string} wardId
 * @param {{ floorId: string, wardName: string, wardType: string, status?: 'Active' | 'Inactive' }} data
 * @returns {WardRecord | null}
 */
export function updateWard(wardId, { floorId, wardName, wardType, status = 'Active' }) {
  const structure = getHospitalStructure();
  const index = structure.wards.findIndex((w) => w.wardId === wardId);
  if (index === -1) return null;

  structure.wards[index] = {
    ...structure.wards[index],
    floorId,
    wardName: wardName.trim(),
    wardType: wardType || structure.wards[index].wardType,
    status,
  };

  saveHospitalStructure(structure);
  return structure.wards[index];
}

/**
 * Delete a ward with cascade to its rooms and beds.
 * @param {string} wardId
 */
export function deleteWard(wardId) {
  const structure = getHospitalStructure();

  const roomIdsToDelete = structure.rooms
    .filter((r) => r.wardId === wardId)
    .map((r) => r.roomId);

  structure.wards = structure.wards.filter((w) => w.wardId !== wardId);
  structure.rooms = structure.rooms.filter((r) => r.wardId !== wardId);
  structure.beds = structure.beds.filter((b) => !roomIdsToDelete.includes(b.roomId));

  saveHospitalStructure(structure);
}

// ==========================================
// ROOM & BED OPERATIONS
// ==========================================

/**
 * Generate bed array for a given room.
 * @param {string} roomId
 * @param {number} bedCount
 * @returns {BedRecord[]}
 */
function createBedsForRoom(roomId, bedCount) {
  const beds = [];
  for (let i = 1; i <= bedCount; i++) {
    beds.push({
      bedId: generateId('bd'),
      roomId,
      bedNumber: `Bed ${i}`,
      status: 'Available',
    });
  }
  return beds;
}

/**
 * Add a new room to a ward and automatically generate its beds.
 * @param {{ wardId: string, roomNumber: string, roomType: string, bedCount: number, status?: 'Available' | 'Maintenance' }} data
 * @returns {RoomRecord}
 */
export function addRoom({ wardId, roomNumber, roomType, bedCount, status = 'Available' }) {
  const structure = getHospitalStructure();
  const count = Math.max(1, Number(bedCount) || 1);
  const roomId = generateId('rm');

  const newRoom = {
    roomId,
    wardId,
    roomNumber: roomNumber.trim(),
    roomType: roomType || 'Standard',
    bedCount: count,
    status,
  };

  structure.rooms.push(newRoom);

  // Generate beds for this room
  const newBeds = createBedsForRoom(roomId, count);
  structure.beds.push(...newBeds);

  saveHospitalStructure(structure);
  return newRoom;
}

/**
 * Update an existing room and synchronize its bed count.
 * @param {string} roomId
 * @param {{ wardId: string, roomNumber: string, roomType: string, bedCount: number, status?: 'Available' | 'Maintenance' }} data
 * @returns {RoomRecord | null}
 */
export function updateRoom(roomId, { wardId, roomNumber, roomType, bedCount, status = 'Available' }) {
  const structure = getHospitalStructure();
  const index = structure.rooms.findIndex((r) => r.roomId === roomId);
  if (index === -1) return null;

  const currentCount = structure.rooms[index].bedCount;
  const newCount = Math.max(1, Number(bedCount) || 1);

  structure.rooms[index] = {
    ...structure.rooms[index],
    wardId,
    roomNumber: roomNumber.trim(),
    roomType: roomType || structure.rooms[index].roomType,
    bedCount: newCount,
    status,
  };

  // Adjust beds if bed count changed
  if (newCount !== currentCount) {
    const existingBeds = structure.beds.filter((b) => b.roomId === roomId);
    if (newCount > currentCount) {
      // Add more beds
      for (let i = currentCount + 1; i <= newCount; i++) {
        existingBeds.push({
          bedId: generateId('bd'),
          roomId,
          bedNumber: `Bed ${i}`,
          status: 'Available',
        });
      }
      structure.beds = structure.beds.filter((b) => b.roomId !== roomId).concat(existingBeds);
    } else {
      // Truncate beds to newCount
      const keptBeds = existingBeds.slice(0, newCount);
      structure.beds = structure.beds.filter((b) => b.roomId !== roomId).concat(keptBeds);
    }
  }

  saveHospitalStructure(structure);
  return structure.rooms[index];
}

/**
 * Delete a room and its associated beds.
 * @param {string} roomId
 */
export function deleteRoom(roomId) {
  const structure = getHospitalStructure();
  structure.rooms = structure.rooms.filter((r) => r.roomId !== roomId);
  structure.beds = structure.beds.filter((b) => b.roomId !== roomId);
  saveHospitalStructure(structure);
}

// ==========================================
// SUMMARY METRICS
// ==========================================

/**
 * Retrieve total counts for summary cards.
 * @returns {{ floorCount: number, wardCount: number, roomCount: number, bedCount: number }}
 */
export function getStructureSummary() {
  const structure = getHospitalStructure();
  return {
    floorCount: structure.floors.length,
    wardCount: structure.wards.length,
    roomCount: structure.rooms.length,
    bedCount: structure.beds.length,
  };
}
