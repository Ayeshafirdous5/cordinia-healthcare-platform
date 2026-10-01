import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';

export default function LandingPage() {
  const roles = [
    {
      title: 'Hospital / Admin',
      role: 'Hospital Admin',
      badgeVariant: 'navy',
      path: '/hospital/register',
      description: 'Register and set up your hospital workspace on Cordinia to configure staff, wards, and patient round queues.',
      actionText: 'Create Hospital Workspace',
      features: ['Hospital workspace creation', 'Ward & floor topologies', 'Physician and nurse assignments'],
    },
    {
      title: 'Doctor / Physician',
      role: 'Attending Doctor',
      badgeVariant: 'blue',
      path: '/doctor',
      description: 'Start daily hospital rounds with one simple tap. Automatically view sequenced patient queues by location and urgency.',
      actionText: 'Enter Doctor Rounds',
      features: ['One-click round activation', 'Location-optimized patient queue', 'Instant round status updates'],
    },
    {
      title: 'Ward Nurse',
      role: 'Floor Nurse',
      badgeVariant: 'teal',
      path: '/nurse',
      description: 'Track real-time round progress, prepare patients before the doctor arrives, and synchronize bedside nursing workflows.',
      actionText: 'Enter Nursing Station',
      features: ['Live round progression feed', 'Patient readiness checklist', 'Ward-level visibility'],
    },
    {
      title: 'Patient & Attendant',
      role: 'Patient Portal',
      badgeVariant: 'emerald',
      path: '/patient',
      description: 'Access transparent, calm updates on your doctor’s round status and approximate arrival time with secure bed credentials.',
      actionText: 'View Round Progress',
      features: ['Approximate ETA indicators', 'Doctor round status tracking', 'Secure hospital access code'],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid var(--color-border-default)',
          padding: '4rem 0 3.5rem 0',
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Badge variant="blue" className="gap-2">
              <StatusIndicator status="active" label="Connected Healthcare Platform" />
            </Badge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Predictable, Coordinated <br />
            <span style={{ color: 'var(--color-brand-primary)' }}>Hospital Doctor Rounds</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              maxWidth: '720px',
              margin: '0 auto 2.5rem auto',
            }}
          >
            Cordinia is a connected healthcare platform designed to eliminate uncertainty during
            inpatient doctor rounds—aligning doctors, nurses, hospital administrators, and patients.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button to="/patient/access" variant="primary" size="lg">
              Patient Access Portal
            </Button>
            <Button to="/doctor" variant="secondary" size="lg">
              Launch Doctor Rounds
            </Button>
          </div>
        </div>
      </section>

      {/* Role Selection Entry Cards */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-brand-primary)' }}>
            Role-Based Access
          </span>
          <h2 style={{ marginTop: '0.25rem', fontSize: 'var(--font-size-2xl)' }}>
            Select Your Role to Access Cordinia
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Experience the tailored workspace designed for each stakeholder in the care journey.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {roles.map((item) => (
            <Card key={item.path} hover className="flex-col justify-between" style={{ height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <Badge variant={item.badgeVariant}>{item.role}</Badge>
                </div>

                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--color-brand-navy)' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {item.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      <span style={{ color: 'var(--color-brand-primary)', fontWeight: 'bold' }}>&bull;</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button to={item.path} variant="outline" fullWidth>
                {item.actionText} &rarr;
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Core Principle / Architecture Callout */}
      <section className="container">
        <div
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border-default)',
            padding: '2.5rem',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '1rem' }}>
              Designed For Hospital Floor Reality
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Hospital rounds are inherently dynamic—emergencies arise, cases require extra time,
              and patient locations shift. Cordinia creates a synchronized information layer so
              nurses know when to prep patients and families know when to expect their physician.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
