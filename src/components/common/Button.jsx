import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Button Component (Supports both <button> and React Router <Link>)
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'primary'|'secondary'|'outline'|'subtle'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.to] Optional router destination
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.className]
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  fullWidth = false,
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'btn-full' : '';
  const combinedClass = `btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClass} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClass} {...props}>
      {children}
    </button>
  );
}
