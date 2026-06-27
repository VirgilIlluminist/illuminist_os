import React, { useState, useEffect, useMemo } from 'react';
import { useERP }      from '../../app/store/ERPContext';
import { useBusiness } from '../../app/store/BusinessContext';
import { useTaxConfig } from '../tax/useTaxConfig';
import { InvoiceService } from './InvoiceService';
import type { SalesRecord } from '../../types';
import { FileText, Download, Eye, X, Printer } from 'lucide-react';

interface Props {
  sale:        SalesRecord;
  productName: string;
  onClose:     () => void;
}

export default function InvoiceModal({ sale, productName, onClose }: Props) {
  const { config: erpConfig }     = useERP();
  const { activeBusiness }        = useBusiness();
  const { config: taxConfig }     = useTaxConfig(activeBusiness?.id);
  const accent   = erpConfig?.customAccentColor ?? '#7c3aed';

  const [isPaid,       setIsPaid]       = useState(sale.status === 'Completed');
  const [notes,        setNotes]        = useState('');
  const [bankName,     setBankName]     = useState('');
  const [bankAccount,  setBankAccount]  = useState('');
  const [bankHolder,   setBankHolder]   = useState('');
  const [invoiceNum]                    = useState(InvoiceService.generateInvoiceNumber());
  const [dueDate,      setDueDate]      = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const invoiceData = useMemo(() => ({
    invoiceNumber: invoiceNum,
    date:          sale.date ?? new Date().toISOString().slice(0, 10),
    dueDate,
    sale,
    productName,
    config:        erpConfig ?? { lowStockThreshold: 5, autoReorderEnabled: false, defaultTaxRate: 0 },
    ppnRate:       taxConfig?.pkp_status ? (taxConfig.ppn_rate ?? 11) : undefined,
    ppnMethod:     taxConfig?.tax_method ?? 'exclusive' as const,
    isPaid,
    notes:         notes || undefined,
    bankName:      bankName || undefined,
    bankAccount:   bankAccount || undefined,
    bankHolder:    bankHolder || undefined,
  }), [invoiceNum, sale, productName, erpConfig, taxConfig, isPaid, dueDate, notes, bankName, bankAccount, bankHolder]);

  const gross    = sale.qtySold * sale.pricePerPcs - (sale.discount ?? 0);
  const currency = erpConfig?.currencySymbol ?? 'Rp';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--color-border-line)] bg-[var(--color-bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-line)]">
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: accent }}/>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-main)]">Generate Invoice</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{invoiceNum}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--color-text-muted)] cursor-pointer">
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Order summary */}
          <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">Ringkasan Pesanan</p>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-text-muted)]">Produk</span>
              <span className="text-[var(--color-text-main)]">{productName}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-text-muted)]">Pelanggan</span>
              <span className="text-[var(--color-text-main)]">{sale.customerName}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-text-muted)]">Qty × Harga</span>
              <span className="text-[var(--color-text-main)]">{sale.qtySold} × {currency}{sale.pricePerPcs.toLocaleString('id')}</span>
            </div>
            {(sale.discount ?? 0) > 0 && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-text-muted)]">Diskon</span>
                <span className="text-red-400">-{currency}{(sale.discount ?? 0).toLocaleString('id')}</span>
              </div>
            )}
            {taxConfig?.pkp_status && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-text-muted)]">PPN {taxConfig.ppn_rate ?? 11}%</span>
                <span className="text-yellow-400">+{currency}{Math.round(gross * (taxConfig.ppn_rate ?? 11) / 100).toLocaleString('id')}</span>
              </div>
            )}
            <div className="border-t border-[var(--color-border-line)] pt-2 flex justify-between text-sm font-mono font-bold">
              <span className="text-[var(--color-text-muted)]">Total</span>
              <span style={{ color: accent }}>
                {currency}{(gross + (taxConfig?.pkp_status ? Math.round(gross * (taxConfig.ppn_rate ?? 11) / 100) : 0)).toLocaleString('id')}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Jatuh Tempo</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none"/>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center justify-between w-full p-3 rounded-xl border border-[var(--color-border-line)] bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">Status Pembayaran</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{isPaid ? 'Lunas' : 'Belum Lunas'}</p>
                </div>
                <button type="button" onClick={() => setIsPaid(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isPaid ? 'bg-green-500' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPaid ? 'left-5' : 'left-0.5'}`}/>
                </button>
              </div>
            </div>
          </div>

          {/* Bank info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">Info Pembayaran (opsional)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Nama Bank', value: bankName, set: setBankName, placeholder: 'BCA' },
                { label: 'No Rekening', value: bankAccount, set: setBankAccount, placeholder: '1234567890' },
                { label: 'Atas Nama', value: bankHolder, set: setBankHolder, placeholder: 'PT Usaha' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{label}</label>
                  <input type="text" value={value} placeholder={placeholder} onChange={e => set(e.target.value)}
                    className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-xl px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none"/>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Terima kasih atas kepercayaan Anda..."
              rows={2}
              className="w-full bg-white/5 border border-[var(--color-border-line)] rounded-xl px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none resize-none"/>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 p-4 border-t border-[var(--color-border-line)]">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
            Batal
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => InvoiceService.previewInvoice(invoiceData)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
            >
              <Eye size={14}/> Preview
            </button>
            <button
              onClick={() => InvoiceService.downloadInvoice(invoiceData)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-black cursor-pointer"
              style={{ background: accent }}
            >
              <Download size={14}/> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
