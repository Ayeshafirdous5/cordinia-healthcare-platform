import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';

export default function NurseDashboard() {
  const nurseCapabilities = [
    {
      title: 'Live Ward Round Tracker',
      description: 'See which attending doctors have commenced rounds, their current room location, and the sequenced trajectory across your ward.',
      badge: 'Floor Visibility',
      status: 'Real-Time Feed',
      statusType: 'active',
    },
    {
      title: 'Patient Readiness Preparation',
      description: 'Mark patients as ready for physician evaluation, ensure attendants are bedside, or flag if the patient is currently in diagnostic transit.',
      badge: 'Preparation',
      status: 'Bedside Sync',
      statusType: 'info',
    },
    {
      title: 'Round Progress Updates',
      description: 'Nurses can record quick floor status updates and communicate round adjustments instantly without overhead or phone calls.',
      badge: 'Collaboration',
      status: 'Floor Updates',
      statusType: 'pending',
    },
    {
      title: 'Bedside Inquiries Reduction',
      description: 'With patients and families able to see their own doctor ETA, nursing stations experience fewer repetitive questions regarding doctor arrival.',
      badge: 'Calm Environment',
      status: 'Transparent Care',
      statusType: 'active',
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
          <Badge variant="teal">Role: Nurse / Ward Care Team</Badge>
          <StatusIndicator status="active" label="Ward Monitoring Station" />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.75rem' }}>
          Cordinia Ward Rounds Station
        </h1>
        <p style={{ maxWidth: '800px', fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Nurses are the backbone of hospital ward coordination. In Cordinia, nurses monitor ongoing rounds in real-time,
          anticipate doctor arrival times, update patient readiness, and maintain a calm, synchronized floor environment.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '1rem', color: 'var(--color-brand-navy)' }}>
          Ward Nursing Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {nurseCapabilities.map((item, idx) => (
            <Card key={idx} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <Badge variant="teal">{item.badge}</Badge>
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

      {/* Scope Disclaimer */}
      <div
        style={{
          borderLeft: '4px solid var(--color-teal)',
          backgroundColor: 'var(--color-teal-light)',
          padding: '1rem 1.25rem',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-brand-navy)',
        }}
      >
        <strong>Calm Hospital Operations:</strong> Cordinia gives nursing stations predictive foresight, allowing
        bedside prep and medication administration to run smoothly alongside doctor rounds.
      </div>
    </div>
  );
}
