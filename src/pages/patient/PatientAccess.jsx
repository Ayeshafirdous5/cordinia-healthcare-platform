import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import { getPatients } from '../../services/patientService';

const PATIENT_SESSION_KEY = 'cordinia_patient_session';

export default function PatientAccess() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If already authenticated with an active patient, redirect to /patient
  useEffect(() => {
    try {
      const rawSession = sessionStorage.getItem(PATIENT_SESSION_KEY);
      if (rawSession) {
        const { patientId } = JSON.parse(rawSession);
        const patients = getPatients();
        const activePatient = patients.find((p) => p.patientId === patientId && p.status === 'Active');
        if (activePatient) {
          navigate('/patient', { replace: true });
        }
      }
    } catch (err) {
      sessionStorage.removeItem(PATIENT_SESSION_KEY);
    }
  }, [navigate]);

  const handleAccessSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedCode = accessCode.trim();
    if (!trimmedCode) {
      setError('Please enter your hospital access code.');
      return;
    }

    const patients = getPatients();
    const matchedPatient = patients.find(
      (p) =>
        p.accessCode &&
        p.accessCode.trim().toUpperCase() === trimmedCode.toUpperCase() &&
        p.status === 'Active'
    );

    if (!matchedPatient) {
      setError('Invalid or expired access code. Please check the code provided by your hospital.');
      return;
    }

    // Save session
    try {
      sessionStorage.setItem(
        PATIENT_SESSION_KEY,
        JSON.stringify({ patientId: matchedPatient.patientId })
      );
      navigate('/patient');
    } catch (err) {
      console.error('Failed to set patient session:', err);
      setError('Failed to establish session. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '1.5rem auto 2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <Badge variant="emerald">Hospital Access Token</Badge>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
          Patient / Attendant Access
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Enter the access code provided by your hospital.
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <form onSubmit={handleAccessSubmit} noValidate>
          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                borderLeft: '4px solid #dc2626',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: 'var(--font-size-sm)',
                color: '#991b1b',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <FormField
            id="accessCode"
            label="Hospital Access Code"
            placeholder="e.g. ACC-X4R2KQ"
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value);
              if (error) setError('');
            }}
            required
            helpText="Found on your bedside slip or hospital admission card."
          />

          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" variant="primary" fullWidth size="lg">
              Continue &rarr;
            </Button>
          </div>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong>Hospital Credential:</strong> Cordinia uses secure hospital-issued access codes so patients and family members can view rounding updates without passwords.
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link to="/" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          &larr; Return to Overview
        </Link>
      </div>
    </div>
  );
}
