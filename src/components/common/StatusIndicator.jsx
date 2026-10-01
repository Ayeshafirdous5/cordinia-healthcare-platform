import React from 'react';

/**
 * Reusable Status Indicator Component
 * @param {object} props
 * @param {string} props.label
 * @param {'active'|'pending'|'info'|'muted'} [props.status='active']
 * @param {string} [props.className]
 */
export default function StatusIndicator({ label, status = 'active', className = '' }) {
  const dotClass = `status-dot-${status}`;
  return (
    <div className={`status-indicator ${className}`.trim()}>
      <span className={`status-dot ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}
