import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import Button from '../../components/common/Button';
import { getHospitalWorkspace, getDefaultWorkspace } from '../../services/hospitalService';
import { getStructureSummary } from '../../services/hospitalStructureService';
import { getStaffSummary } from '../../services/clinicalStaffService';
import { getPatientSummary } from '../../services/patientService';

export default function HospitalWorkspace() {
  const [workspace, setWorkspace] = useState(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [structureSummary, setStructureSummary] = useState({
    floorCount: 0,
    wardCount: 0,
    roomCount: 0,
    bedCount: 0,
  });
  const [staffSummary, setStaffSummary] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalNurses: 0,
    activeNurses: 0,
  });
  const [patientSummary, setPatientSummary] = useState({
    total: 0,
    active: 0,
    discharged: 0,
    occupiedBeds: 0,
    availableBeds: 0,
  });

  useEffect(() => {
    const loaded = getHospitalWorkspace();
    if (loaded) {
      setWorkspace(loaded);
      setIsDemoData(false);
    } else {
      setWorkspace(getDefaultWorkspace());
      setIsDemoData(true);
    }

    setStructureSummary(getStructureSummary());
    setStaffSummary(getStaffSummary());
    setPatientSummary(getPatientSummary());
  }, []);

  if (!workspace) return null;

  const nextAreas = [
    {
      title: '1. Hospital Structure',
      description: 'Configure floors, wards, rooms and beds.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      badge: 'Step 1',
      path: '/hospital/structure',
      isActive: true,
      statusText:
        structureSummary.floorCount > 0
          ? `${structureSummary.floorCount} Floors, ${structureSummary.wardCount} Wards configured`
          : 'Configuration available',
      actionText: 'Configure Structure →',
    },
    {
      title: '2. Clinical Staff',
      description: 'Add doctors and nurses to your hospital.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      badge: 'Step 2',
      path: '/hospital/staff',
      isActive: true,
      statusText:
        staffSummary.totalDoctors > 0 || staffSummary.totalNurses > 0
          ? `${staffSummary.totalDoctors} Doctors, ${staffSummary.totalNurses} Nurses configured`
          : 'Configuration available',
      actionText: 'Manage Staff →',
    },
    {
      title: '3. Patient Assignment',
      description: 'Register patients and assign them to doctors and locations.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      ),
      badge: 'Step 3',
      path: '/hospital/patients',
      isActive: true,
      statusText:
        patientSummary.total > 0
          ? `${patientSummary.active} Active Patients, ${patientSummary.occupiedBeds} Beds Occupied`
          : 'Configuration available',
      actionText: 'Manage Patients →',
    },
    {
      title: '4. Doctor Rounds',
      description: 'Manage active and upcoming doctor rounds.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: 'Step 4',
      isActive: false,
      statusText: 'Pending Configuration',
      actionText: 'Coming next',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant="navy">Hospital Workspace</Badge>
            <StatusIndicator status="active" label="Initial Setup Stage" />
          </div>
          <Link to="/hospital/register" className="btn btn-outline btn-sm">
            &larr; Re-register Facility
          </Link>
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
          {workspace.hospitalName}
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '720px', lineHeight: 1.5 }}>
          Your hospital workspace has been initialized on Cordinia. Complete the progressive setup steps
          below to configure physical wards, medical personnel, and begin predictable doctor rounding.
        </p>

        {isDemoData && (
          <div style={{ marginTop: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-amber)', backgroundColor: 'var(--color-amber-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Note: Displaying sample workspace data. You can <Link to="/hospital/register" style={{ fontWeight: 'bold' }}>fill out the registration form</Link> to register your actual hospital.</span>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-brand-navy)' }}>
              Registered Facility Overview
            </h2>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Registration details confirmed during workspace onboarding
            </span>
          </div>
          <Badge variant="teal">Verified Local Record</Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Hospital Name
            </span>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {workspace.hospitalName}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Registration ID
            </span>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {workspace.registrationId}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Location / City
            </span>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-brand-navy)', marginTop: '0.25rem' }}>
              {workspace.location}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Contact Email
            </span>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              {workspace.contactEmail}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Contact Phone
            </span>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              {workspace.contactPhone}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              Floors & Wards
            </span>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-primary)', marginTop: '0.25rem' }}>
              {workspace.floorCount} Floors &bull; {workspace.wardCount} Wards
            </div>
          </div>
        </div>
      </Card>

      {/* Next Configuration Areas */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-brand-navy)' }}>
            Sequential Configuration Roadmap
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Complete your hospital setup sequentially. Step 1 (Hospital Structure) is now active.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {nextAreas.map((item, idx) => (
            <Card
              key={idx}
              hover
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: item.isActive ? 'var(--color-brand-primary)' : undefined,
                boxShadow: item.isActive ? 'var(--shadow-md)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ color: item.isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)', display: 'flex' }}>
                    {item.icon}
                  </div>
                  <Badge variant={item.isActive ? 'blue' : 'navy'}>{item.badge}</Badge>
                </div>

                <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: item.isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)', fontWeight: item.isActive ? '600' : '500' }}>
                  {item.statusText}
                </span>

                {item.isActive ? (
                  <Button to={item.path} variant="primary" size="sm">
                    {item.actionText}
                  </Button>
                ) : (
                  <span className="badge badge-navy" style={{ fontSize: '0.7rem' }}>
                    {item.actionText}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
