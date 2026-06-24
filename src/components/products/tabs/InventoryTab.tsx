import React, { useState } from 'react';
import type { ProductVariantBB } from '../../../types/product-blackbox.types';
import type { SizeVariantInventory, SalesRecord, ProductionBatch } from '../../../types';

interface Props {
  productId:  string;
  variants:   ProductVariantBB[];
  sizeVariants: SizeVariantInventory[];
  sales:      SalesRecord[];
  production: ProductionBatch[];
  currency:   string;
  accent:     string;
}

type Filter = 'all' | 'in' | 'out';

interface Movement {
  date:      string;
  type:      'in' | 'out';
  qty:       number;
  reference: string;
}

export default function InventoryTab({ productId, variants, sizeVariants, sales, production, currency, accent }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  // Compute movements from production (in) and sales (out)
  const movements: Movement[] = [];

  production
    .filter(p => p.productId === productId && p.productionStatus === 'Completed')
    .forEach(p => movements.push({ date: p.productionDate, type: 'in', qty: p.qty, reference: p.id }));

  sales
    .filter(s => s.productId === productId && s.status !== 'Cancelled')
    .forEach(s => movements.push({ date: s.date, type: 'out', qty: s.qtySold, reference: s.id }));

  movements.sort((a, b) => a.date.localeCompare(b.date));

  // Compute running balance
  let balance = 0;
  const movementsWithBalance = movements.map(m => {
    balance += m.type === 'in' ? m.qty : -m.qty;
    return { ...m, balance };
  }).reverse();

  const filtered = filter === 'all' ? movementsWithBalance : movementsWithBalance.filter(m => m.type === filter);

  const productVariants = sizeVariants.filter(v => v.productId === productId);
  const totalStock = productVariants.reduce((s, v) => s + v.currentStock, 0);
  const bbVariants = variants.filter(v => v.isActive);
  const bbTotal    = bbVariants.reduce((s, v) => s + v.stock, 0);
  const displayStock = bbTotal > 0 ? bbTotal : totalStock;

  return (
    <div className="space-y-4">
      {/* Stock summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4">
          <p className="text-[8px] font-mono uppercase text-[var(--color-text-muted)] mb-1">Total Stok</p>
          <p className={`text-2xl font-mono font-bold ${displayStock === 0 ? 'text-red-400' : displayStock <= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
            {displayStock} <span className="text-base font-normal">pcs</span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4">
          <p className="text-[8px] font-mono uppercase text-[var(--color-text-muted)] mb-2">Per Variant</p>
          <div className="space-y-1">
            {(bbVariants.length > 0 ? bbVariants.map(v => ({ name: v.name, stock: v.stock })) :
              productVariants.map(v => ({ name: `${v.color} / ${v.size}`, stock: v.currentStock }))
            ).slice(0, 5).map(v => (
              <div key={v.name} className="flex justify-between text-[9px] font-mono">
                <span className="text-[var(--color-text-muted)] truncate">{v.name}</span>
                <span className={`font-bold ml-2 ${v.stock === 0 ? 'text-red-400' : 'text-[var(--color-text-main)]'}`}>{v.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[9px] font-mono text-[var(--color-text-muted)]">
        Input stok dilakukan melalui modul Inventory atau Production. View ini hanya baca.
      </p>

      {/* Movement history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Riwayat Pergerakan</p>
          <div className="flex gap-1">
            {(['all', 'in', 'out'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase cursor-pointer transition-all ${filter === f ? 'text-black' : 'text-[var(--color-text-muted)] bg-white/5'}`}
                style={filter === f ? { background: accent } : {}}>
                {f === 'all' ? 'Semua' : f === 'in' ? 'Masuk' : 'Keluar'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-muted)]">Tidak ada pergerakan stok.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-line)]">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[var(--color-border-line)] bg-white/[0.02]">
                  {['Tanggal', 'Tipe', 'Qty', 'Referensi', 'Saldo'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9px] uppercase text-[var(--color-text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={i} className="border-b border-[var(--color-border-line)]/50 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">{m.date.slice(0, 10)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase ${m.type === 'in' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {m.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-bold ${m.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                      {m.type === 'in' ? '+' : '-'}{m.qty}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">{m.reference}</td>
                    <td className="px-3 py-2 font-bold text-[var(--color-text-main)]">{m.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
