import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';

export default function AdminDashboard() {
  const adminModules = [
    {
      title: 'Hospital Ward & Bed Topology',
      description: 'Configure hospital buildings, floors, wards, and individual bed locations to support automated location-aware round ordering.',
      status: 'Ready for Setup',
      statusType: 'pending',
      badge: 'Configuration',
    },
    {
      title: 'Medical Staff & Role Directory',
      description: 'Register attending doctors, resident teams, and floor nurses with department privileges and ward coverage assignments.',
      status: 'Ready for Setup',
      statusType: 'pending',
      badge: 'Staffing',
    },
    {
      title: 'Patient-Physician Bed Mapping',
      description: 'Assign admitted patients to attending physicians and synchronize their bed coordinates for daily round queues.',
      status: 'Ready for Setup',
      statusType: 'pending',
      badge: 'Assignments',
    },
    {
      title: 'Rounds Policy & Schedule Templates',
      description: 'Establish standard morning and evening round windows, specialty priority rules, and notification policies.',
      status: 'Ready for Setup',
      statusType: 'pending',
      badge: 'Operations',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Role Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Badge variant="navy">Role: Hospital Admin</Badge>
          <StatusIndicator status="active" label="System Foundation Active" />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.75rem' }}>
          Cordinia Hospital Admin Console
        </h1>
        <p style={{ maxWidth: '800px', fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          As a Hospital Administrator, you will configure the hospital facility, manage doctor and nurse rosters,
          and oversee patient bed assignments. In later stages, this console will provide hospital-wide round metrics,
          bottleneck analytics, and ward utilization insights.
        </p>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem', color: 'var(--color-brand-navy)' }}>
          Core Administrative Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {adminModules.map((item, idx) => (
            <Card key={idx} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <Badge variant="navy">{item.badge}</Badge>
                <StatusIndicator status={item.statusType} label={item.status} />
              </div>
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Development Notice */}
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
        <strong>Foundation Phase:</strong> Authentication, hospital database connections, and patient data synchronization
        will be connected in subsequent releases.
      </div>
    </div>
  );
}
