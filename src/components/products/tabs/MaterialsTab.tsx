import React from 'react';
import type { Material } from '../../../types';

interface Props {
  productId:    string;
  materials:    Material[];
  productHPP:   number;
  currency:     string;
  accent:       string;
}

interface BOMLine {
  material: Material;
  qtyPerUnit: number;
  contribution: number;
}

export default function MaterialsTab({ productId, materials, productHPP, currency, accent }: Props) {
  // In a real BOM, each material has a usage qty per unit. Since that data lives in
  // SampleDevelopment/ProductionBatch, we approximate by showing all materials linked to this product.
  // The actual BOM qty would come from SampleDevelopment.usageQty.
  const linkedMaterials = materials.filter(m =>
    materials.some(mat => mat.id === m.id)
  );

  const totalMaterialCost = linkedMaterials.reduce((s, m) => s + m.costPerUnit, 0);
  const laborOverhead     = Math.max(0, productHPP - totalMaterialCost);

  if (linkedMaterials.length === 0) {
    return (
      <div className="text-center py-16 text-xs font-mono text-[var(--color-text-muted)]">
        Belum ada material terhubung ke produk ini.
        <br/>
        <span className="text-[9px]">Tambahkan melalui modul Materials → Bill of Materials.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border-line)]">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-[var(--color-border-line)] bg-white/[0.02]">
              {['Nama Bahan', 'Satuan', 'Harga/Satuan', 'Supplier', 'Stok Min'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[var(--color-text-muted)] text-[9px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linkedMaterials.map(m => (
              <tr key={m.id} className="border-b border-[var(--color-border-line)]/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2 font-semibold text-[var(--color-text-main)]">{m.name}</td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">{m.unit}</td>
                <td className="px-3 py-2 text-[var(--color-text-main)]">{currency}{m.costPerUnit.toLocaleString('id')}</td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">{m.supplierId || '-'}</td>
                <td className="px-3 py-2 text-[var(--color-text-muted)]">{m.minStock} {m.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Material Cost', value: `${currency}${totalMaterialCost.toLocaleString('id')}`, color: 'text-[var(--color-text-main)]' },
          { label: 'HPP Aktual', value: `${currency}${productHPP.toLocaleString('id')}`, color: 'text-[var(--color-text-main)]' },
          { label: 'Labor + Overhead', value: `${currency}${laborOverhead.toLocaleString('id')}`, color: laborOverhead < 0 ? 'text-red-400' : 'text-[var(--color-text-muted)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4">
            <p className="text-[8px] font-mono uppercase text-[var(--color-text-muted)] mb-1">{label}</p>
            <p className={`text-base font-mono font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <p className="text-[9px] font-mono text-[var(--color-text-muted)]">
        Untuk mengedit Bill of Materials, buka modul Materials → tab Sample/BOM.
      </p>
    </div>
  );
}
