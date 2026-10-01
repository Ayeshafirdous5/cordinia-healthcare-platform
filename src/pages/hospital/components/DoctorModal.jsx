import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

export default function DoctorModal({
  isOpen,
  onClose,
  onSave,
  doctor = null,
  existingDoctors = [],
}) {
  const isEditing = Boolean(doctor);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    specialization: '',
    phone: '',
    email: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        employeeId: doctor.employeeId || '',
        department: doctor.department || '',
        specialization: doctor.specialization || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        status: doctor.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        employeeId: '',
        department: '',
        specialization: '',
        phone: '',
        email: '',
        status: 'Active',
      });
    }
    setErrors({});
  }, [doctor, isOpen]);

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
      // Check uniqueness among doctors
      const isDuplicate = existingDoctors.some(
        (d) =>
          d.employeeId.trim().toLowerCase() === empIdTrimmed.toLowerCase() &&
          (!isEditing || d.doctorId !== doctor.doctorId)
      );
      if (isDuplicate) {
        newErrors.employeeId = `Employee ID "${empIdTrimmed}" is already registered for another doctor`;
      }
    }

    const deptTrimmed = formData.department.trim();
    if (!deptTrimmed) {
      newErrors.department = 'Department is required';
    }

    const specTrimmed = formData.specialization.trim();
    if (!specTrimmed) {
      newErrors.specialization = 'Specialization / Role is required';
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
      department: deptTrimmed,
      specialization: specTrimmed,
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
      title={isEditing ? 'Edit Doctor Record' : 'Register New Doctor'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="name"
              label="Full Name (with title)"
              placeholder="e.g. Dr. Sarah Mitchell"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />

            <FormField
              id="employeeId"
              label="Employee / Staff ID"
              placeholder="e.g. DOC-102"
              value={formData.employeeId}
              onChange={handleChange}
              required
              error={errors.employeeId}
              helpText="Must be unique among doctors."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="department"
              label="Department"
              placeholder="e.g. Cardiology, Internal Medicine"
              value={formData.department}
              onChange={handleChange}
              required
              error={errors.department}
            />

            <FormField
              id="specialization"
              label="Specialization / Clinical Role"
              placeholder="e.g. Attending Cardiologist"
              value={formData.specialization}
              onChange={handleChange}
              required
              error={errors.specialization}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={formData.phone}
              onChange={handleChange}
            />

            <FormField
              id="email"
              label="Email Address"
              type="email"
              placeholder="s.mitchell@hospital.org"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Active Status <span className="required-mark">*</span>
            </label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active (Eligible for rounds)</option>
              <option value="Inactive">Inactive (On leave / Not rounding)</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Register Doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
