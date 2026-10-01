import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: '600', color: 'var(--color-brand-navy)' }}>Cordinia</span>
          <span style={{ color: 'var(--color-border-strong)' }}>|</span>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Hospital Doctor Round Coordination Platform
          </span>
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Designed for predictable, calm, and synchronized hospital care rounds.
        </div>
      </div>
    </footer>
  );
}
