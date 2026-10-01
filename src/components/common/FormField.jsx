import React from 'react';

/**
 * Reusable Accessible Form Field Component
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} [props.type='text']
 * @param {string} [props.value]
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {boolean} [props.required=false]
 * @param {string} [props.error]
 * @param {string} [props.helpText]
 * @param {string} [props.min]
 * @param {string} [props.step]
 * @param {string} [props.className]
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  helpText,
  min,
  step,
  className = '',
  ...rest
}) {
  const hasError = Boolean(error);

  return (
    <div className={`form-group ${className}`.trim()}>
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
        className={`form-input ${hasError ? 'form-input-error' : ''}`.trim()}
        {...rest}
      />

      {hasError ? (
        <span id={`${id}-error`} className="form-error-text" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      ) : helpText ? (
        <span id={`${id}-help`} className="form-help">
          {helpText}
        </span>
      ) : null}
    </div>
  );
}
