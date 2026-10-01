import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Badge from '../components/common/Badge';

export default function AppLayout() {
  const location = useLocation();

  // Helper to identify the current active role from the path
  const getRoleContext = (path) => {
    if (path.startsWith('/hospital/patients')) {
      return { title: 'Patient Management', role: 'Hospital Admin', variant: 'navy', color: '#1e293b' };
    }
    if (path.startsWith('/hospital/staff')) {
      return { title: 'Clinical Staff', role: 'Hospital Admin', variant: 'navy', color: '#1e293b' };
    }
    if (path.startsWith('/hospital/structure')) {
      return { title: 'Hospital Structure', role: 'Hospital Admin', variant: 'navy', color: '#1e293b' };
    }
    if (path.startsWith('/hospital/workspace')) {
      return { title: 'Hospital Workspace', role: 'Hospital Admin', variant: 'navy', color: '#1e293b' };
    }
    if (path.startsWith('/admin')) {
      return { title: 'Hospital Administration', role: 'Hospital Admin', variant: 'navy', color: '#1e293b' };
    }
    if (path.startsWith('/doctor')) {
      return { title: 'Physician Rounds Console', role: 'Doctor', variant: 'blue', color: '#0284c7' };
    }
    if (path.startsWith('/nurse')) {
      return { title: 'Ward Rounds Station', role: 'Nurse', variant: 'teal', color: '#0d9488' };
    }
    if (path.startsWith('/patient')) {
      return { title: 'Patient & Attendant Portal', role: 'Patient / Attendant', variant: 'emerald', color: '#059669' };
    }
    return { title: 'Cordinia Console', role: 'User', variant: 'blue', color: '#0284c7' };
  };

  const context = getRoleContext(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      {/* Role Navigation & Breadcrumb Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-default)',
          paddingTop: '0.875rem',
          paddingBottom: '0.875rem',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              &larr; Overview
            </Link>
            <span style={{ color: 'var(--color-border-strong)' }}>/</span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-brand-navy)' }}>
              {context.title}
            </span>
            <Badge variant={context.variant}>{context.role}</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            <span>Switch Role:</span>
            <Link to="/admin" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: location.pathname.startsWith('/admin') ? 'var(--color-bg-muted)' : 'transparent' }}>
              Admin
            </Link>
            <Link to="/doctor" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: location.pathname.startsWith('/doctor') ? 'var(--color-bg-muted)' : 'transparent' }}>
              Doctor
            </Link>
            <Link to="/nurse" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: location.pathname.startsWith('/nurse') ? 'var(--color-bg-muted)' : 'transparent' }}>
              Nurse
            </Link>
            <Link to="/patient" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: location.pathname.startsWith('/patient') ? 'var(--color-bg-muted)' : 'transparent' }}>
              Patient
            </Link>
          </div>
        </div>
      </div>

      <main style={{ flex: '1 0 auto', padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
