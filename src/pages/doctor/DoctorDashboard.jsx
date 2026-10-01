import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';

import { getStaffData } from '../../services/clinicalStaffService';
import { getPatients } from '../../services/patientService';
import { getHospitalStructure } from '../../services/hospitalStructureService';
import {
  getActiveRound,
  getQueueForRound,
  getRounds,
  startRound,
  advanceRound,
} from '../../services/roundService';
import { calculateQueueEtas } from '../../services/etaService';

// ─── localStorage key for demo doctor identity ────────────────────────────────
const DEMO_DOCTOR_KEY = 'cordinia_demo_doctor_id';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QueueStatusBadge({ status }) {
  if (status === 'CURRENT') return <Badge variant="blue">Current</Badge>;
  if (status === 'COMPLETED') return <Badge variant="teal">Done</Badge>;
  return <Badge variant="navy">Waiting</Badge>;
}

function PatientLocationLine({ patient, structure }) {
  if (!patient || !structure) return null;

  const floor = structure.floors.find((f) => f.floorId === patient.floorId);
  const ward = structure.wards.find((w) => w.wardId === patient.wardId);
  const room = structure.rooms.find((r) => r.roomId === patient.roomId);
  const bed = structure.beds.find((b) => b.bedId === patient.bedId);

  const parts = [];
  if (floor) parts.push(floor.floorName);
  if (ward) parts.push(ward.wardName);
  if (room) parts.push(`Room ${room.roomNumber}`);
  if (bed) parts.push(bed.bedNumber);

  return (
    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
      {parts.join(' · ') || 'Location not assigned'}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  // Demo doctor identity
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    return localStorage.getItem(DEMO_DOCTOR_KEY) || '';
  });

  // Round state
  const [activeRound, setActiveRound] = useState(null);
  const [queue, setQueue] = useState([]);
  const [roundCompleted, setRoundCompleted] = useState(false); // true after last patient is marked done

  // Current timestamp for ETA calculation
  const [now, setNow] = useState(new Date());

  // Periodic ETA refresh (every 30 seconds) while a round is active
  useEffect(() => {
    if (!activeRound || roundCompleted) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, [activeRound, roundCompleted]);

  // Dependent data
  const [patients, setPatients] = useState([]);
  const [structure, setStructure] = useState({ floors: [], wards: [], rooms: [], beds: [] });

  // Inline message (replaces browser alert)
  const [message, setMessage] = useState(null); // { type: 'info'|'warn'|'error', text: string }

  // ── Load reference data ────────────────────────────────────────────────────

  useEffect(() => {
    const staffData = getStaffData();
    setDoctors(staffData.doctors.filter((d) => d.status === 'Active'));
    setPatients(getPatients());
    setStructure(getHospitalStructure());
  }, []);

  // ── Restore round on mount / doctor change ─────────────────────────────────

  const loadRoundState = useCallback((doctorId) => {
    if (!doctorId) {
      setActiveRound(null);
      setQueue([]);
      setRoundCompleted(false);
      return;
    }
    // Check for an in-progress (ACTIVE) round first
    const existing = getActiveRound(doctorId);
    if (existing) {
      const q = getQueueForRound(existing.roundId);
      setActiveRound(existing);
      setQueue(q);
      setRoundCompleted(false);
      return;
    }
    // Check if the most-recent round for this doctor is COMPLETED
    // (to restore the completion screen after a refresh)
    const allRounds = getRounds();
    const doctorRounds = allRounds
      .filter((r) => r.doctorId === doctorId && r.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const lastCompleted = doctorRounds[0] || null;
    if (lastCompleted) {
      const q = getQueueForRound(lastCompleted.roundId);
      setActiveRound(lastCompleted);
      setQueue(q);
      setRoundCompleted(true);
      return;
    }
    // No rounds at all
    setActiveRound(null);
    setQueue([]);
    setRoundCompleted(false);
  }, []);

  useEffect(() => {
    loadRoundState(selectedDoctorId);
  }, [selectedDoctorId, loadRoundState]);

  // ── Doctor selection ───────────────────────────────────────────────────────

  const handleSelectDoctor = (e) => {
    const id = e.target.value;
    setSelectedDoctorId(id);
    setMessage(null);
    setRoundCompleted(false);
    if (id) {
      localStorage.setItem(DEMO_DOCTOR_KEY, id);
    } else {
      localStorage.removeItem(DEMO_DOCTOR_KEY);
    }
  };

  // ── Start Rounds ───────────────────────────────────────────────────────────

  const handleStartRounds = () => {
    if (!selectedDoctorId) {
      setMessage({ type: 'warn', text: 'Please select a doctor identity before starting rounds.' });
      return;
    }

    const result = startRound(selectedDoctorId);

    if (result.patientCount === 0) {
      setMessage({
        type: 'warn',
        text: 'No active patients are currently assigned to this doctor. Register and assign patients in Patient Management first.',
      });
      return;
    }

    if (result.alreadyActive) {
      setMessage({ type: 'info', text: 'An active round already exists. Restored below.' });
    } else {
      setMessage(null);
    }

    // Refresh patient/structure data so location lookups are fresh
    setPatients(getPatients());
    setStructure(getHospitalStructure());

    setNow(new Date());
    setRoundCompleted(false);
    setActiveRound(result.round);
    setQueue(result.queue);
  };

  // ── Mark Visit Complete ────────────────────────────────────────────────────

  const handleMarkComplete = () => {
    if (!activeRound) {
      setMessage({ type: 'error', text: 'No active round found. Please start a new round.' });
      return;
    }

    const result = advanceRound(activeRound.roundId);

    if (!result) {
      setMessage({ type: 'error', text: 'Could not advance the round. Please refresh and try again.' });
      return;
    }

    setMessage(null);
    setQueue(result.queue);
    setNow(new Date());

    if (result.roundCompleted) {
      setRoundCompleted(true);
      setActiveRound(result.round); // store the now-COMPLETED round for display
    } else {
      setActiveRound(result.round);
    }
  };

  // ── Derived display data ───────────────────────────────────────────────────

  const selectedDoctor = doctors.find((d) => d.doctorId === selectedDoctorId) || null;

  const currentQueueEntry = queue.find((qe) => qe.status === 'CURRENT') || null;
  const currentPatient = currentQueueEntry
    ? patients.find((p) => p.patientId === currentQueueEntry.patientId) || null
    : null;

  const completedCount = queue.filter((qe) => qe.status === 'COMPLETED').length;
  const totalCount = queue.length;

  // Calculate ETAs and delay intelligence for all queue entries
  const { etaMap: queueEtas, observedDelay } = calculateQueueEtas(queue, patients, structure, now);

  // ── Inline message colours ─────────────────────────────────────────────────

  const messageStyle = {
    info: { bg: 'var(--color-brand-primary-light)', border: 'var(--color-brand-primary)', text: 'var(--color-brand-navy)' },
    warn: { bg: '#fef9c3', border: '#ca8a04', text: '#713f12' },
    error: { bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d' },
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Role Banner ── */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Badge variant="blue">Role: Doctor / Attending Physician</Badge>
          <StatusIndicator
            status={roundCompleted ? 'active' : activeRound ? 'active' : 'info'}
            label={roundCompleted ? 'Round Completed' : activeRound ? 'Round In Progress' : 'Rounds Station Standby'}
          />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.75rem' }}>
          Cordinia Physician Rounds Console
        </h1>
        <p style={{ maxWidth: '800px', fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Designed for physicians to conduct rounds with zero friction. With one simple action,
          Cordinia assembles your patient round queue from assigned inpatients and sequences
          them by floor and ward.
        </p>
      </div>

      {/* ── Doctor Identity Selector (prototype) ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: selectedDoctor ? '1rem' : 0 }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-brand-navy)', marginBottom: '0.25rem' }}>
              Acting As
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Prototype mode — select a registered doctor to act as.
            </p>
          </div>
          {selectedDoctor && (
            <Badge variant="blue">{selectedDoctor.name}</Badge>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <select
              className="form-input"
              value={selectedDoctorId}
              onChange={handleSelectDoctor}
            >
              <option value="">— Select doctor —</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} · {d.specialization} ({d.department})
                </option>
              ))}
            </select>
            {doctors.length === 0 && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#ca8a04', marginTop: '0.4rem' }}>
                No active doctors found. Add doctors in Clinical Staff first.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Inline Message ── */}
      {message && (
        <div
          style={{
            backgroundColor: messageStyle[message.type].bg,
            border: `1px solid ${messageStyle[message.type].border}`,
            borderLeft: `4px solid ${messageStyle[message.type].border}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.125rem',
            fontSize: 'var(--font-size-sm)',
            color: messageStyle[message.type].text,
            lineHeight: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: 'inherit', flexShrink: 0 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── START ROUNDS / Active Round Panel ── */}
      {!activeRound && !roundCompleted ? (
        /* No round at all → show Start button */
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '1.1rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand-primary-light)',
              color: 'var(--color-brand-primary)',
            }}
          >
            {/* Rounds icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-brand-navy)', marginBottom: '0.4rem' }}>
              Ready to Start Rounds
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
              Select a doctor above, then click <strong>Start Rounds</strong>. Cordinia will automatically
              build your visit queue from all currently active assigned patients, grouped by floor and ward.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartRounds}
            disabled={!selectedDoctorId}
          >
            ▶ Start Rounds
          </Button>
        </div>
      ) : roundCompleted ? (
        /* ── Round Completed View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Completion banner */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '2px solid var(--color-teal)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Badge variant="teal">Round Completed</Badge>
                <StatusIndicator status="active" label="All patients visited" />
              </div>
              {activeRound && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {formatDate(activeRound.startedAt)} at {formatTime(activeRound.startedAt)}
                  {activeRound.endedAt && ` → ${formatTime(activeRound.endedAt)}`}
                </span>
              )}
            </div>

            {/* Final progress bar — 100% */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                  Progress
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
                  {totalCount} of {totalCount} patients
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border-default)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-teal)',
                    width: '100%',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Success message */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid var(--color-teal)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✓</div>
              <div style={{ fontWeight: '700', fontSize: 'var(--font-size-base)', color: 'var(--color-brand-navy)', marginBottom: '0.25rem' }}>
                Round Complete
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                All {totalCount} patient{totalCount !== 1 ? 's' : ''} visited. Well done.
              </div>
            </div>
          </div>

          {/* Completed queue summary */}
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)', marginBottom: '1rem' }}>
              Round Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {queue.map((entry) => {
                const p = patients.find((pt) => pt.patientId === entry.patientId);
                return (
                  <div
                    key={entry.roundPatientId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--radius-lg)',
                      opacity: 0.75,
                    }}
                  >
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-teal)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', color: 'var(--color-brand-navy)', fontSize: 'var(--font-size-sm)' }}>
                        {p ? p.name : 'Patient not found'}
                      </div>
                      {p && (
                        <div style={{ marginTop: '0.15rem' }}>
                          <PatientLocationLine patient={p} structure={structure} />
                        </div>
                      )}
                    </div>
                    <Badge variant="teal">Done</Badge>
                  </div>
                );
              })}
            </div>

            {/* Start new round CTA */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Ready to start your next round?
              </span>
              <Button variant="outline" onClick={handleStartRounds}>
                ▶ Start New Round
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Active Round View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Round header */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '2px solid var(--color-brand-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Badge variant="blue">Active Round</Badge>
                <StatusIndicator status="active" label="In Progress" />
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Started {formatDate(activeRound.startedAt)} at {formatTime(activeRound.startedAt)}
              </span>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                    Progress
                  </span>
                  {completedCount > 0 && (
                    <Badge variant={observedDelay > 0 ? 'amber' : 'teal'}>
                      {observedDelay > 0 ? `Observed round delay: +${observedDelay} min/patient` : 'Round pace: On baseline'}
                    </Badge>
                  )}
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
                  {completedCount} of {totalCount} patients
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border-default)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-brand-primary)',
                    width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Current Patient box */}
            {currentPatient ? (
              <div
                style={{
                  backgroundColor: 'var(--color-brand-primary-light)',
                  border: '1px solid var(--color-brand-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-brand-primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Current Patient
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--color-brand-navy)' }}>
                    {currentPatient.name}
                  </span>
                  <Badge variant="blue">#{currentQueueEntry.sequence}</Badge>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {currentPatient.gender}, {currentPatient.age} yrs
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <PatientLocationLine patient={currentPatient} structure={structure} />
                </div>

                {/* ETA summary for Current Patient */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: '0.75rem 0 1.25rem 0',
                    flexWrap: 'wrap',
                  }}
                >
                  <Badge variant="blue">Being visited now</Badge>
                  {queueEtas[currentQueueEntry?.roundPatientId]?.remainingLabel && (
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-brand-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--color-bg-surface)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                      ⏱ {queueEtas[currentQueueEntry.roundPatientId].remainingLabel}
                    </span>
                  )}
                </div>

                {/* ── Mark Visit Complete action ── */}
                <Button variant="primary" onClick={handleMarkComplete}>
                  ✓ Mark Visit Complete
                </Button>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                All patients have been visited. Round complete.
              </div>
            )}
          </div>

          {/* Queue */}
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)', marginBottom: '1rem' }}>
              Round Queue
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {queue.map((entry) => {
                const p = patients.find((pt) => pt.patientId === entry.patientId);
                const isCurrent = entry.status === 'CURRENT';
                const isDone = entry.status === 'COMPLETED';
                const etaInfo = queueEtas[entry.roundPatientId];

                return (
                  <div
                    key={entry.roundPatientId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.875rem 1.125rem',
                      backgroundColor: isCurrent
                        ? 'var(--color-brand-primary-light)'
                        : 'var(--color-bg-surface)',
                      border: `1px solid ${isCurrent ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
                      borderRadius: 'var(--radius-lg)',
                      opacity: isDone ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Sequence number */}
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: isCurrent
                          ? 'var(--color-brand-primary)'
                          : isDone
                          ? 'var(--color-teal)'
                          : 'var(--color-border-default)',
                        color: isCurrent || isDone ? '#fff' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '700',
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? '✓' : entry.sequence}
                    </div>

                    {/* Patient info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {p ? (
                        <>
                          <div style={{ fontWeight: isCurrent ? '700' : '500', color: 'var(--color-brand-navy)', fontSize: 'var(--font-size-sm)' }}>
                            {p.name}
                            {isCurrent && (
                              <span style={{ marginLeft: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-brand-primary)', fontWeight: '600' }}>
                                ← Now visiting
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.2rem' }}>
                            <PatientLocationLine patient={p} structure={structure} />
                          </div>
                          {!isDone && etaInfo?.label && (
                            <div style={{ marginTop: '0.25rem', fontSize: 'var(--font-size-xs)', color: isCurrent ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: isCurrent ? '600' : '500' }}>
                                <span>⏱ {etaInfo.label}</span>
                              </div>
                              {etaInfo.explanation && (
                                <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: '500', marginLeft: '1rem' }}>
                                  ↳ {etaInfo.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Patient not found</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{ flexShrink: 0 }}>
                      <QueueStatusBadge status={entry.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Capabilities (collapsed when round active) ── */}
      {!activeRound && (
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem', color: 'var(--color-brand-navy)' }}>
            Physician Rounds Capabilities
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              { title: 'One-Click Round Activation', badge: 'Fast Initiation', status: 'Ready for Rounds', statusType: 'info', desc: 'Start your morning or evening rounds with a single action. Cordinia assembles your queue automatically.' },
              { title: 'Automated Patient Queue', badge: 'Smart Queue', status: 'Active', statusType: 'active', desc: 'Sequences assigned patients by floor and ward. No manual selection required.' },
              { title: 'Real-Time Round Progression', badge: 'Execution', status: 'Coming in 3B', statusType: 'pending', desc: 'Mark bedside visits complete and advance the queue with zero administrative overhead.' },
              { title: 'Delay & Pause Reporting', badge: 'Coordination', status: 'Future', statusType: 'pending', desc: 'Notify nursing staff when delays occur, keeping families informed without phone calls.' },
            ].map((item, idx) => (
              <Card key={idx} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Badge variant="blue">{item.badge}</Badge>
                  <StatusIndicator status={item.statusType} label={item.status} />
                </div>
                <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Scope Disclaimer ── */}
      <div
        style={{
          borderLeft: '4px solid var(--color-brand-primary)',
          backgroundColor: 'var(--color-brand-primary-light)',
          padding: '1rem 1.25rem',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-brand-navy)',
        }}
      >
        <strong>Focus on Rounds Coordination:</strong> Cordinia focuses specifically on round predictability and flow.
        Clinical chart documentation, prescriptions, and EHR entries remain in your hospital's certified clinical records system.
      </div>
    </div>
  );
}
