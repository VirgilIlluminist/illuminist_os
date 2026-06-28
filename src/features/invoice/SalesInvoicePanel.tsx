import React, { useState } from 'react';
import { useERP }      from '../../app/store/ERPContext';
import { FileText, ChevronDown } from 'lucide-react';
import type { SalesRecord } from '../../types';
import InvoiceModal from './InvoiceModal';

interface Props {
  sales:    SalesRecord[];
  products: { id: string; name: string }[];
}

export default function SalesInvoicePanel({ sales, products }: Props) {
  const { config: erpConfig } = useERP();
  const accent  = erpConfig?.customAccentColor ?? '#7c3aed';
  const [open,         setOpen]         = useState(false);
  const [selectedId,   setSelectedId]   = useState('');
  const [showModal,    setShowModal]     = useState(false);

  const selectedSale    = sales.find(s => s.id === selectedId);
  const completedSales  = sales.filter(s => s.status !== 'Cancelled');

  const getProductName = (productId: string) =>
    products.find(p => p.id === productId)?.name ?? productId;

  return (
    <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: accent }}/>
          <span className="text-sm font-semibold text-[var(--color-text-main)]">
            Generate Invoice PDF
          </span>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center gap-1 cursor-pointer"
        >
          {open ? 'Sembunyikan' : 'Tampilkan'}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">
              Pilih Pesanan
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none cursor-pointer"
            >
              <option value="">— Pilih order untuk dibuat invoice —</option>
              {completedSales.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.customerName} — {getProductName(s.productId)} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.06] border border-[var(--color-border-line)]">
              <div className="text-sm text-[var(--color-text-muted)] space-y-0.5">
                <p><span className="text-[var(--color-text-main)]">{selectedSale.customerName}</span> · {selectedSale.channel}</p>
                <p>Qty {selectedSale.qtySold} × Rp{selectedSale.pricePerPcs.toLocaleString('id')} · {selectedSale.date}</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-black cursor-pointer"
                style={{ background: accent }}
              >
                <FileText size={14}/> Buat Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && selectedSale && (
        <InvoiceModal
          sale={selectedSale}
          productName={getProductName(selectedSale.productId)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
