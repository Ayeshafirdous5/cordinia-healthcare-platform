import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function FloorModal({
  isOpen,
  onClose,
  onSave,
  floor = null,
  existingFloors = [],
}) {
  const isEditing = Boolean(floor);

  const [formData, setFormData] = useState({
    floorName: '',
    floorNumber: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (floor) {
      setFormData({
        floorName: floor.floorName || '',
        floorNumber: floor.floorNumber !== undefined ? String(floor.floorNumber) : '',
      });
    } else {
      setFormData({
        floorName: '',
        floorNumber: '',
      });
    }
    setErrors({});
  }, [floor, isOpen]);

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

    const nameTrimmed = formData.floorName.trim();
    if (!nameTrimmed) {
      newErrors.floorName = 'Floor name is required';
    }

    if (formData.floorNumber === '' || isNaN(Number(formData.floorNumber))) {
      newErrors.floorNumber = 'A valid numeric floor number is required';
    } else {
      const num = Number(formData.floorNumber);
      // Check duplicate floor number
      const isDuplicate = existingFloors.some(
        (f) => f.floorNumber === num && (!isEditing || f.floorId !== floor.floorId)
      );
      if (isDuplicate) {
        newErrors.floorNumber = `Floor number ${num} already exists. Please choose a unique floor number.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      floorName: nameTrimmed,
      floorNumber: Number(formData.floorNumber),
      status: 'Active',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Floor' : 'Add New Floor'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          <FormField
            id="floorName"
            label="Floor Name"
            placeholder="e.g. Ground Floor or Floor 2"
            value={formData.floorName}
            onChange={handleChange}
            required
            error={errors.floorName}
            helpText="Human-readable name used across nursing and doctor interfaces."
          />

          <FormField
            id="floorNumber"
            label="Floor Number (Numeric)"
            type="number"
            step="1"
            placeholder="e.g. 0, 1, 2, -1"
            value={formData.floorNumber}
            onChange={handleChange}
            required
            error={errors.floorNumber}
            helpText="Floor level integer (used for vertical navigation topology)."
          />
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Create Floor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
