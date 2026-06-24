import React, { useState } from 'react';
import type { MasterProduct } from '../../types';
import type { ProductBatch, ProductStatus } from '../../types/product-blackbox.types';
import ProductStatusBadge from './ProductStatusBadge';
import MarginCalculator   from './MarginCalculator';
import { ArrowLeft, ChevronDown, Calculator } from 'lucide-react';

interface Props {
  product:      MasterProduct;
  currentBatch: ProductBatch | null;
  totalStock:   number;
  currency:     string;
  accent:       string;
  onBack:       () => void;
  onStatusChange: (newStatus: ProductStatus) => Promise<void>;
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'draft',        label: 'Draft'        },
  { value: 'active',       label: 'Active'       },
  { value: 'discontinued', label: 'Discontinued' },
  { value: 'archived',     label: 'Archived'     },
];

export default function ProductHeader({ product, currentBatch, totalStock, currency, accent, onBack, onStatusChange }: Props) {
  const [showCalc,   setShowCalc]   = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const hpp    = currentBatch?.hpp ?? 0;
  const price  = product.sellingPrice;
  const margin = hpp > 0 ? ((price - hpp) / price * 100) : 0;

  const currentStatus = ((product.status ?? 'active') as string).toLowerCase() as ProductStatus;

  return (
    <div className="space-y-3">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer">
          <ArrowLeft size={12}/> Semua Produk
        </button>
        <div className="relative">
          <button onClick={() => setShowStatus(v => !v)}
            className="flex items-center gap-1 cursor-pointer">
            <ProductStatusBadge status={currentStatus} size="md"/>
            <ChevronDown size={10} className="text-[var(--color-text-muted)]"/>
          </button>
          {showStatus && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-[var(--color-border-line)] bg-[var(--color-bg-card)] shadow-xl overflow-hidden">
              {STATUS_OPTIONS.map(o => (
                <button key={o.value}
                  onClick={() => { onStatusChange(o.value); setShowStatus(false); }}
                  className={`w-full px-4 py-2 text-[10px] font-mono text-left hover:bg-white/5 cursor-pointer ${currentStatus === o.value ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="flex items-start gap-4">
        {/* Cover placeholder / image */}
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-[var(--color-border-line)] flex-shrink-0 overflow-hidden">
          {product.image
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-2xl text-[var(--color-text-muted)]">
                {product.name.charAt(0).toUpperCase()}
              </div>
          }
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold uppercase tracking-tight text-[var(--color-text-main)] truncate">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{product.id}</span>
            {product.category && <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">{product.category}</span>}
            {product.collection && <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">{product.collection}</span>}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {[
          { label: 'Stok',   value: `${totalStock} pcs`, color: totalStock === 0 ? 'text-red-400' : totalStock <= 10 ? 'text-yellow-400' : 'text-green-400' },
          { label: 'HPP',    value: hpp > 0 ? `${currency}${hpp.toLocaleString('id')}` : '—', color: 'text-[var(--color-text-muted)]' },
          { label: 'Harga',  value: `${currency}${price.toLocaleString('id')}`, color: 'text-[var(--color-text-main)]' },
          { label: 'Margin', value: hpp > 0 ? `${margin.toFixed(1)}%` : '—', color: margin < 20 ? 'text-red-400' : margin < 35 ? 'text-yellow-400' : 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-[var(--color-border-line)] bg-white/[0.02] px-3 py-2">
            <p className="text-[7px] font-mono uppercase text-[var(--color-text-muted)]">{label}</p>
            <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Margin calculator toggle */}
      <button onClick={() => setShowCalc(v => !v)}
        className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
        <Calculator size={10}/>
        {showCalc ? 'Sembunyikan Kalkulator' : 'Tampilkan Margin Calculator'}
      </button>

      {showCalc && (
        <MarginCalculator
          initialHpp={hpp || price * 0.5}
          initialPrice={price}
          currency={currency}
          accent={accent}
        />
      )}
    </div>
  );
}
