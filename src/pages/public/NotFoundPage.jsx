import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function NotFoundPage() {
  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto', textAlign: 'center' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Badge variant="amber">404 Error</Badge>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.75rem', color: 'var(--color-brand-navy)' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          The requested page could not be located in Cordinia. Please verify the URL or return to the main coordination console.
        </p>
        <Button to="/" variant="primary" fullWidth>
          Return to Cordinia Home
        </Button>
      </Card>
    </div>
  );
}
