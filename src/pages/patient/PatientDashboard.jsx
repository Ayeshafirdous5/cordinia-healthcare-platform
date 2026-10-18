import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import Button from '../../components/common/Button';
import NotificationCenter from '../../components/common/NotificationCenter';

import { getPatients } from '../../services/patientService';
import { getStaffData } from '../../services/clinicalStaffService';
import { getHospitalStructure } from '../../services/hospitalStructureService';
import { getActiveRound, getQueueForRound, getRounds } from '../../services/roundService';
import { calculateQueueEtas } from '../../services/etaService';

const PATIENT_SESSION_KEY = 'cordinia_patient_session';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [locationInfo, setLocationInfo] = useState({ floor: null, ward: null, room: null, bed: null });
  const [roundState, setRoundState] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3-second live polling for prototype localStorage updates across tabs
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(() => {
    try {
      const rawSession = sessionStorage.getItem(PATIENT_SESSION_KEY);
      if (!rawSession) {
        navigate('/patient/access', { replace: true });
        return;
      }

      const { patientId } = JSON.parse(rawSession);
      const patients = getPatients();
      const currentPatient = patients.find((p) => p.patientId === patientId && p.status === 'Active');

      if (!currentPatient) {
        // Patient discharged or not found
        sessionStorage.removeItem(PATIENT_SESSION_KEY);
        navigate('/patient/access', { replace: true });
        return;
      }

      setPatient(currentPatient);

      // Load Doctor
      const staffData = getStaffData();
      const assignedDoc = staffData.doctors.find((d) => d.doctorId === currentPatient.assignedDoctorId) || null;
      setDoctor(assignedDoc);

      // Load Location
      const structure = getHospitalStructure();
      const fl = structure.floors.find((f) => f.floorId === currentPatient.floorId) || null;
      const wd = structure.wards.find((w) => w.wardId === currentPatient.wardId) || null;
      const rm = structure.rooms.find((r) => r.roomId === currentPatient.roomId) || null;
      const bd = structure.beds.find((b) => b.bedId === currentPatient.bedId) || null;
      setLocationInfo({ floor: fl, ward: wd, room: rm, bed: bd });

      // Load Round Status
      if (!assignedDoc) {
        setRoundState(null);
        return;
      }

      let activeRnd = getActiveRound(assignedDoc.doctorId);
      let isRoundActive = true;
      let targetRound = activeRnd;

      if (!targetRound) {
        // Look up last completed round
        const allRounds = getRounds();
        const docRounds = allRounds
          .filter((r) => r.doctorId === assignedDoc.doctorId && r.status === 'COMPLETED')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        targetRound = docRounds[0] || null;
        isRoundActive = false;
      }

      if (!targetRound) {
        setRoundState(null);
        return;
      }

      const queue = getQueueForRound(targetRound.roundId);
      const patientEntry = queue.find((q) => q.patientId === currentPatient.patientId) || null;

      if (!patientEntry && !isRoundActive) {
        setRoundState(null);
        return;
      }

      const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;
      const totalCount = queue.length;

      // Calculate ETAs
      const now = new Date();
      const { etaMap, observedDelay, activeOverrunMinutes } = calculateQueueEtas(queue, patients, structure, now);
      const etaInfo = patientEntry ? etaMap[patientEntry.roundPatientId] || null : null;

      // Calculate patients ahead (non-completed queue items before patient's position)
      let patientsAhead = 0;
      if (patientEntry && patientEntry.status === 'WAITING') {
        const patientIdx = queue.findIndex((q) => q.roundPatientId === patientEntry.roundPatientId);
        if (patientIdx > 0) {
          patientsAhead = queue.slice(0, patientIdx).filter((q) => q.status !== 'COMPLETED').length;
        }
      }

      setRoundState({
        round: targetRound,
        queue,
        patientEntry,
        status: patientEntry ? patientEntry.status : (isRoundActive ? 'WAITING' : 'COMPLETED'),
        patientsAhead,
        completedCount,
        totalCount,
        etaInfo,
        observedDelay,
        activeOverrunMinutes,
        isRoundActive,
      });

    } catch (err) {
      console.warn('Error loading patient portal data:', err);
      sessionStorage.removeItem(PATIENT_SESSION_KEY);
      navigate('/patient/access', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData, tick]);

  const handleSignOut = () => {
    sessionStorage.removeItem(PATIENT_SESSION_KEY);
    navigate('/patient/access');
  };

  if (loading || !patient) {
    return null;
  }

  // Location string helper
  const locationParts = [];
  if (locationInfo.floor) locationParts.push(locationInfo.floor.floorName);
  if (locationInfo.ward) locationParts.push(locationInfo.ward.wardName);
  if (locationInfo.room) locationParts.push(`Room ${locationInfo.room.roomNumber}`);
  if (locationInfo.bed) locationParts.push(locationInfo.bed.bedNumber);
  const locationString = locationParts.join(' · ') || 'Location details unavailable';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '840px', margin: '0 auto' }}>

      {/* Header / Portal Context Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant="emerald">Patient Portal</Badge>
            <StatusIndicator status="active" label="Active Inpatient Session" />
          </div>

          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Exit / Sign Out
          </Button>
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.4rem', color: 'var(--color-brand-navy)' }}>
          Patient Dashboard
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Welcome, <strong>{patient.name}</strong>. Real-time updates for your attending doctor's rounds.
        </p>
      </div>

      {/* ── DOCTOR ROUND STATUS CARD (PART 5B) ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)' }}>
            Doctor Round Status
          </h2>
          {roundState && roundState.isRoundActive && roundState.status === 'CURRENT' && (
            <StatusIndicator status="active" label="Visiting You Now" />
          )}
          {roundState && roundState.isRoundActive && roundState.status === 'WAITING' && (
            <StatusIndicator status="info" label="Rounds In Progress" />
          )}
          {roundState && roundState.status === 'COMPLETED' && (
            <Badge variant="teal">Visit Complete</Badge>
          )}
          {(!roundState || (!roundState.isRoundActive && roundState.status !== 'COMPLETED')) && (
            <StatusIndicator status="pending" label="Rounds Standby" />
          )}
        </div>

        {/* State A: No Active Round */}
        {(!roundState || (!roundState.isRoundActive && roundState.status !== 'COMPLETED')) && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱</div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)', marginBottom: '0.4rem' }}>
              Doctor rounds have not started yet.
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
              Your attending physician {doctor ? <strong>{doctor.name}</strong> : 'team'} has not initiated rounds yet. Arrival estimates will appear here automatically once rounds begin.
            </p>
          </div>
        )}

        {/* State B: Active Round + Patient WAITING */}
        {roundState && roundState.isRoundActive && roundState.status === 'WAITING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)', fontWeight: '700', marginBottom: '0.25rem' }}>
                Doctor is currently in rounds
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Dr. {doctor ? doctor.name : 'Attending Physician'} is visiting assigned inpatients.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--color-bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  Queue Position
                </span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
                  {roundState.patientsAhead} {roundState.patientsAhead === 1 ? 'patient' : 'patients'} ahead
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  Estimated Wait Time
                </span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-primary)', marginTop: '0.25rem' }}>
                  {roundState.etaInfo?.label || 'ETA is currently being calculated.'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  Round Progress
                </span>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
                  {roundState.completedCount} of {roundState.totalCount} patients
                </div>
              </div>
            </div>

            {/* Delay Intelligence Note if explanation is available (Part 7C) */}
            {Boolean(roundState.etaInfo?.explanation) && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: 'var(--font-size-xs)',
                  color: '#92400e',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⏱</span>
                <span>{roundState.etaInfo.explanation}</span>
              </div>
            )}
          </div>
        )}

        {/* State C: Active Round + Patient CURRENT */}
        {roundState && roundState.isRoundActive && roundState.status === 'CURRENT' && (
          <div
            style={{
              backgroundColor: 'var(--color-brand-primary-light)',
              border: '2px solid var(--color-brand-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-brand-navy)', fontWeight: '700' }}>
                Doctor is visiting you now
              </h3>
              <Badge variant="blue">Bedside Visit Active</Badge>
            </div>

            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-brand-navy)', lineHeight: 1.5 }}>
              Your attending physician {doctor ? <strong>{doctor.name}</strong> : 'team'} is currently at your bedside for today's clinical round.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-primary)', fontWeight: '700' }}>
                  Current Status
                </span>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-brand-navy)', marginTop: '0.15rem' }}>
                  {roundState.etaInfo?.remainingLabel || 'Being visited now'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-primary)', fontWeight: '700' }}>
                  Round Progress
                </span>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-brand-navy)', marginTop: '0.15rem' }}>
                  {roundState.completedCount} of {roundState.totalCount} patients
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State D & E: Patient Visit COMPLETED / Round COMPLETED */}
        {roundState && roundState.status === 'COMPLETED' && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid var(--color-teal)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '2rem' }}>✓</div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)', fontWeight: '700' }}>
              {!roundState.isRoundActive ? "Doctor's round is complete" : "Your round visit is complete"}
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
              Your attending doctor visit for this round has been completed. If you have any follow-up questions, please notify your ward nurse.
            </p>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Round progress: {roundState.completedCount} of {roundState.totalCount} patients visited
            </div>
          </div>
        )}
      </Card>

      {/* ── NOTIFICATION CENTER (PART 6A) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <NotificationCenter recipientType="patient" recipientId={patient.patientId} />
      </div>

      {/* Admission Details & Care Team Summary Card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)' }}>
            Admission Details
          </h2>
          <Badge variant="emerald">Code: {patient.accessCode}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Patient Name
            </span>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {patient.name}
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {patient.gender}, {patient.age} yrs
            </span>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Patient ID
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {patient.patientId}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Bed Assignment
            </span>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {locationString}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Attending Physician
            </span>
            {doctor ? (
              <div style={{ marginTop: '0.25rem' }}>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-navy)' }}>
                  {doctor.name}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {doctor.specialization} ({doctor.department})
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Unassigned
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Security & Access Notice */}
      <div
        style={{
          borderLeft: '4px solid var(--color-emerald)',
          backgroundColor: 'var(--color-emerald-light)',
          padding: '1rem 1.25rem',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-brand-navy)',
          lineHeight: 1.5,
        }}
      >
        <strong>Live Bedside Status:</strong> Your portal updates automatically as your attending doctor conducts rounds across the floor. Confidential medical details of other patients are strictly protected and never shown.
      </div>
    </div>
  );
}
