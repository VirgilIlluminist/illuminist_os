import React from 'react';
import PageHeader from '../../shared/ui/PageHeader';

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoonView({ title, description }: Props) {
  return (
    <div style={{ padding: '32px 40px', flex: 1 }}>
      <PageHeader
        title={title}
        description={description ?? 'Fitur ini sedang dalam pengembangan'}
      />
      <div style={{
        marginTop: '64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--color-text-muted)',
      }}>
        <div style={{ fontSize: '40px' }}>🚧</div>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>Coming soon</div>
        <div style={{ fontSize: '12px', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6 }}>
          Halaman <strong style={{ color: 'var(--color-text-main)' }}>{title}</strong> sedang kami bangun.
          Akan segera hadir!
        </div>
      </div>
    </div>
  );
}
