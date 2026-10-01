import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import Modal from '../../components/common/Modal';

import PatientModal from './components/PatientModal';

import {
  getPatients,
  addPatient,
  updatePatient,
  dischargePatient,
  getPatientSummary,
} from '../../services/patientService';
import { getStaffData } from '../../services/clinicalStaffService';
import { getHospitalStructure } from '../../services/hospitalStructureService';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    discharged: 0,
    occupiedBeds: 0,
    availableBeds: 0,
  });

  // Dependent data from other services
  const [activeDoctors, setActiveDoctors] = useState([]);
  const [structure, setStructure] = useState({ floors: [], wards: [], rooms: [], beds: [] });

  // Modal states
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  // Discharge confirmation
  const [dischargeDialog, setDischargeDialog] = useState({
    isOpen: false,
    patientId: null,
    name: '',
  });

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadAll = () => {
    setPatients(getPatients());
    setSummary(getPatientSummary());
    // Reload structure so bed statuses are fresh
    setStructure(getHospitalStructure());
  };

  useEffect(() => {
    loadAll();
    const staffData = getStaffData();
    setActiveDoctors(staffData.doctors.filter((d) => d.status === 'Active'));
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setPatientModalOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setEditingPatient(patient);
    setPatientModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingPatient) {
      updatePatient(editingPatient.patientId, data);
    } else {
      addPatient(data);
    }
    loadAll();
  };

  const handleConfirmDischarge = (patient) => {
    setDischargeDialog({ isOpen: true, patientId: patient.patientId, name: patient.name });
  };

  const handleExecuteDischarge = () => {
    dischargePatient(dischargeDialog.patientId);
    setDischargeDialog({ isOpen: false, patientId: null, name: '' });
    loadAll();
  };

  // ─── Display helpers ───────────────────────────────────────────────────────

  const getDoctorName = (doctorId) => {
    const allDoctors = getStaffData().doctors;
    const doc = allDoctors.find((d) => d.doctorId === doctorId);
    return doc ? doc.name : '—';
  };

  const getWardName = (wardId) => {
    const ward = structure.wards.find((w) => w.wardId === wardId);
    return ward ? ward.wardName : '—';
  };

  const getRoomNumber = (roomId) => {
    const room = structure.rooms.find((r) => r.roomId === roomId);
    return room ? `Room ${room.roomNumber}` : '—';
  };

  const getBedNumber = (bedId) => {
    const bed = structure.beds.find((b) => b.bedId === bedId);
    return bed ? bed.bedNumber : '—';
  };

  // ─── Filtered patients ─────────────────────────────────────────────────────

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q)
    );
  });

  // ─── Render ────────────────────────────────────────────────────────────────

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
          <Badge variant="navy">Step 3 of 4: Patient Management</Badge>
          <StatusIndicator status="active" label="Patient Directory Active" />
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
          Patient Management
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', maxWidth: '780px', lineHeight: 1.5 }}>
          Register inpatients and assign them to attending doctors and specific beds. Bed availability
          is tracked in real time. Patients receive a unique access code upon registration.
        </p>
      </div>

      {/* Summary Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Total Patients
            </span>
            <Badge variant="navy">All Time</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.total}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {summary.discharged} discharged
          </span>
        </Card>

        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Active Patients
            </span>
            <Badge variant="emerald">Inpatient</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.active}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Currently admitted
          </span>
        </Card>

        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Occupied Beds
            </span>
            <Badge variant="blue">In Use</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.occupiedBeds}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Beds currently occupied
          </span>
        </Card>

        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Available Beds
            </span>
            <Badge variant="teal">Open</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.availableBeds}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Ready for assignment
          </span>
        </Card>
      </div>

      {/* Directory Header: Search + Add */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '360px' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or Patient ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <Button variant="primary" onClick={handleOpenAdd}>
            + Register Patient
          </Button>
        </div>

        {/* Patient Table or Empty State */}
        {filteredPatients.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '2px dashed var(--color-border-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '1rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-primary-light)',
                color: 'var(--color-brand-primary)',
                marginBottom: '1rem',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
              {searchQuery ? 'No patients match your search' : 'No Patients Registered Yet'}
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              {searchQuery
                ? `No results found for "${searchQuery}". Try a different name or Patient ID.`
                : 'Register your first inpatient to assign them to a doctor, ward, room, and bed.'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={handleOpenAdd}>
                + Register First Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Patient ID</th>
                  <th>Assigned Doctor</th>
                  <th>Ward</th>
                  <th>Room / Bed</th>
                  <th>Access Code</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.patientId}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--color-brand-navy)' }}>{p.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                        {p.gender}, {p.age} yrs
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '500', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                        {p.patientId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>{getDoctorName(p.assignedDoctorId)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>{getWardName(p.wardId)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>{getRoomNumber(p.roomId)}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                        {getBedNumber(p.bedId)}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: 'var(--font-size-xs)', color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>
                        {p.accessCode}
                      </span>
                    </td>
                    <td>
                      <Badge variant={p.status === 'Active' ? 'emerald' : 'navy'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {p.status === 'Active' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              onClick={() => handleOpenEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              style={{ color: 'var(--color-amber)' }}
                              onClick={() => handleConfirmDischarge(p)}
                            >
                              Discharge
                            </button>
                          </>
                        )}
                        {p.status === 'Discharged' && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}>
                            Discharged
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Add/Edit Modal */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSave}
        patient={editingPatient}
        doctors={activeDoctors}
        structure={structure}
      />

      {/* Discharge Confirmation Modal */}
      <Modal
        isOpen={dischargeDialog.isOpen}
        onClose={() => setDischargeDialog((prev) => ({ ...prev, isOpen: false }))}
        title="Confirm Patient Discharge"
      >
        <div className="modal-body">
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-brand-navy)', marginBottom: '0.75rem' }}>
            Are you sure you want to discharge <strong>{dischargeDialog.name}</strong>?
          </p>
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong>What happens:</strong>
            <ul style={{ margin: '0.4rem 0 0 1.1rem', padding: 0 }}>
              <li>Patient status will be set to <strong>Discharged</strong>.</li>
              <li>Their bed will be marked <strong>Available</strong> for new assignments.</li>
              <li>This action cannot be undone in the current version.</li>
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <Button
            type="button"
            variant="subtle"
            onClick={() => setDischargeDialog((prev) => ({ ...prev, isOpen: false }))}
          >
            Cancel
          </Button>
          <button
            type="button"
            className="btn"
            style={{ backgroundColor: 'var(--color-amber)', color: '#ffffff' }}
            onClick={handleExecuteDischarge}
          >
            Confirm Discharge
          </button>
        </div>
      </Modal>
    </div>
  );
}
