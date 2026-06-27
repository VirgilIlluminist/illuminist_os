import React from 'react';
import type { ProductStatus } from '../../types/product-blackbox.types';

const CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  draft:        { label: 'Draft',        className: 'bg-white/10 text-[var(--color-text-muted)]'     },
  active:       { label: 'Active',       className: 'bg-green-500/15 text-green-400'                  },
  discontinued: { label: 'Discontinued', className: 'bg-yellow-500/15 text-yellow-400'                },
  archived:     { label: 'Archived',     className: 'bg-white/5 text-[var(--color-text-muted)]/50'   },
};

interface Props {
  status: ProductStatus | string;
  size?: 'sm' | 'md';
}

export default function ProductStatusBadge({ status, size = 'sm' }: Props) {
  const key = (status ?? 'active').toLowerCase() as ProductStatus;
  const cfg = CONFIG[key] ?? CONFIG['active'];
  const px  = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-mono uppercase tracking-widest font-semibold ${px} ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
