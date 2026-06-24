import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  pageLabel?: string;
  accentColor?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: '14px',
            color: 'var(--text-tertiary)',
            marginTop: '5px', marginBottom: 0,
            letterSpacing: '-0.01em',
            lineHeight: 1.5,
          }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── HeaderBtn ────────────────────────────────────────────────────────────────

export function HeaderBtn({
  onClick, label, icon, variant = 'primary',
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  accentColor?: string;
  variant?: 'primary' | 'ghost';
}) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={
        variant === 'primary'
          ? {
              display: 'flex', alignItems: 'center', gap: '7px',
              background: hov ? 'var(--accent-primary-hover)' : 'var(--accent-primary)',
              color: 'white', border: 'none',
              borderRadius: '10px', padding: '9px 18px',
              fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em',
              cursor: 'pointer', transition: 'background 0.15s ease',
              boxShadow: '0 2px 12px rgba(124,58,237,0.30)',
            }
          : {
              display: 'flex', alignItems: 'center', gap: '7px',
              background: hov ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px', padding: '9px 18px',
              fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em',
              cursor: 'pointer', transition: 'background 0.15s ease',
            }
      }
    >
      {icon}{label}
    </button>
  );
}
