import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import Modal from '../../components/common/Modal';

import DoctorModal from './components/DoctorModal';
import NurseModal from './components/NurseModal';

import {
  getStaffData,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  addNurse,
  updateNurse,
  deleteNurse,
  getStaffSummary,
} from '../../services/clinicalStaffService';

export default function ClinicalStaff() {
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'nurses'
  const [staffData, setStaffData] = useState({ doctors: [], nurses: [] });
  const [summary, setSummary] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalNurses: 0,
    activeNurses: 0,
  });

  // Modal states
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [nurseModalOpen, setNurseModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState(null);

  // In-app delete confirmation modal
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'doctor' | 'nurse'
    id: null,
    name: '',
    roleText: '',
  });

  const loadData = () => {
    const data = getStaffData();
    setStaffData(data);
    setSummary(getStaffSummary());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Doctor Handlers
  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setDoctorModalOpen(true);
  };

  const handleSaveDoctor = (docData) => {
    if (editingDoctor) {
      updateDoctor(editingDoctor.doctorId, docData);
    } else {
      addDoctor(docData);
    }
    loadData();
  };

  const handleConfirmDeleteDoctor = (doc) => {
    setDeleteDialog({
      isOpen: true,
      type: 'doctor',
      id: doc.doctorId,
      name: doc.name,
      roleText: `${doc.specialization} (${doc.department})`,
    });
  };

  // Nurse Handlers
  const handleOpenAddNurse = () => {
    setEditingNurse(null);
    setNurseModalOpen(true);
  };

  const handleOpenEditNurse = (nurse) => {
    setEditingNurse(nurse);
    setNurseModalOpen(true);
  };

  const handleSaveNurse = (nurseData) => {
    if (editingNurse) {
      updateNurse(editingNurse.nurseId, nurseData);
    } else {
      addNurse(nurseData);
    }
    loadData();
  };

  const handleConfirmDeleteNurse = (nurse) => {
    setDeleteDialog({
      isOpen: true,
      type: 'nurse',
      id: nurse.nurseId,
      name: nurse.name,
      roleText: `Floor Nurse (${nurse.departmentOrWard})`,
    });
  };

  // Delete Execution
  const handleExecuteDelete = () => {
    if (deleteDialog.type === 'doctor') {
      deleteDoctor(deleteDialog.id);
    } else if (deleteDialog.type === 'nurse') {
      deleteNurse(deleteDialog.id);
    }
    setDeleteDialog({ isOpen: false, type: null, id: null, name: '', roleText: '' });
    loadData();
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
          <Badge variant="navy">Step 2 of 4: Medical Staffing</Badge>
          <StatusIndicator status="active" label="Staff Directory Active" />
        </div>
      </div>

      {/* Page Title & Supporting Text */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
          Clinical Staff
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', maxWidth: '780px', lineHeight: 1.5 }}>
          Manage attending doctors, resident physicians, and ward nurses participating in daily hospital rounds.
          Configure medical specialties and department assignments.
        </p>
      </div>

      {/* Summary Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Doctors
            </span>
            <Badge variant="blue">Attending & Specialists</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.totalDoctors}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {summary.activeDoctors} Active for rounds
          </span>
        </Card>

        <Card hover>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Nurses
            </span>
            <Badge variant="teal">Floor & Ward Care</Badge>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
            {summary.totalNurses}
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {summary.activeNurses} Active on duty
          </span>
        </Card>
      </div>

      {/* Main Staff Directory Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`tab-item ${activeTab === 'doctors' ? 'tab-item-active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Doctors ({staffData.doctors.length})
            </button>
            <button
              type="button"
              className={`tab-item ${activeTab === 'nurses' ? 'tab-item-active' : ''}`}
              onClick={() => setActiveTab('nurses')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Nurses ({staffData.nurses.length})
            </button>
          </div>

          {/* Primary Action Button */}
          {activeTab === 'doctors' ? (
            <Button variant="primary" onClick={handleOpenAddDoctor}>
              + Add Doctor
            </Button>
          ) : (
            <Button variant="primary" onClick={handleOpenAddNurse}>
              + Add Nurse
            </Button>
          )}
        </div>

        {/* Tab 1: Doctors Directory */}
        {activeTab === 'doctors' && (
          <div>
            {staffData.doctors.length === 0 ? (
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                  No Doctors Registered Yet
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                  Add your hospital’s attending physicians and rounding medical team.
                  Physicians can initiate rounds with one click in later stages.
                </p>
                <Button variant="primary" onClick={handleOpenAddDoctor}>
                  + Add First Doctor
                </Button>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Specialization</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.doctors.map((doc) => (
                      <tr key={doc.doctorId}>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-brand-navy)' }}>{doc.name}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', color: 'var(--color-text-secondary)' }}>
                            {doc.employeeId}
                          </span>
                        </td>
                        <td>{doc.department}</td>
                        <td>
                          <Badge variant="blue">{doc.specialization}</Badge>
                        </td>
                        <td>
                          <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {doc.phone && <span>📞 {doc.phone}</span>}
                            {doc.email && <span style={{ color: 'var(--color-text-muted)' }}>✉️ {doc.email}</span>}
                            {!doc.phone && !doc.email && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <Badge variant={doc.status === 'Active' ? 'emerald' : 'navy'}>
                            {doc.status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              onClick={() => handleOpenEditDoctor(doc)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              style={{ color: 'var(--color-rose)' }}
                              onClick={() => handleConfirmDeleteDoctor(doc)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Nurses Directory */}
        {activeTab === 'nurses' && (
          <div>
            {staffData.nurses.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '2px dashed var(--color-border-strong)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--color-teal-light)', color: 'var(--color-teal)', marginBottom: '1rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                  No Nurses Registered Yet
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                  Register ward and floor nurses. Nurses will be able to monitor real-time round progression
                  and prepare patients bedside before doctors arrive.
                </p>
                <Button variant="primary" onClick={handleOpenAddNurse}>
                  + Add First Nurse
                </Button>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Nurse Name</th>
                      <th>Employee ID</th>
                      <th>Department / Ward Assignment</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.nurses.map((nurse) => (
                      <tr key={nurse.nurseId}>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-brand-navy)' }}>{nurse.name}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', color: 'var(--color-text-secondary)' }}>
                            {nurse.employeeId}
                          </span>
                        </td>
                        <td>
                          <Badge variant="teal">{nurse.departmentOrWard}</Badge>
                        </td>
                        <td>
                          <div style={{ fontSize: 'var(--font-size-xs)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {nurse.phone && <span>📞 {nurse.phone}</span>}
                            {nurse.email && <span style={{ color: 'var(--color-text-muted)' }}>✉️ {nurse.email}</span>}
                            {!nurse.phone && !nurse.email && <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <Badge variant={nurse.status === 'Active' ? 'emerald' : 'navy'}>
                            {nurse.status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              onClick={() => handleOpenEditNurse(nurse)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-subtle btn-sm"
                              style={{ color: 'var(--color-rose)' }}
                              onClick={() => handleConfirmDeleteNurse(nurse)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <DoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSave={handleSaveDoctor}
        doctor={editingDoctor}
        existingDoctors={staffData.doctors}
      />

      <NurseModal
        isOpen={nurseModalOpen}
        onClose={() => setNurseModalOpen(false)}
        onSave={handleSaveNurse}
        nurse={editingNurse}
        existingNurses={staffData.nurses}
      />

      {/* In-App Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        title="Confirm Staff Removal"
      >
        <div className="modal-body">
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-brand-navy)', marginBottom: '0.75rem' }}>
            Are you sure you want to remove <strong>{deleteDialog.name}</strong> from the clinical staff directory?
          </p>
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Role: {deleteDialog.roleText}
          </div>
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
            Remove Staff Member
          </button>
        </div>
      </Modal>
    </div>
  );
}
