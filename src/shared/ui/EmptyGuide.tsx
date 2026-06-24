import React from 'react';

interface EmptyGuideProps {
  icon?: string;
  title: string;
  description?: React.ReactNode;
  /** Show the "how to use the table" hint card */
  tableHints?: boolean;
  /** Optional primary action */
  action?: { label: string; onClick: () => void };
}

// Onboarding empty state — informatif, bukan sekadar "Belum ada data".
export default function EmptyGuide({ icon = '◈', title, description, tableHints, action }: EmptyGuideProps) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 32px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: action || tableHints ? '24px' : 0 }}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'var(--accent-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '10px 20px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: tableHints ? '24px' : 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          {action.label}
        </button>
      )}

      {tableHints && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: '16px', textAlign: 'left',
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.9,
        }}>
          <p style={{ fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>Cara pakai tabel:</p>
          <p>• Klik cell → langsung edit</p>
          <p>• Tab / panah → pindah antar cell</p>
          <p>• Drag tepi kolom → resize lebar</p>
          <p>• Copy/paste dari Excel didukung</p>
          <p>• Klik kanan → menu konteks</p>
        </div>
      )}
    </div>
  );
}
