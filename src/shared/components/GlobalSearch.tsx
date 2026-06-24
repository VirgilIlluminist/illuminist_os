/**
 * GlobalSearch.tsx — Command Palette dengan Enterprise Search Engine
 * Buka dengan ⌘K. Mencari halaman, produk, material, pelanggan, modul.
 * Hasil dikelompokkan per kategori, klik navigasi langsung.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Hash, FileText, Users, Package, Cpu, ArrowRight } from 'lucide-react';
import { useERP } from '../../app/store/ERPContext';
import { useBusiness } from '../../app/store/BusinessContext';
import { ALL_DEEP_MODULES } from '../../core/utils/moduleEngine';
import { ALL_BUSINESS_TYPES } from '../../core/constants/businessConstants';

interface SearchResult {
  type: 'page' | 'module' | 'product' | 'material' | 'customer' | 'supplier';
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  route: string;
  score: number;
}

// Page-level items
const PAGE_ITEMS: { id:string; label:string; icon:string; desc:string }[] = [
  { id:'Dashboard',           label:'Dashboard',             icon:'⊞', desc:'Ringkasan bisnis hari ini' },
  { id:'Sales Tracking',      label:'Sales Tracking',        icon:'📊', desc:'Rekap penjualan & order' },
  { id:'Cashflow',            label:'Cashflow',              icon:'💸', desc:'Arus kas masuk dan keluar' },
  { id:'Piutang',             label:'Piutang',               icon:'🕐', desc:'Invoice belum dibayar' },
  { id:'Laba Rugi',           label:'Laba Rugi',             icon:'📈', desc:'Laporan P&L' },
  { id:'Arus Kas',            label:'Arus Kas',              icon:'📊', desc:'Cash Flow Statement' },
  { id:'Accounting',          label:'Accounting',            icon:'📒', desc:'Jurnal double-entry' },
  { id:'Chart of Accounts',   label:'Chart of Accounts',     icon:'📋', desc:'Daftar akun keuangan' },
  { id:'HR System',           label:'HR System',             icon:'👥', desc:'Karyawan & absensi' },
  { id:'Payroll',             label:'Payroll',               icon:'💰', desc:'Gaji karyawan' },
  { id:'Gaji Owner',          label:'Gaji Owner',            icon:'👛', desc:'Alokasi profit owner' },
  { id:'Material Library',    label:'Material Library',      icon:'🧵', desc:'Stok bahan baku' },
  { id:'Dynamic HPP Engine',  label:'HPP Engine',            icon:'⚙️', desc:'Kalkulasi HPP' },
  { id:'Kalkulator Marketplace',label:'Kalkulator Marketplace',icon:'🛒', desc:'Shopee/TikTok/Tokopedia' },
  { id:'ROI Iklan',           label:'ROI Iklan',             icon:'📣', desc:'Break even & ROAS' },
  { id:'Analisa Bisnis AI',   label:'AI Analisa Bisnis',     icon:'🤖', desc:'Insight dari data nyata' },
  { id:'Laporan Bulanan',     label:'Laporan Bulanan',       icon:'📋', desc:'Ringkasan otomatis' },
  { id:'Reports & Analytics', label:'Reports & Analytics',   icon:'📊', desc:'Laporan komprehensif' },
  { id:'Settings',            label:'Settings',              icon:'⚙',  desc:'Pengaturan app' },
  { id:'Notification Center', label:'Notifikasi',            icon:'🔔', desc:'Semua notifikasi' },
  { id:'Customer Database',   label:'Customer Database',     icon:'😊', desc:'CRM pelanggan' },
  { id:'Supplier Database',   label:'Supplier Database',     icon:'🏭', desc:'Database supplier' },
  { id:'Invoice & Nota',      label:'Invoice & Nota',        icon:'🧾', desc:'Buat & cetak invoice' },
  { id:'Smart Databases',     label:'Smart Databases',       icon:'🗄',  desc:'Tabel & kanban kustom' },
  { id:'Executive Command Center', label:'Executive Command Center', icon:'🏛', desc:'CEO dashboard' },
  { id:'Personal Finance',    label:'Personal Finance',      icon:'💎', desc:'Keuangan pribadi' },
  { id:'Assets & Equipment',  label:'Assets & Equipment',    icon:'🏗', desc:'Kelola aset bisnis' },
];

function scoreMatch(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) if (t[i] === q[qi]) qi++;
  return qi === q.length ? 40 + Math.round(q.length/t.length*30) : 0;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const { config, computedSales, computedMaterials, customers, suppliers, formatMoney } = useERP();
  const { activeBusiness } = useBusiness();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = config?.customAccentColor || '#7c3aed';

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (!open) return; onClose(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const out: SearchResult[] = [];
    const q = query.toLowerCase();

    // Pages
    PAGE_ITEMS.forEach(p => {
      const s = Math.max(scoreMatch(query, p.label), scoreMatch(query, p.desc));
      if (s > 0) out.push({ type:'page', id:p.id, title:p.label, subtitle:p.desc, icon:p.icon, route:p.id, score:s });
    });

    // Deep modules
    ALL_DEEP_MODULES.forEach(m => {
      const s = Math.max(scoreMatch(query, m.title), scoreMatch(query, m.subtitle));
      if (s > 0) out.push({ type:'module', id:m.id, title:m.title, subtitle:m.subtitle, icon:m.icon, route:m.title, score:s });
    });

    // Products (from sales)
    const products = new Map<string,number>();
    (computedSales||[]).forEach((s:any) => {
      const name = s.productName || s.product || '';
      if (name) products.set(name, (products.get(name)||0)+(s.netRevenue||0));
    });
    products.forEach((rev, name) => {
      const s = scoreMatch(query, name);
      if (s > 0) out.push({ type:'product', id:name, title:name, subtitle:`Revenue: ${formatMoney(rev)}`, icon:'📦', route:'Sales Tracking', score:s });
    });

    // Materials
    (computedMaterials||[]).forEach((m:any) => {
      const s = scoreMatch(query, m.name);
      if (s > 0) out.push({ type:'material', id:m.id||m.name, title:m.name, subtitle:`Stok: ${m.computedStock||m.baseQty||0} ${m.unit}`, icon:'🧵', route:'Material Library', score:s });
    });

    // Customers
    (customers||[]).forEach((c:any) => {
      const s = scoreMatch(query, c.name||c.customerName||'');
      if (s > 0) out.push({ type:'customer', id:c.id||c.name, title:c.name||c.customerName, subtitle:'Pelanggan', icon:'😊', route:'Customer Database', score:s });
    });

    return out.sort((a,b) => b.score - a.score).slice(0, 20);
  }, [query, computedSales, computedMaterials, customers]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      const key = r.type === 'page' ? 'Halaman' : r.type === 'module' ? 'Modul Bisnis' :
        r.type === 'product' ? 'Produk' : r.type === 'material' ? 'Material' : 'Pelanggan';
      if (!g[key]) g[key] = [];
      g[key].push(r);
    });
    return g;
  }, [results]);

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
        style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)' }}
        onClick={onClose}>
        <motion.div
          initial={{ opacity:0, scale:0.96, y:-12 }}
          animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.96, y:-12 }}
          transition={{ type:'spring', stiffness:400, damping:36 }}
          className="w-full max-w-xl bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight:'75vh', display:'flex', flexDirection:'column' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border-line)]">
            <Search size={18} className="text-[var(--color-text-muted)] shrink-0"/>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari halaman, produk, material, pelanggan..."
              style={{ fontSize: '15px', letterSpacing: '-0.01em' }}
              className="flex-1 bg-transparent text-[var(--color-text-main)] focus:outline-none placeholder:text-[var(--color-text-muted)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 rounded-lg cursor-pointer hover:bg-white/5">
                <X size={16} className="text-[var(--color-text-muted)]"/>
              </button>
            )}
            <kbd style={{ fontSize: '12px' }} className="border border-[var(--color-border-line)] rounded-lg px-2 py-1 text-[var(--color-text-muted)] shrink-0">ESC</kbd>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!query ? (
              <div className="px-4 py-3">
                <p style={{ fontSize: '11px' }} className="font-semibold text-[var(--color-text-muted)] mb-3 tracking-wide uppercase">Pintasan</p>
                {[
                  { label:'Dashboard', icon:'⊞', desc:'Ringkasan bisnis' },
                  { label:'Sales Tracking', icon:'📊', desc:'Rekap penjualan' },
                  { label:'Cashflow', icon:'💸', desc:'Arus kas' },
                  { label:'Analisa Bisnis AI', icon:'🤖', desc:'AI insight' },
                ].map(item => (
                  <button key={item.label} onClick={() => handleSelect(item.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-background)] cursor-pointer transition-colors text-left group">
                    <span className="text-base">{item.icon}</span>
                    <span style={{ fontSize: '14px', letterSpacing: '-0.01em' }} className="text-[var(--color-text-main)] flex-1">{item.label}</span>
                    <span style={{ fontSize: '12px' }} className="text-[var(--color-text-muted)]">{item.desc}</span>
                    <ArrowRight size={15} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100"/>
                  </button>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl opacity-30">🔍</span>
                <p className="text-sm text-[var(--color-text-muted)]">Tidak ada hasil untuk "{query}"</p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(grouped).map(([group, items]) => (
                  <div key={group} className="mb-3">
                    <p style={{ fontSize: '11px' }} className="font-semibold text-[var(--color-text-muted)] px-2 py-1.5 uppercase tracking-wide">{group} ({items.length})</p>
                    {items.slice(0,5).map(item => (
                      <button key={item.id} onClick={() => handleSelect(item.route)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-background)] cursor-pointer transition-colors text-left group">
                        <span className="text-lg shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: '14px', letterSpacing: '-0.01em' }} className="font-medium text-[var(--color-text-main)] truncate">{item.title}</p>
                          {item.subtitle && <p style={{ fontSize: '12px' }} className="text-[var(--color-text-muted)] truncate mt-0.5">{item.subtitle}</p>}
                        </div>
                        <ArrowRight size={15} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 shrink-0"/>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[var(--color-border-line)] flex items-center gap-3">
            <span style={{ fontSize: '12px' }} className="text-[var(--color-text-muted)]">{results.length > 0 ? `${results.length} hasil` : 'Ketik untuk mencari'}</span>
            <span style={{ fontSize: '12px' }} className="text-[var(--color-text-muted)] ml-auto flex items-center gap-1.5">
              <kbd className="border border-[var(--color-border-line)] rounded-md px-1.5 py-0.5">↑↓</kbd> navigasi
              <kbd className="border border-[var(--color-border-line)] rounded-md px-1.5 py-0.5">↵</kbd> buka
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
