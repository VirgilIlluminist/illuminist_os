import React from 'react';

interface PageHeaderProps {
  pageLabel: string;       // kecil di atas, aksen color
  title: string;           // judul besar
  description?: string;    // sub-teks kecil
  accentColor?: string;
  actions?: React.ReactNode; // tombol-tombol di kanan
}

export default function PageHeader({
  pageLabel, title, description, accentColor = 'var(--color-accent-highlight)', actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
      <div>
        <span className="text-xs font-mono tracking-widest uppercase"
              style={{ color: accentColor }}>
          {pageLabel}
        </span>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── Action button standar ─────────────────────────────────────────────────
export function HeaderBtn({
  onClick, label, icon, accentColor = 'var(--color-accent-highlight)', variant = 'primary',
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  accentColor?: string;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-wider font-semibold rounded transition-all cursor-pointer"
      style={variant === 'primary'
        ? { background: accentColor, color: 'var(--color-background)' }
        : { border: '1px solid var(--color-border-line)', color: 'var(--color-text-muted)' }
      }>
      {icon}{label}
    </button>
  );
}
