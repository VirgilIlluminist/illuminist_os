import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/15',
  danger:  'bg-red-500/10 text-red-400 border-red-500/15',
  info:    'bg-sky-500/10 text-sky-400 border-sky-500/15',
  neutral: 'bg-white/[0.04] text-[var(--color-text-muted)] border-[var(--color-border-line)]',
  accent:  'bg-[var(--color-accent-highlight)]/10 text-[var(--color-accent-highlight)] border-[var(--color-accent-highlight)]/15',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm';
  dot?: boolean;
  className?: string;
}

export default function Badge({ label, variant = 'neutral', size = 'xs', dot = false, className = '' }: BadgeProps) {
  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10.5px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 font-mono uppercase font-semibold rounded border ${sizeClass} ${variantMap[variant]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot && 'animate-pulse'} bg-current`} />}
      {label}
    </span>
  );
}

// ─── Status badge khusus untuk tabel ──────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const variant: BadgeVariant =
    s === 'active' || s === 'aktif' || s === 'received' || s === 'paid' || s === 'in stock' || s === 'stok ada' ? 'success' :
    s === 'low stock' || s === 'stok rendah' || s === 'pending' || s === 'draft' ? 'warning' :
    s === 'cancelled' || s === 'inactive' || s === 'deficit' || s === 'overdue' ? 'danger' :
    s === 'sent' || s === 'shipped' || s === 'processing' ? 'info' :
    'neutral';
  return <Badge label={status} variant={variant} dot />;
}
