import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Card Component
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.hover=false]
 * @param {string} [props.to] Optional link destination
 * @param {string} [props.className]
 */
export default function Card({
  children,
  hover = false,
  to,
  className = '',
  ...props
}) {
  const hoverClass = hover ? 'card-hover' : '';
  const interactiveClass = to ? 'card-interactive' : '';
  const combinedClass = `card ${hoverClass} ${interactiveClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClass} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}
