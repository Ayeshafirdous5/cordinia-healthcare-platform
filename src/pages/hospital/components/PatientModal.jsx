import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import Button from '../../../components/common/Button';

/**
 * PatientModal — Add / Edit patient with cascading location selects.
 *
 * Props:
 *   isOpen          {boolean}
 *   onClose         {() => void}
 *   onSave          {(data) => void}
 *   patient         {PatientRecord | null}  — null = add mode
 *   doctors         {DoctorRecord[]}        — active doctors list
 *   structure       {{ floors, wards, rooms, beds }}
 */
export default function PatientModal({
  isOpen,
  onClose,
  onSave,
  patient = null,
  doctors = [],
  structure = { floors: [], wards: [], rooms: [], beds: [] },
}) {
  const isEditing = Boolean(patient);

  const emptyForm = {
    name: '',
    age: '',
    gender: '',
    assignedDoctorId: '',
    floorId: '',
    wardId: '',
    roomId: '',
    bedId: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Derived filtered lists for cascading selects
  const filteredWards = structure.wards.filter((w) => w.floorId === formData.floorId);
  const filteredRooms = structure.rooms.filter(
    (r) => r.wardId === formData.wardId && r.status !== 'Maintenance'
  );
  const filteredBeds = structure.beds.filter((b) => {
    if (b.roomId !== formData.roomId) return false;
    // Show available beds, plus the patient's currently held bed (edit mode)
    if (b.status === 'Available') return true;
    if (isEditing && patient && b.bedId === patient.bedId) return true;
    return false;
  });

  // Populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (patient) {
        setFormData({
          name: patient.name || '',
          age: patient.age !== undefined ? String(patient.age) : '',
          gender: patient.gender || '',
          assignedDoctorId: patient.assignedDoctorId || '',
          floorId: patient.floorId || '',
          wardId: patient.wardId || '',
          roomId: patient.roomId || '',
          bedId: patient.bedId || '',
        });
      } else {
        setFormData(emptyForm);
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Cascade resets
      if (name === 'floorId') {
        updated.wardId = '';
        updated.roomId = '';
        updated.bedId = '';
      } else if (name === 'wardId') {
        updated.roomId = '';
        updated.bedId = '';
      } else if (name === 'roomId') {
        updated.bedId = '';
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Patient name is required';
    }

    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120 || !Number.isInteger(ageNum)) {
      errs.age = 'Age must be a whole number between 1 and 120';
    }

    if (!formData.gender) {
      errs.gender = 'Gender is required';
    }

    if (!formData.assignedDoctorId) {
      errs.assignedDoctorId = 'Please assign a doctor';
    }

    if (!formData.floorId) {
      errs.floorId = 'Please select a floor';
    }

    if (!formData.wardId) {
      errs.wardId = 'Please select a ward';
    }

    if (!formData.roomId) {
      errs.roomId = 'Please select a room';
    }

    if (!formData.bedId) {
      errs.bedId = 'Please select an available bed';
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      name: formData.name.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      assignedDoctorId: formData.assignedDoctorId,
      floorId: formData.floorId,
      wardId: formData.wardId,
      roomId: formData.roomId,
      bedId: formData.bedId,
    });

    onClose();
  };

  // Helper label builders
  const floorLabel = (f) => `${f.floorName} (Floor ${f.floorNumber})`;
  const wardLabel = (w) => `${w.wardName} — ${w.wardType}`;
  const roomLabel = (r) => `Room ${r.roomNumber} (${r.roomType})`;
  const bedLabel = (b) => {
    const isCurrent = isEditing && patient && b.bedId === patient.bedId;
    return `${b.bedNumber}${isCurrent ? ' (Current)' : ''}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Patient Record' : 'Register New Patient'}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {/* Read-only fields when editing */}
          {isEditing && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  Patient ID
                </span>
                <div style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: 'var(--font-size-sm)', color: 'var(--color-brand-navy)', marginTop: '0.2rem' }}>
                  {patient.patientId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  Access Code
                </span>
                <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: 'var(--font-size-sm)', color: 'var(--color-brand-primary)', marginTop: '0.2rem' }}>
                  {patient.accessCode}
                </div>
              </div>
            </div>
          )}

          {/* Row 1: Name + Age */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <FormField
              id="patientName"
              name="name"
              label="Full Name"
              placeholder="e.g. Ahmed Al-Rashid"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
            <FormField
              id="patientAge"
              name="age"
              label="Age"
              type="number"
              placeholder="e.g. 45"
              value={formData.age}
              onChange={handleChange}
              required
              error={errors.age}
            />
          </div>

          {/* Row 2: Gender */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientGender">
              Gender <span className="required-mark">*</span>
            </label>
            <select
              id="patientGender"
              name="gender"
              className={`form-input${errors.gender ? ' form-input-error' : ''}`}
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">— Select gender —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <span className="form-error">{errors.gender}</span>}
          </div>

          {/* Row 3: Assigned Doctor */}
          <div className="form-group">
            <label className="form-label" htmlFor="assignedDoctorId">
              Assigned Doctor <span className="required-mark">*</span>
            </label>
            <select
              id="assignedDoctorId"
              name="assignedDoctorId"
              className={`form-input${errors.assignedDoctorId ? ' form-input-error' : ''}`}
              value={formData.assignedDoctorId}
              onChange={handleChange}
            >
              <option value="">— Select attending doctor —</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} — {d.specialization} ({d.department})
                </option>
              ))}
            </select>
            {errors.assignedDoctorId && <span className="form-error">{errors.assignedDoctorId}</span>}
            {doctors.length === 0 && (
              <span className="form-help-text" style={{ color: 'var(--color-amber)' }}>
                No active doctors found. Please add doctors in Clinical Staff first.
              </span>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              margin: '0.25rem 0 1rem 0',
              paddingTop: '0.75rem',
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-text-muted)',
              fontWeight: '600',
            }}
          >
            Bed Assignment
          </div>

          {/* Row 4: Floor */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientFloor">
              Floor <span className="required-mark">*</span>
            </label>
            <select
              id="patientFloor"
              name="floorId"
              className={`form-input${errors.floorId ? ' form-input-error' : ''}`}
              value={formData.floorId}
              onChange={handleChange}
            >
              <option value="">— Select floor —</option>
              {structure.floors.filter((f) => f.status === 'Active').map((f) => (
                <option key={f.floorId} value={f.floorId}>{floorLabel(f)}</option>
              ))}
            </select>
            {errors.floorId && <span className="form-error">{errors.floorId}</span>}
          </div>

          {/* Row 5: Ward */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientWard">
              Ward <span className="required-mark">*</span>
            </label>
            <select
              id="patientWard"
              name="wardId"
              className={`form-input${errors.wardId ? ' form-input-error' : ''}`}
              value={formData.wardId}
              onChange={handleChange}
              disabled={!formData.floorId}
            >
              <option value="">— Select ward —</option>
              {filteredWards.map((w) => (
                <option key={w.wardId} value={w.wardId}>{wardLabel(w)}</option>
              ))}
            </select>
            {errors.wardId && <span className="form-error">{errors.wardId}</span>}
            {formData.floorId && filteredWards.length === 0 && (
              <span className="form-help-text" style={{ color: 'var(--color-amber)' }}>
                No wards on this floor. Configure wards in Hospital Structure first.
              </span>
            )}
          </div>

          {/* Row 6: Room */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientRoom">
              Room <span className="required-mark">*</span>
            </label>
            <select
              id="patientRoom"
              name="roomId"
              className={`form-input${errors.roomId ? ' form-input-error' : ''}`}
              value={formData.roomId}
              onChange={handleChange}
              disabled={!formData.wardId}
            >
              <option value="">— Select room —</option>
              {filteredRooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>{roomLabel(r)}</option>
              ))}
            </select>
            {errors.roomId && <span className="form-error">{errors.roomId}</span>}
          </div>

          {/* Row 7: Bed */}
          <div className="form-group">
            <label className="form-label" htmlFor="patientBed">
              Bed <span className="required-mark">*</span>
            </label>
            <select
              id="patientBed"
              name="bedId"
              className={`form-input${errors.bedId ? ' form-input-error' : ''}`}
              value={formData.bedId}
              onChange={handleChange}
              disabled={!formData.roomId}
            >
              <option value="">— Select available bed —</option>
              {filteredBeds.map((b) => (
                <option key={b.bedId} value={b.bedId}>{bedLabel(b)}</option>
              ))}
            </select>
            {errors.bedId && <span className="form-error">{errors.bedId}</span>}
            {formData.roomId && filteredBeds.length === 0 && (
              <span className="form-help-text" style={{ color: 'var(--color-amber)' }}>
                No available beds in this room. All beds are occupied.
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save Changes' : 'Register Patient'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
