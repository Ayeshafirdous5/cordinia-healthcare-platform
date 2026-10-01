import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { saveHospitalWorkspace } from '../../services/hospitalService';

export default function HospitalRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationId: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    floorCount: '',
    wardCount: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    const trimmed = typeof value === 'string' ? value.trim() : '';

    switch (name) {
      case 'hospitalName':
        if (!trimmed) error = 'Hospital name is required';
        break;
      case 'registrationId':
        if (!trimmed) error = 'Hospital registration ID is required';
        break;
      case 'location':
        if (!trimmed) error = 'Location / City is required';
        break;
      case 'contactEmail':
        if (!trimmed) {
          error = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'contactPhone':
        if (!trimmed) {
          error = 'Contact phone number is required';
        } else {
          const digits = trimmed.replace(/\D/g, '');
          if (digits.length < 7 || digits.length > 15) {
            error = 'Please enter a valid phone number (7-15 digits)';
          }
        }
        break;
      case 'floorCount':
        {
          const num = Number(value);
          if (!value || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            error = 'Floors must be a positive integer';
          }
        }
        break;
      case 'wardCount':
        {
          const num = Number(value);
          if (!value || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            error = 'Wards must be a positive integer';
          }
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setTouched({
      hospitalName: true,
      registrationId: true,
      location: true,
      contactEmail: true,
      contactPhone: true,
      floorCount: true,
      wardCount: true,
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save locally via hospital service
    saveHospitalWorkspace({
      hospitalName: formData.hospitalName,
      registrationId: formData.registrationId,
      location: formData.location,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      floorCount: Number(formData.floorCount),
      wardCount: Number(formData.wardCount),
    });

    // Navigate to hospital workspace
    navigate('/hospital/workspace');
  };

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto 4rem auto', padding: '0 1rem' }}>
      {/* Navigation header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          &larr; Back to Cordinia
        </Link>
        <Badge variant="navy">Hospital Onboarding</Badge>
      </div>

      {/* Page Title & Context */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Create your hospital workspace
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '640px' }}>
          Set up your hospital on Cordinia. You can configure staff, wards, rooms, and patient assignments after registration.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1: Hospital Information */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="M15 9h-6" />
                <path d="M15 15h-6" />
              </svg>
              1. Hospital Information
            </h2>
            <p className="form-section-desc">
              Legal hospital identity and official accreditation identifiers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <FormField
              id="hospitalName"
              label="Hospital Name"
              placeholder="e.g. St. Jude Memorial Hospital"
              value={formData.hospitalName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.hospitalName}
              helpText="The full legal or operational name of the medical center."
            />

            <FormField
              id="registrationId"
              label="Hospital Registration ID"
              placeholder="e.g. MED-REG-2026-904"
              value={formData.registrationId}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.registrationId}
              helpText="Ministry of Health or health authority registration number."
            />
          </div>
        </div>

        {/* Section 2: Location & Contact */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-teal)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              2. Location & Contact
            </h2>
            <p className="form-section-desc">
              Geographic location and administrative contact channels for floor coordination.
            </p>
          </div>

          <FormField
            id="location"
            label="Location / City"
            placeholder="e.g. Boston, MA or Central Medical District"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            error={errors.location}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <FormField
              id="contactEmail"
              label="Contact Email"
              type="email"
              placeholder="admin@hospital.org"
              value={formData.contactEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.contactEmail}
              helpText="Primary administrative notifications address."
            />

            <FormField
              id="contactPhone"
              label="Contact Phone Number"
              type="tel"
              placeholder="+1 (555) 019-2834"
              value={formData.contactPhone}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.contactPhone}
              helpText="Hospital coordination desk telephone number."
            />
          </div>
        </div>

        {/* Section 3: Hospital Structure */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-emerald)' }}>
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              3. Hospital Structure
            </h2>
            <p className="form-section-desc">
              Initial structural metrics to prepare your automated round queue topologies.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <FormField
              id="floorCount"
              label="Number of Floors"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5"
              value={formData.floorCount}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.floorCount}
              helpText="Total operational clinical floors."
            />

            <FormField
              id="wardCount"
              label="Number of Wards"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 14"
              value={formData.wardCount}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={errors.wardCount}
              helpText="Inpatient units (e.g. Cardiology, Orthopedics, ICU)."
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Create Hospital Workspace &rarr;
          </Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Hospital workspace configurations can be edited after initialization.
          </div>
        </div>
      </form>
    </div>
  );
}
