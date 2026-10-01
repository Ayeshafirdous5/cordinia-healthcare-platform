import React from 'react';

/**
 * Reusable Badge Component
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'blue'|'navy'|'teal'|'emerald'|'amber'|'rose'} [props.variant='blue']
 * @param {string} [props.className]
 */
export default function Badge({ children, variant = 'blue', className = '' }) {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
