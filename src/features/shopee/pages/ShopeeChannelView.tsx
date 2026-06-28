import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { useBusiness } from '../../../app/store/BusinessContext';
import { toast } from '../../../shared/ui/Toast';
import { ShopeeService } from '../ShopeeService';
import { ShopeeFeeEngine } from '../FeeEngine';
import type { ShopeeChannelConfig, ShopeeImportBatch, ShopeeSettlement, ShopeeImportResult } from '../types';
import NumberInput from '../../../shared/ui/NumberInput';
import {
  ShoppingBag, Plus, Upload, Check, AlertTriangle, ChevronRight,
  Trash2, Edit3, FileText, TrendingDown, DollarSign, Package,
  RefreshCw, X,
} from 'lucide-react';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'config' | 'import' | 'history';

// ─── Channel Config Form ──────────────────────────────────────────────────────

const EMPTY_CONFIG: Omit<ShopeeChannelConfig, keyof import('../../../core/repositories').BaseRecord> = {
  name: '', commission_rate: 3, admin_fee_rate: 0.5,
  transaction_fee_rate: 1, ppn_rate: 11, is_active: true,
};

function ChannelForm({
  initial, onSave, onCancel, accent,
}: {
  initial?: Partial<ShopeeChannelConfig>;
  onSave:   (data: Partial<ShopeeChannelConfig>) => Promise<void>;
  onCancel: () => void;
  accent:   string;
}) {
  const [form, setForm] = useState({ ...EMPTY_CONFIG, ...initial });
  const [saving, setSaving] = useState(false);
  const preview = ShopeeFeeEngine.calculate(100_000, form);

  const set = (k: keyof typeof form, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nama channel wajib diisi'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Nama Channel</span>
          <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Shopee Official Store"
            className="mt-1 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Komisi (%)</span>
          <NumberInput value={form.commission_rate} onChange={v => set('commission_rate', v)} min={0} max={30}
            className="mt-1 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Admin Fee (%)</span>
          <NumberInput value={form.admin_fee_rate} onChange={v => set('admin_fee_rate', v)} min={0} max={10}
            className="mt-1 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Transaksi Fee (%)</span>
          <NumberInput value={form.transaction_fee_rate} onChange={v => set('transaction_fee_rate', v)} min={0} max={10}
            className="mt-1 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">PPN (%)</span>
          <NumberInput value={form.ppn_rate} onChange={v => set('ppn_rate', v)} min={0} max={12}
            className="mt-1 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
        </label>
      </div>

      {/* Live preview */}
      <div className="glass-inset rounded-lg p-4">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          Preview: Gross Rp 100.000
        </p>
        <div className="space-y-1.5">
          {[
            ['Komisi',       preview.commission],
            ['Admin Fee',    preview.admin_fee],
            ['Transaksi',    preview.transaction_fee],
            ['PPN',          preview.ppn],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">{label as string}</span>
              <span className="text-red-400 font-mono">- Rp {(val as number).toLocaleString('id')}</span>
            </div>
          ))}
          <div className="border-t border-[var(--color-border-line)] pt-1.5 flex justify-between text-xs font-bold">
            <span className="text-[var(--color-text-muted)]">Net ke Penjual</span>
            <span className="font-mono" style={{ color: accent }}>Rp {preview.net.toLocaleString('id')}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] text-right">
            Effective rate: {ShopeeFeeEngine.effectiveRate(form).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--color-border-line)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all cursor-pointer">
          Batal
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
          style={{ background: accent }}>
          {saving ? 'Menyimpan...' : 'Simpan Channel'}
        </button>
      </div>
    </form>
  );
}

// ─── CSV Drop Zone ────────────────────────────────────────────────────────────

