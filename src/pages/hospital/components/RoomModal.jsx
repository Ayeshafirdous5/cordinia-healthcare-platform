import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const ROOM_TYPES = [
  'Standard',
  'Single Patient',
  'Semi-Private',
  'Isolation',
  'Intensive Care',
  'Emergency Bay',
  'Post-Op Recovery',
];

export default function RoomModal({
  isOpen,
  onClose,
  onSave,
  room = null,
  wards = [],
  floors = [],
  defaultWardId = '',
  existingRooms = [],
}) {
  const isEditing = Boolean(room);

  const [formData, setFormData] = useState({
    wardId: '',
    roomNumber: '',
    roomType: 'Standard',
    bedCount: '1',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (room) {
      setFormData({
        wardId: room.wardId || '',
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'Standard',
        bedCount: String(room.bedCount || 1),
      });
    } else {
      setFormData({
        wardId: defaultWardId || (wards.length > 0 ? wards[0].wardId : ''),
        roomNumber: '',
        roomType: 'Standard',
        bedCount: '1',
      });
    }
    setErrors({});
  }, [room, defaultWardId, wards, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.wardId) {
      newErrors.wardId = 'Please select a ward for this room';
    }

    const roomNumTrimmed = formData.roomNumber.trim();
    if (!roomNumTrimmed) {
      newErrors.roomNumber = 'Room number / identifier is required';
    } else {
      // Check duplicate room number within the SAME ward
      const isDuplicate = existingRooms.some(
        (r) =>
          r.wardId === formData.wardId &&
          r.roomNumber.trim().toLowerCase() === roomNumTrimmed.toLowerCase() &&
          (!isEditing || r.roomId !== room.roomId)
      );
      if (isDuplicate) {
        newErrors.roomNumber = `Room ${roomNumTrimmed} already exists in this ward`;
      }
    }

    const bedsNum = Number(formData.bedCount);
    if (!formData.bedCount || isNaN(bedsNum) || bedsNum < 1 || !Number.isInteger(bedsNum)) {
      newErrors.bedCount = 'Bed count must be a positive integer (at least 1)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      wardId: formData.wardId,
      roomNumber: roomNumTrimmed,
      roomType: formData.roomType,
      bedCount: bedsNum,
      status: 'Available',
    });

    onClose();
  };

  // Helper to format ward label with floor
  const getWardLabel = (ward) => {
    const floor = floors.find((f) => f.floorId === ward.floorId);
    return `${ward.wardName} (${floor ? floor.floorName : 'Ward'})`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Room' : 'Add New Room'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {/* Ward selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="wardId">
              Assigned Ward <span className="required-mark">*</span>
            </label>
            <select
              id="wardId"
              name="wardId"
              className={`form-input ${errors.wardId ? 'form-input-error' : ''}`}
              value={formData.wardId}
              onChange={handleChange}
              disabled={isEditing && Boolean(room?.wardId)}
            >
              {wards.map((wd) => (
                <option key={wd.wardId} value={wd.wardId}>
                  {getWardLabel(wd)}
                </option>
              ))}
            </select>
            {errors.wardId && (
              <span className="form-error-text" role="alert">
                {errors.wardId}
              </span>
            )}
          </div>

          <FormField
            id="roomNumber"
            label="Room Number / Identifier"
            placeholder="e.g. 218, 225, 306, ICU-4"
            value={formData.roomNumber}
            onChange={handleChange}
            required
            error={errors.roomNumber}
            helpText="Physical door label. (Rooms are discrete entities, not auto-ordered)."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="roomType">
                Room Type <span className="required-mark">*</span>
              </label>
              <select
                id="roomType"
                name="roomType"
                className="form-input"
                value={formData.roomType}
                onChange={handleChange}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              id="bedCount"
              label="Number of Beds"
              type="number"
              min="1"
              step="1"
              value={formData.bedCount}
              onChange={handleChange}
              required
              error={errors.bedCount}
              helpText="Generates individual bed slots."
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
