import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function NurseModal({
  isOpen,
  onClose,
  onSave,
  nurse = null,
  existingNurses = [],
}) {
  const isEditing = Boolean(nurse);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    departmentOrWard: '',
    phone: '',
    email: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (nurse) {
      setFormData({
        name: nurse.name || '',
        employeeId: nurse.employeeId || '',
        departmentOrWard: nurse.departmentOrWard || '',
        phone: nurse.phone || '',
        email: nurse.email || '',
        status: nurse.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        employeeId: '',
        departmentOrWard: '',
        phone: '',
        email: '',
        status: 'Active',
      });
    }
    setErrors({});
  }, [nurse, isOpen]);

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

    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed) {
      newErrors.name = 'Full name is required';
    }

    const empIdTrimmed = formData.employeeId.trim();
    if (!empIdTrimmed) {
      newErrors.employeeId = 'Employee ID is required';
    } else {
      // Check uniqueness among nurses
      const isDuplicate = existingNurses.some(
        (n) =>
          n.employeeId.trim().toLowerCase() === empIdTrimmed.toLowerCase() &&
          (!isEditing || n.nurseId !== nurse.nurseId)
      );
      if (isDuplicate) {
        newErrors.employeeId = `Employee ID "${empIdTrimmed}" is already registered for another nurse`;
      }
    }

    const deptTrimmed = formData.departmentOrWard.trim();
    if (!deptTrimmed) {
      newErrors.departmentOrWard = 'Department or Ward assignment is required';
    }

    if (formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: nameTrimmed,
      employeeId: empIdTrimmed,
      departmentOrWard: deptTrimmed,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      status: formData.status,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Nurse Record' : 'Register New Nurse'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="nurseName"
              name="name"
              label="Full Name"
              placeholder="e.g. David Patel, RN"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />

            <FormField
              id="nurseEmployeeId"
              name="employeeId"
              label="Employee / Staff ID"
              placeholder="e.g. NUR-405"
              value={formData.employeeId}
              onChange={handleChange}
              required
              error={errors.employeeId}
              helpText="Must be unique among nurses."
            />
          </div>

          <FormField
            id="departmentOrWard"
            name="departmentOrWard"
            label="Department / Ward Assignment"
            placeholder="e.g. Ward A - Cardiology Floor 2, ICU, Emergency"
            value={formData.departmentOrWard}
            onChange={handleChange}
            required
            error={errors.departmentOrWard}
            helpText="Primary clinical floor or unit this nurse oversees."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="nursePhone"
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="e.g. +1 (555) 876-5432"
              value={formData.phone}
              onChange={handleChange}
            />

            <FormField
              id="nurseEmail"
              name="email"
              label="Email Address"
              type="email"
              placeholder="d.patel@hospital.org"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nurseStatus">
              Active Status <span className="required-mark">*</span>
            </label>
            <select
              id="nurseStatus"
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active (On duty / Ward coverage)</option>
              <option value="Inactive">Inactive (Off duty / On leave)</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Register Nurse'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
