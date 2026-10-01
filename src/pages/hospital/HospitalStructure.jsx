import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import Modal from '../../components/common/Modal';

import FloorModal from './components/FloorModal';
import WardModal from './components/WardModal';
import RoomModal from './components/RoomModal';

import { getHospitalWorkspace, getDefaultWorkspace } from '../../services/hospitalService';
import {
  getHospitalStructure,
  addFloor,
  updateFloor,
  deleteFloor,
  addWard,
  updateWard,
  deleteWard,
  addRoom,
  updateRoom,
  deleteRoom,
} from '../../services/hospitalStructureService';

export default function HospitalStructure() {
  const [workspace, setWorkspace] = useState(null);
  const [structure, setStructure] = useState({
    floors: [],
    wards: [],
    rooms: [],
    beds: [],
  });

  // Expand/collapse state for floors (set of floorIds)
  const [expandedFloors, setExpandedFloors] = useState(new Set());

  // Modal states
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);

  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [defaultFloorId, setDefaultFloorId] = useState('');

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [defaultWardId, setDefaultWardId] = useState('');

  // Delete confirmation modal state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'floor' | 'ward' | 'room'
    id: null,
    name: '',
    childrenCountText: '',
  });

  // Load workspace and structure
  useEffect(() => {
    const loadedWorkspace = getHospitalWorkspace() || getDefaultWorkspace();
    setWorkspace(loadedWorkspace);

    const loadedStructure = getHospitalStructure();
    setStructure(loadedStructure);

    // Expand all floors by default for easy viewing
    if (loadedStructure.floors.length > 0) {
      setExpandedFloors(new Set(loadedStructure.floors.map((f) => f.floorId)));
    }
  }, []);

  const refreshStructure = () => {
    const updated = getHospitalStructure();
    setStructure(updated);
  };

  const toggleFloor = (floorId) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floorId)) {
        next.delete(floorId);
      } else {
        next.add(floorId);
      }
      return next;
    });
  };

  // ==========================================
  // FLOOR HANDLERS
  // ==========================================
  const handleOpenAddFloor = () => {
    setEditingFloor(null);
    setFloorModalOpen(true);
  };

  const handleOpenEditFloor = (floor) => {
    setEditingFloor(floor);
    setFloorModalOpen(true);
  };

  const handleSaveFloor = (data) => {
    if (editingFloor) {
      updateFloor(editingFloor.floorId, data);
    } else {
      const created = addFloor(data);
      // Auto-expand newly added floor
      setExpandedFloors((prev) => new Set([...prev, created.floorId]));
    }
    refreshStructure();
  };

  const confirmDeleteFloor = (floor) => {
    const floorWards = structure.wards.filter((w) => w.floorId === floor.floorId);
    const wardIds = floorWards.map((w) => w.wardId);
    const floorRooms = structure.rooms.filter((r) => wardIds.includes(r.wardId));

    let childrenText = '';
    if (floorWards.length > 0) {
      childrenText = `This will also permanently delete ${floorWards.length} ward(s) and ${floorRooms.length} room(s) on this floor.`;
    }

    setDeleteDialog({
      isOpen: true,
      type: 'floor',
      id: floor.floorId,
      name: floor.floorName,
      childrenCountText: childrenText,
    });
  };

  // ==========================================
  // WARD HANDLERS
  // ==========================================
  const handleOpenAddWard = (floorId = '') => {
    setEditingWard(null);
    setDefaultFloorId(floorId || (structure.floors[0]?.floorId ?? ''));
    setWardModalOpen(true);
  };

  const handleOpenEditWard = (ward) => {
    setEditingWard(ward);
    setWardModalOpen(true);
  };

  const handleSaveWard = (data) => {
    if (editingWard) {
      updateWard(editingWard.wardId, data);
    } else {
      addWard(data);
      // Ensure the floor is expanded
      setExpandedFloors((prev) => new Set([...prev, data.floorId]));
    }
    refreshStructure();
  };

  const confirmDeleteWard = (ward) => {
    const wardRooms = structure.rooms.filter((r) => r.wardId === ward.wardId);
    let childrenText = '';
    if (wardRooms.length > 0) {
      childrenText = `This will also permanently delete ${wardRooms.length} room(s) and their associated beds in this ward.`;
    }

    setDeleteDialog({
      isOpen: true,
      type: 'ward',
      id: ward.wardId,
      name: ward.wardName,
      childrenCountText: childrenText,
    });
  };

  // ==========================================
  // ROOM HANDLERS
  // ==========================================
  const handleOpenAddRoom = (wardId = '') => {
    setEditingRoom(null);
    setDefaultWardId(wardId || (structure.wards[0]?.wardId ?? ''));
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = (data) => {
    if (editingRoom) {
      updateRoom(editingRoom.roomId, data);
    } else {
      addRoom(data);
    }
    refreshStructure();
  };

  const confirmDeleteRoom = (room) => {
    setDeleteDialog({
      isOpen: true,
      type: 'room',
      id: room.roomId,
      name: `Room ${room.roomNumber}`,
      childrenCountText: `This will remove all beds associated with this room.`,
    });
  };

  // ==========================================
  // DELETE EXECUTION
  // ==========================================
  const handleExecuteDelete = () => {
    if (deleteDialog.type === 'floor') {
      deleteFloor(deleteDialog.id);
    } else if (deleteDialog.type === 'ward') {
      deleteWard(deleteDialog.id);
    } else if (deleteDialog.type === 'room') {
      deleteRoom(deleteDialog.id);
    }
    setDeleteDialog({ isOpen: false, type: null, id: null, name: '', childrenCountText: '' });
    refreshStructure();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Navigation & Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to="/hospital/workspace"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}
        >
          &larr; Back to Hospital Workspace
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Badge variant="navy">Step 1 of 4: Physical Topology</Badge>
          <StatusIndicator status="active" label="Topology Active" />
        </div>
      </div>

      {/* Page Title & Supporting Text */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
          Hospital Structure
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', maxWidth: '780px', lineHeight: 1.5 }}>
          Configure the physical layout of your hospital so Cordinia can accurately coordinate doctors, nurses,
          and patient locations. Room numbers are treated as discrete physical locations rather than sequential sequences.
        </p>
      </div>

      {/* Setup Summary & Guidance Card */}
      {workspace && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                Hospital Facility
              </span>
              <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-brand-navy)', marginTop: '0.2rem' }}>
                {workspace.hospitalName}
              </h2>
            </div>
            <Button variant="primary" onClick={handleOpenAddFloor}>
              + Add Floor
            </Button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                Planning Guidance (from onboarding):
              </span>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
                {workspace.floorCount} Floors &bull; {workspace.wardCount} Wards
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                Configured Structure:
              </span>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-brand-primary)', marginTop: '0.25rem' }}>
                {structure.floors.length} Floors &bull; {structure.wards.length} Wards &bull; {structure.rooms.length} Rooms &bull; {structure.beds.length} Beds
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Structure Explorer Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)' }}>
            Physical Floors & Wards
          </h2>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {structure.floors.length} Floor(s) Configured
          </span>
        </div>

        {structure.floors.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '2px dashed var(--color-border-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--color-brand-primary-light)', color: 'var(--color-brand-primary)', marginBottom: '1rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
              No Floors Configured Yet
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Begin by adding your first building floor (such as Ground Floor, Floor 1, or Level 2).
              You can then assign wards, rooms, and individual beds under each floor.
            </p>
            <Button variant="primary" onClick={handleOpenAddFloor}>
              + Add First Floor
            </Button>
          </div>
        ) : (
          <div>
            {structure.floors.map((floor) => {
              const floorWards = structure.wards.filter((w) => w.floorId === floor.floorId);
              const isExpanded = expandedFloors.has(floor.floorId);

              return (
                <div key={floor.floorId} className="floor-block">
                  {/* Floor Header */}
                  <div className="floor-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleFloor(floor.floorId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-default)',
                          backgroundColor: 'var(--color-bg-subtle)',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.85rem',
                        }}
                        title={isExpanded ? 'Collapse floor' : 'Expand floor'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
                            {floor.floorName}
                          </h3>
                          <Badge variant="blue">Level {floor.floorNumber}</Badge>
                        </div>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {floorWards.length} Ward(s) assigned
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button variant="outline" size="sm" onClick={() => handleOpenAddWard(floor.floorId)}>
                        + Add Ward
                      </Button>
                      <button
                        type="button"
                        className="btn btn-subtle btn-sm"
                        onClick={() => handleOpenEditFloor(floor)}
                        title="Edit floor"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-subtle btn-sm"
                        style={{ color: 'var(--color-rose)' }}
                        onClick={() => confirmDeleteFloor(floor)}
                        title="Delete floor"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Floor Body (Wards) */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      {floorWards.length === 0 ? (
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            backgroundColor: 'var(--color-bg-subtle)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--color-border-default)',
                          }}
                        >
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            No wards on this floor yet.
                          </span>
                          <div style={{ marginTop: '0.5rem' }}>
                            <Button variant="outline" size="sm" onClick={() => handleOpenAddWard(floor.floorId)}>
                              + Add Ward to {floor.floorName}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {floorWards.map((ward) => {
                            const wardRooms = structure.rooms.filter((r) => r.wardId === ward.wardId);

                            return (
                              <div key={ward.wardId} className="ward-block">
                                {/* Ward Header */}
                                <div className="ward-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-brand-navy)' }}>
                                      {ward.wardName}
                                    </h4>
                                    <Badge variant="teal">{ward.wardType}</Badge>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                      &bull; {wardRooms.length} Room(s)
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Button variant="primary" size="sm" onClick={() => handleOpenAddRoom(ward.wardId)}>
                                      + Add Room
                                    </Button>
                                    <button
                                      type="button"
                                      className="btn btn-subtle btn-sm"
                                      onClick={() => handleOpenEditWard(ward)}
                                      title="Edit ward"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-subtle btn-sm"
                                      style={{ color: 'var(--color-rose)' }}
                                      onClick={() => confirmDeleteWard(ward)}
                                      title="Delete ward"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Rooms Grid */}
                                {wardRooms.length === 0 ? (
                                  <div
                                    style={{
                                      padding: '1rem',
                                      textAlign: 'center',
                                      backgroundColor: '#ffffff',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px dashed var(--color-border-default)',
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--color-text-muted)',
                                    }}
                                  >
                                    No rooms in this ward.{' '}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddRoom(ward.wardId)}
                                      style={{ color: 'var(--color-brand-primary)', fontWeight: '600', textDecoration: 'underline' }}
                                    >
                                      Add the first room
                                    </button>
                                  </div>
                                ) : (
                                  <div className="room-grid">
                                    {wardRooms.map((room) => {
                                      const roomBeds = structure.beds.filter((b) => b.roomId === room.roomId);

                                      return (
                                        <div key={room.roomId} className="room-card">
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                              <div>
                                                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
                                                  Room {room.roomNumber}
                                                </div>
                                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                  {room.roomType} &bull; {room.bedCount} Bed(s)
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                  type="button"
                                                  className="btn btn-subtle btn-sm"
                                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                                  onClick={() => handleOpenEditRoom(room)}
                                                  title="Edit room"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-subtle btn-sm"
                                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--color-rose)' }}
                                                  onClick={() => confirmDeleteRoom(room)}
                                                  title="Delete room"
                                                >
                                                  &times;
                                                </button>
                                              </div>
                                            </div>

                                            {/* Visual Bed Representation */}
                                            <div className="bed-chip-container">
                                              {roomBeds.map((bed) => (
                                                <span key={bed.bedId} className="bed-chip bed-chip-available">
                                                  <span className="status-dot status-dot-active" />
                                                  {bed.bedNumber}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FloorModal
        isOpen={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        onSave={handleSaveFloor}
        floor={editingFloor}
        existingFloors={structure.floors}
      />

      <WardModal
        isOpen={wardModalOpen}
        onClose={() => setWardModalOpen(false)}
        onSave={handleSaveWard}
        ward={editingWard}
        floors={structure.floors}
        defaultFloorId={defaultFloorId}
        existingWards={structure.wards}
      />

      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSave={handleSaveRoom}
        room={editingRoom}
        wards={structure.wards}
        floors={structure.floors}
        defaultWardId={defaultWardId}
        existingRooms={structure.rooms}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        title="Confirm Deletion"
      >
        <div className="modal-body">
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-brand-navy)', marginBottom: '0.75rem' }}>
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
          </p>
          {deleteDialog.childrenCountText && (
            <div
              style={{
                backgroundColor: 'var(--color-rose-light)',
                border: '1px solid #fecdd3',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-rose)',
                lineHeight: 1.5,
              }}
            >
              {deleteDialog.childrenCountText}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button
            type="button"
            variant="subtle"
            onClick={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
          >
            Cancel
          </Button>
          <button
            type="button"
            className="btn"
            style={{ backgroundColor: 'var(--color-rose)', color: '#ffffff' }}
            onClick={handleExecuteDelete}
          >
            Delete Permanently
          </button>
        </div>
      </Modal>
    </div>
  );
}
