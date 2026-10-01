import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Badge from '../common/Badge';

export default function Header() {
  const location = useLocation();

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Admin', path: '/admin' },
    { label: 'Doctor', path: '/doctor' },
    { label: 'Nurse', path: '/nurse' },
    { label: 'Patient', path: '/patient' },
  ];

  return (
    <header className="app-header">
      <div className="container header-container">
        <Link to="/" className="brand-link">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Cordinia</div>
            <div className="brand-subtext">Connected Healthcare</div>
          </div>
        </Link>

        <nav className="nav-links">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link to="/patient/access" className="btn btn-outline btn-sm" style={{ marginLeft: '0.5rem' }}>
            Patient Access
          </Link>
        </nav>
      </div>
    </header>
  );
}