function CSVDropZone({ onFile }: { onFile: (name: string, text: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onFile(file.name, String(e.target?.result ?? ''));
    reader.readAsText(file, 'UTF-8');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
    else toast.error('Harus file .csv');
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragging ? 'border-white/40 bg-white/[0.04]' : 'border-[var(--color-border-line)] hover:border-white/20 hover:bg-white/[0.02]'}`}
    >
      <Upload size={28} className="mx-auto mb-3 text-[var(--color-text-muted)]"/>
      <p className="text-sm text-[var(--color-text-main)]">Drop CSV settlement Shopee di sini</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">atau klik untuk memilih file</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-2">Export dari Shopee Seller Center → Pendapatan → Laporan Pendapatan</p>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInput}/>
    </div>
  );
}

// ─── Settlement Table ─────────────────────────────────────────────────────────

function SettlementTable({ settlements, currency }: { settlements: ShopeeSettlement[]; currency: string }) {
  if (settlements.length === 0) return (
    <div className="text-center py-10 text-xs text-[var(--color-text-muted)]">Tidak ada data</div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border-line)]">
            {['Order ID','Tanggal','Produk','Qty','Gross','Fee','Net','Status'].map(h => (
              <th key={h} className="text-left py-2 px-2 text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {settlements.map(s => (
            <tr key={s.id} className="border-b border-[var(--color-border-line)]/50 hover:bg-white/[0.02]">
              <td className="py-1.5 px-2 text-[var(--color-text-muted)]">{s.order_id.slice(0,12)}</td>
              <td className="py-1.5 px-2 text-[var(--color-text-muted)] whitespace-nowrap">{s.order_date}</td>
              <td className="py-1.5 px-2 text-[var(--color-text-main)] max-w-[140px] truncate">{s.product_name || s.sku || '-'}</td>
              <td className="py-1.5 px-2 text-[var(--color-text-muted)] text-right">{s.qty}</td>
              <td className="py-1.5 px-2 text-[var(--color-text-muted)] text-right whitespace-nowrap">{currency}{s.gross_revenue.toLocaleString('id')}</td>
              <td className="py-1.5 px-2 text-red-400 text-right whitespace-nowrap">-{currency}{s.total_fee.toLocaleString('id')}</td>
              <td className="py-1.5 px-2 text-green-400 text-right whitespace-nowrap font-bold">{currency}{s.net_earnings.toLocaleString('id')}</td>
              <td className="py-1.5 px-2">
                <span className={`px-1.5 py-0.5 rounded-xl text-xs font-bold uppercase ${s.status === 'synced' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {s.status === 'synced' ? 'Synced' : 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function ShopeeChannelView() {
  const { addSale, formatMoney, config } = useERP();
  const { activeBusiness } = useBusiness();
  const companyId = activeBusiness?.id ?? '';
  const currency  = config?.currencySymbol ?? 'Rp';
  const accent    = config?.customAccentColor ?? '#7c3aed';

  const [tab,          setTab]          = useState<Tab>('config');
  const [channels,     setChannels]     = useState<ShopeeChannelConfig[]>([]);
  const [batches,      setBatches]      = useState<ShopeeImportBatch[]>([]);
  const [settlements,  setSettlements]  = useState<ShopeeSettlement[]>([]);
  const [activeBatch,  setActiveBatch]  = useState<string | null>(null);
  const [editChannel,  setEditChannel]  = useState<ShopeeChannelConfig | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [selectedChan, setSelectedChan] = useState<string>('');
  const [importing,    setImporting]    = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [importResult, setImportResult] = useState<ShopeeImportResult | null>(null);

  const loadChannels = useCallback(async () => {
    if (!companyId) return;
    setChannels(await ShopeeService.listChannels(companyId));
  }, [companyId]);

  const loadBatches = useCallback(async () => {
    if (!companyId) return;
    setBatches(await ShopeeService.listBatches(companyId));
  }, [companyId]);

  useEffect(() => { loadChannels(); loadBatches(); }, [loadChannels, loadBatches]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChan) setSelectedChan(channels[0].id);
  }, [channels, selectedChan]);

  const handleSaveChannel = async (data: Partial<ShopeeChannelConfig>) => {
    await ShopeeService.saveChannel(companyId, data, editChannel?.id);
    toast.success(editChannel ? 'Channel diperbarui' : 'Channel ditambahkan');
    setShowForm(false); setEditChannel(null);
    loadChannels();
  };

  const handleDeleteChannel = async (id: string) => {
    await ShopeeService.deleteChannel(companyId, id);
    toast.success('Channel dihapus');
    loadChannels();
  };

  const handleCSVFile = async (name: string, text: string) => {
    if (!selectedChan) { toast.error('Pilih channel dulu'); return; }
    setImporting(true);
    try {
      const result = await ShopeeService.importCSV(companyId, selectedChan, name, text);
      setImportResult(result);
      toast.success(`${result.settlements.length} baris berhasil diimport`);
      if (result.errors.length > 0) toast.error(`${result.errors.length} baris error`);
      loadBatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import gagal');
    } finally { setImporting(false); }
  };

  const handleViewBatch = async (batchId: string) => {
    setActiveBatch(batchId);
    setSettlements(await ShopeeService.listSettlements(companyId, batchId));
    setTab('history');
  };

  const handleSync = async (batchId: string) => {
    setSyncing(true);
    try {
      const count = await ShopeeService.syncToSales(companyId, batchId, addSale as any);
      toast.success(`${count} transaksi berhasil masuk ke P&L`);
      loadBatches();
      if (activeBatch === batchId) setSettlements(await ShopeeService.listSettlements(companyId, batchId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync gagal');
    } finally { setSyncing(false); }
  };

  const activeBatchData = batches.find(b => b.id === activeBatch);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={14} style={{ color: accent }}/>
          <span className="text-xs tracking-widest uppercase text-[var(--color-text-muted)]">Sales Channel Engine</span>
        </div>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)]">Shopee</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Konfigurasi fee rates → import settlement CSV → otomatis ke P&L
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border-line)]">
        {([['config', 'Konfigurasi'], ['import', 'Import CSV'], ['history', 'History']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-widest transition-all cursor-pointer border-b-2 -mb-px ${tab === t ? 'border-current font-bold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
            style={tab === t ? { color: accent, borderColor: accent } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Config ──────────────────────────────────────────────── */}
      {tab === 'config' && (
        <div className="space-y-4">
          {!showForm && (
            <div className="flex justify-end">
              <button onClick={() => { setEditChannel(null); setShowForm(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs uppercase tracking-widest text-white transition-all cursor-pointer"
                style={{ background: accent }}>
                <Plus size={14}/> Tambah Channel
              </button>
            </div>
          )}

          {showForm && (
            <div className="glass-panel border border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-main)] mb-4">
                {editChannel ? 'Edit Channel' : 'Channel Baru'}
              </h3>
              <ChannelForm
                initial={editChannel ?? undefined}
                onSave={handleSaveChannel}
                onCancel={() => { setShowForm(false); setEditChannel(null); }}
                accent={accent}
              />
            </div>
          )}

          {channels.length === 0 && !showForm ? (
            <div className="text-center py-16 text-sm text-[var(--color-text-muted)]">
              Belum ada channel. Tambah channel Shopee pertama kamu.
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map(ch => (
                <div key={ch.id} className="glass-panel border border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag size={14} style={{ color: accent }}/>
                      <span className="text-sm font-semibold text-[var(--color-text-main)]">{ch.name}</span>
                      {ch.is_active && (
                        <span className="text-xs uppercase px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">Aktif</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        ['Komisi', ch.commission_rate],
                        ['Admin', ch.admin_fee_rate],
                        ['Transaksi', ch.transaction_fee_rate],
                        ['PPN', ch.ppn_rate],
                      ].map(([k, v]) => (
                        <span key={k as string} className="text-xs text-[var(--color-text-muted)]">
                          {k}: <span className="text-[var(--color-text-main)]">{v}%</span>
                        </span>
                      ))}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Effective: <span className="text-yellow-400">{ShopeeFeeEngine.effectiveRate(ch).toFixed(2)}%</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditChannel(ch); setShowForm(true); }}
                      className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all cursor-pointer">
                      <Edit3 size={14}/>
                    </button>
                    <button onClick={() => handleDeleteChannel(ch.id)}
                      className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-red-400 transition-all cursor-pointer">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Import ───────────────────────────────────────────────── */}
      {tab === 'import' && (
        <div className="space-y-5">
          {/* Channel selector */}
          <div>
            <label className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] block mb-2">
              Channel
            </label>
            {channels.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">Buat channel dulu di tab Konfigurasi.</p>
            ) : (
              <select value={selectedChan} onChange={e => setSelectedChan(e.target.value)}
                className="bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30 cursor-pointer">
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          {/* Drop zone */}
          {importing ? (
            <div className="text-center py-16">
              <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-[var(--color-text-muted)]"/>
              <p className="text-xs text-[var(--color-text-muted)]">Memproses CSV...</p>
            </div>
          ) : (
            <CSVDropZone onFile={handleCSVFile} />
          )}

          {/* Import result preview */}
          {importResult && (
            <div className="glass-panel border border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-green-400"/>
                <span className="text-sm font-semibold text-[var(--color-text-main)]">
                  Import Selesai — {importResult.settlements.length} baris
                </span>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Gross Revenue', value: importResult.batch.total_gross, icon: DollarSign, color: 'text-[var(--color-text-main)]' },
                  { label: 'Total Fee',     value: importResult.batch.total_fees,  icon: TrendingDown, color: 'text-red-400' },
                  { label: 'Net Earnings',  value: importResult.batch.total_net,   icon: Package,      color: 'text-green-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="glass-inset rounded-lg p-3">
                    <Icon size={14} className={`mb-1 ${color}`}/>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
                    <p className={`text-sm font-mono font-bold ${color}`}>{currency}{value.toLocaleString('id')}</p>
                  </div>
                ))}
              </div>

              {importResult.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-xs text-yellow-400 font-bold mb-1">{importResult.errors.length} baris dilewati</p>
                    {importResult.errors.slice(0,3).map((e, i) => (
                      <p key={i} className="text-xs text-yellow-400/70">{e}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Settlement table preview */}
              <div className="max-h-64 overflow-y-auto">
                <SettlementTable settlements={importResult.settlements.slice(0, 20)} currency={currency} />
              </div>

              {/* Sync button */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleSync(importResult.batch.id)}
                  disabled={syncing || importResult.batch.status === 'synced_to_pl'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
                  style={{ background: accent }}>
                  {syncing ? <><RefreshCw size={14} className="animate-spin"/> Menyinkronkan...</> : <><Check size={14}/> Sinkron ke P&L ({importResult.settlements.length} transaksi)</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: History ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {batches.length === 0 ? (
            <div className="text-center py-16 text-sm text-[var(--color-text-muted)]">
              Belum ada import. Upload CSV di tab Import.
            </div>
          ) : (
            <>
              {/* Batch list */}
              <div className="space-y-2">
                {batches.map(b => {
                  const chan = channels.find(c => c.id === b.channel_config_id);
                  const isActive = activeBatch === b.id;
                  return (
                    <div key={b.id}
                      className={`bg-[var(--color-card-bg)] border rounded-2xl p-4 cursor-pointer transition-all ${isActive ? 'border-[var(--accent-primary)]/50' : 'border-[var(--color-border-line)] hover:border-white/15'}`}
                      onClick={() => handleViewBatch(b.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[var(--color-text-muted)]"/>
                          <span className="text-xs text-[var(--color-text-main)] font-semibold">{b.filename}</span>
                          <span className={`text-xs uppercase px-1.5 py-0.5 rounded-full ${b.status === 'synced_to_pl' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {b.status === 'synced_to_pl' ? 'Synced ke P&L' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {b.status !== 'synced_to_pl' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleSync(b.id); }}
                              disabled={syncing}
                              className="text-xs uppercase tracking-widest px-2 py-1 rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all cursor-pointer disabled:opacity-50">
                              {syncing ? 'Syncing...' : 'Sync ke P&L'}
                            </button>
                          )}
                          <ChevronRight size={14} className="text-[var(--color-text-muted)]"/>
                        </div>
                      </div>
                      <div className="flex gap-x-5 gap-y-1 mt-2 flex-wrap">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Channel: <span className="text-[var(--color-text-main)]">{chan?.name ?? '-'}</span>
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {b.row_count} pesanan
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Gross: <span className="text-[var(--color-text-main)]">{currency}{b.total_gross.toLocaleString('id')}</span>
                        </span>
                        <span className="text-xs text-red-400">
                          Fee: -{currency}{b.total_fees.toLocaleString('id')}
                        </span>
                        <span className="text-xs text-green-400 font-bold">
                          Net: {currency}{b.total_net.toLocaleString('id')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Settlement detail */}
              {activeBatch && settlements.length > 0 && (
                <div className="glass-panel border border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[var(--color-text-main)] uppercase">
                      Detail: {activeBatchData?.filename}
                    </span>
                    <button onClick={() => { setActiveBatch(null); setSettlements([]); }}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
                      <X size={14}/>
                    </button>
                  </div>
                  <SettlementTable settlements={settlements} currency={currency} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
