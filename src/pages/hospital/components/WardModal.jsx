import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

const WARD_TYPES = [
  'General Ward',
  'Private',
  'Semi-Private',
  'ICU',
  'Emergency',
  'Pediatric',
  'Other',
];

export default function WardModal({
  isOpen,
  onClose,
  onSave,
  ward = null,
  floors = [],
  defaultFloorId = '',
  existingWards = [],
}) {
  const isEditing = Boolean(ward);

  const [formData, setFormData] = useState({
    floorId: '',
    wardName: '',
    wardType: 'General Ward',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (ward) {
      setFormData({
        floorId: ward.floorId || '',
        wardName: ward.wardName || '',
        wardType: ward.wardType || 'General Ward',
      });
    } else {
      setFormData({
        floorId: defaultFloorId || (floors.length > 0 ? floors[0].floorId : ''),
        wardName: '',
        wardType: 'General Ward',
      });
    }
    setErrors({});
  }, [ward, defaultFloorId, floors, isOpen]);

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

    if (!formData.floorId) {
      newErrors.floorId = 'Please select a floor for this ward';
    }

    const nameTrimmed = formData.wardName.trim();
    if (!nameTrimmed) {
      newErrors.wardName = 'Ward name is required';
    } else {
      // Check duplicate ward name on the SAME floor
      const isDuplicate = existingWards.some(
        (w) =>
          w.floorId === formData.floorId &&
          w.wardName.trim().toLowerCase() === nameTrimmed.toLowerCase() &&
          (!isEditing || w.wardId !== ward.wardId)
      );
      if (isDuplicate) {
        newErrors.wardName = 'A ward with this name already exists on this floor';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      floorId: formData.floorId,
      wardName: nameTrimmed,
      wardType: formData.wardType,
      status: 'Active',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Ward' : 'Add New Ward'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {/* Floor selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="floorId">
              Floor <span className="required-mark">*</span>
            </label>
            <select
              id="floorId"
              name="floorId"
              className={`form-input ${errors.floorId ? 'form-input-error' : ''}`}
              value={formData.floorId}
              onChange={handleChange}
              disabled={isEditing && Boolean(ward?.floorId)}
            >
              {floors.map((fl) => (
                <option key={fl.floorId} value={fl.floorId}>
                  {fl.floorName} (Floor {fl.floorNumber})
                </option>
              ))}
            </select>
            {errors.floorId && (
              <span className="form-error-text" role="alert">
                {errors.floorId}
              </span>
            )}
          </div>

          <FormField
            id="wardName"
            label="Ward Name"
            placeholder="e.g. Cardiology A, General Medicine, Neonatal ICU"
            value={formData.wardName}
            onChange={handleChange}
            required
            error={errors.wardName}
            helpText="Must be unique within the selected floor."
          />

          {/* Ward Type Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="wardType">
              Ward Type <span className="required-mark">*</span>
            </label>
            <select
              id="wardType"
              name="wardType"
              className="form-input"
              value={formData.wardType}
              onChange={handleChange}
            >
              {WARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <span className="form-help">
              Defines the clinical care level and bed layout style.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Create Ward'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
