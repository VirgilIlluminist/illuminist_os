/**
 * BusinessWizard.tsx — Business Creation Wizard V5
 * Step 1: Pilih tipe bisnis (grid cards)
 * Step 2: Branding (nama, deskripsi, mata uang, timezone)
 * Step 3: Pilih modul aktif (checklist)
 * Step 4: Review & Generate → switch ke workspace baru
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronRight, ChevronLeft, Check, Sparkles, Zap,
  Shirt, Coffee, UtensilsCrossed, Store, Briefcase, Wrench, Building2, Wallet, TrendingUp, Building,
} from 'lucide-react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { ALL_BUSINESS_TYPES, getModulesForType, type BusinessTypeId } from '../../../core/constants/businessConstants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BIZ_ICONS: Record<BusinessTypeId, React.ComponentType<any>> = {
  fashion: Shirt, coffee: Coffee, restaurant: UtensilsCrossed, retail: Store,
  agency: Briefcase, service: Wrench, property: Building2,
  personal_finance: Wallet, investment: TrendingUp, holding: Building, custom: Zap,
};
import { toast } from '../../../shared/ui/Toast';

interface Props { open: boolean; onClose: () => void }

const CURRENCIES = [
  { code:'IDR', symbol:'Rp', label:'Rupiah (IDR)' },
  { code:'USD', symbol:'$',  label:'US Dollar (USD)' },
  { code:'SGD', symbol:'S$', label:'Singapore Dollar (SGD)' },
  { code:'EUR', symbol:'€',  label:'Euro (EUR)' },
  { code:'MYR', symbol:'RM', label:'Ringgit (MYR)' },
];

const TIMEZONES = [
  { value:'Asia/Jakarta',   label:'WIB (Jakarta)' },
  { value:'Asia/Makassar',  label:'WITA (Makassar)' },
  { value:'Asia/Jayapura',  label:'WIT (Jayapura)' },
  { value:'Asia/Singapore', label:'Singapore' },
  { value:'UTC',            label:'UTC' },
];

const ALL_MODULES = [
  { id:'Sales Tracking',      label:'Sales',        icon:'📊' },
  { id:'Cashflow',            label:'Cashflow',     icon:'💸' },
  { id:'Laba Rugi',           label:'P&L',          icon:'📈' },
  { id:'Accounting',          label:'Akuntansi',    icon:'📒' },
  { id:'Piutang',             label:'Piutang',      icon:'🕐' },
  { id:'HR System',           label:'HR & Tim',     icon:'👥' },
  { id:'Payroll',             label:'Payroll',      icon:'💰' },
  { id:'Gaji Owner',          label:'Gaji Owner',   icon:'👛' },
  { id:'Customer Database',   label:'CRM',          icon:'🤝' },
  { id:'Assets & Equipment',  label:'Aset',         icon:'🏗'  },
  { id:'Material Library',    label:'Material',     icon:'🧵' },
  { id:'Production',          label:'Produksi',     icon:'⚙️' },
  { id:'Master Products',     label:'Produk',       icon:'📦' },
  { id:'Purchase Orders',     label:'Pembelian',    icon:'🛒' },
  { id:'Invoice & Nota',      label:'Invoice',      icon:'🧾' },
  { id:'Smart Databases',     label:'Database',     icon:'🗄'  },
  { id:'Analisa Bisnis AI',   label:'AI Analisa',   icon:'🤖' },
  { id:'Reports & Analytics', label:'Laporan',      icon:'📋' },
];

const STEPS = ['Tipe Bisnis', 'Branding', 'Modul', 'Generate'];

export default function BusinessWizard({ open, onClose }: Props) {
  const { createBusiness, switchBusiness } = useBusiness();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const [bizType,   setBizType]   = useState('fashion');
  const [bizName,   setBizName]   = useState('');
  const [nameEdited,setNameEdited] = useState(false);
  const [bizDesc,   setBizDesc]   = useState('');
  const [currency,  setCurrency]  = useState('IDR');
  const [timezone,  setTimezone]  = useState('Asia/Jakarta');
  const [modules,   setModules]   = useState<Set<string>>(new Set());

  const selectedType = ALL_BUSINESS_TYPES.find(t => t.id === bizType);

  // Sync modul + nama default saat tipe berubah.
  // Nama hanya di-override jika user belum mengetik manual.
  useEffect(() => {
    const defaults = getModulesForType(bizType);
    setModules(new Set(defaults));
    if (!nameEdited) {
      setBizName(ALL_BUSINESS_TYPES.find(t => t.id === bizType)?.defaultName || '');
    }
  }, [bizType]);

  const toggleModule = (id: string) => {
    setModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!bizName.trim()) { toast.error('Nama bisnis wajib diisi'); return; }
    setLoading(true);
    try {
      const currObj = CURRENCIES.find(c => c.code === currency)!;
      const biz = await createBusiness({
        name: bizName.trim(), business_type: bizType,
        currency, currency_symbol: currObj.symbol,
        country: 'Indonesia', timezone, description: bizDesc,
        parent_id: '00000000-0000-0000-0000-000000000001',
      });
      if (biz) {
        setDone(true);
        setTimeout(() => { switchBusiness(biz.id); onClose(); resetWizard(); }, 1600);
      }
    } catch { toast.error('Gagal membuat bisnis. Coba lagi.'); }
    finally { setLoading(false); }
  };

  const resetWizard = () => {
    setStep(1); setDone(false); setBizName(''); setNameEdited(false); setBizDesc(''); setBizType('fashion');
  };

  const canNext = () => {
    if (step === 2) return bizName.trim().length > 0;
    if (step === 3) return modules.size > 0;
    return true;
  };

  if (!open) return null;

  const accent = selectedType?.colorHex || '#0071e3';
  const inputCls = 'w-full px-4 py-2.5 text-sm bg-white/[0.06] border border-white/[0.10] text-white rounded-xl focus:outline-none focus:border-white/25 transition-colors placeholder:text-white/30';
  const labelCls = 'text-sm font-medium text-white/50 mb-2 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <motion.div
        initial={{ opacity:0, scale:0.95, y:16 }}
        animate={{ opacity:1, scale:1,    y:0 }}
        exit={{ opacity:0, scale:0.95 }}
        transition={{ type:'spring', stiffness:400, damping:36 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ maxHeight:'90vh', display:'flex', flexDirection:'column', background:'rgba(14,10,28,0.92)', border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${accent}20`, color: accent }}>
              {React.createElement(BIZ_ICONS[bizType as BusinessTypeId] ?? Zap, { size: 16 })}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Buat Bisnis Baru</p>
              <p className="text-xs text-white/40">Langkah {step} dari 4 — {STEPS[step-1]}</p>
            </div>
          </div>
          <button onClick={() => { onClose(); resetWizard(); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] cursor-pointer">
            <X size={15} className="text-white/40"/>
          </button>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-white/[0.06] shrink-0">
          <motion.div className="h-full rounded-full" style={{ background:accent }}
            animate={{ width:`${(step/4)*100}%` }} transition={{ duration:0.4 }}/>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={step}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.18 }}>

              {/* STEP 1 — Tipe Bisnis */}
              {step === 1 && (
                <div>
                  <p className="text-sm text-white/40 mb-4">Pilih template yang paling sesuai bisnis Anda</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {ALL_BUSINESS_TYPES.map(t => (
                      <button key={t.id} onClick={() => setBizType(t.id)}
                        className={`p-4 rounded-xl text-left border-2 cursor-pointer transition-all ${bizType===t.id ? 'shadow-md' : 'border-[var(--color-border-line)] hover:border-[var(--color-text-muted)] border'}`}
                        style={bizType===t.id ? { borderColor:t.colorHex, background:`${t.colorHex}10` } : {}}>
                        <span className="block mb-2" style={{ color: bizType===t.id ? t.colorHex : 'rgba(255,255,255,0.55)' }}>
                          {React.createElement(BIZ_ICONS[t.id as BusinessTypeId] ?? Zap, { size: 20 })}
                        </span>
                        <p className="text-sm font-medium text-white leading-tight">{t.label}</p>
                        <p className="text-xs text-white/40 mt-0.5 leading-tight">{t.description}</p>
                        {bizType === t.id && (
                          <span className="mt-1.5 inline-flex text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background:t.colorHex }}>✓ Dipilih</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — Branding */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-white/40 mb-4">Atur identitas bisnis Anda</p>
                  <div>
                    <label className={labelCls}>Nama Bisnis <span className="text-red-400">*</span></label>
                    <input value={bizName} onChange={e => { setBizName(e.target.value); setNameEdited(true); }} autoFocus
                      placeholder={selectedType?.defaultName}
                      className={inputCls}/>
                  </div>
                  <div>
                    <label className={labelCls}>Deskripsi (opsional)</label>
                    <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)} rows={2}
                      placeholder="Singkat tentang bisnis ini..."
                      className={`${inputCls} resize-none`}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Mata Uang</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)}
                        className={`${inputCls} cursor-pointer`}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-[#0e0a1c]">{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Zona Waktu</label>
                      <select value={timezone} onChange={e => setTimezone(e.target.value)}
                        className={`${inputCls} cursor-pointer`}>
                        {TIMEZONES.map(tz => <option key={tz.value} value={tz.value} className="bg-[#0e0a1c]">{tz.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">PREVIEW</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${accent}18`, color: accent }}>
                        {React.createElement(BIZ_ICONS[bizType as BusinessTypeId] ?? Zap, { size: 20 })}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{bizName || selectedType?.defaultName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{selectedType?.label} · {currency}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Modul */}
              {step === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white/40">Aktifkan modul yang dibutuhkan · bisa diubah di Settings</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:`${accent}15`, color:accent }}>{modules.size} aktif</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_MODULES.map(mod => {
                      const isOn = modules.has(mod.id);
                      const isDefault = getModulesForType(bizType).includes(mod.id);
                      return (
                        <button key={mod.id} onClick={() => toggleModule(mod.id)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all text-left border ${isOn ? 'border-2' : 'border-white/[0.08] opacity-55 hover:opacity-90'}`}
                          style={isOn ? { borderColor:accent, background:`${accent}08` } : {}}>
                          <span className="text-base shrink-0">{mod.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                              {mod.label}
                              {isDefault && <span className="text-xs px-1 py-0.5 rounded-sm bg-white/[0.08] text-white/50">Default</span>}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isOn ? 'border-0' : 'border-[var(--color-border-line)]'}`}
                            style={isOn ? { background:accent } : {}}>
                            {isOn && <Check size={14} className="text-white"/>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4 — Generate */}
              {step === 4 && (
                <div className="text-center py-4">
                  {done ? (
                    <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} className="space-y-3">
                      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background:`${accent}15` }}>
                        <Check size={32} style={{ color:accent }}/>
                      </div>
                      <p className="text-lg font-bold text-[var(--color-text-main)]">Workspace Dibuat!</p>
                      <p className="text-sm text-[var(--color-text-muted)]">Berpindah ke {bizName}...</p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background:`${accent}15`, color: accent }}>
                        {React.createElement(BIZ_ICONS[bizType as BusinessTypeId] ?? Zap, { size: 32 })}
                      </div>
                      <p className="text-lg font-bold text-[var(--color-text-main)]">{bizName}</p>
                      <p className="text-sm text-[var(--color-text-muted)] mb-6">{selectedType?.tagline}</p>

                      <div className="grid grid-cols-3 gap-3 mb-6 text-left">
                        {[
                          { label:'Tipe',         value: selectedType?.label || '' },
                          { label:'Mata Uang',    value: currency },
                          { label:'Modul Aktif',  value: `${modules.size} modul` },
                        ].map(item => (
                          <div key={item.label} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                            <p className="text-xs text-white/40">{item.label}</p>
                            <p className="text-xs font-semibold text-white mt-0.5">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <button onClick={handleCreate} disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                        style={{ background:accent }}>
                        {loading
                          ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> Membuat workspace...</>
                          : <><Sparkles size={15}/> Generate Business Workspace</>
                        }
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {!done && (
          <div className="px-6 py-4 border-t border-white/[0.08] flex justify-between shrink-0">
            <button onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-white/[0.10] text-white/50 hover:text-white disabled:opacity-30 cursor-pointer transition-colors">
              <ChevronLeft size={14}/> Kembali
            </button>
            {step < 4 ? (
              <button onClick={() => { if (!canNext()) { toast.error(step===2?'Nama bisnis wajib diisi':'Pilih minimal 1 modul'); return; } setStep(s=>s+1); }}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white cursor-pointer" style={{ background:accent }}>
                {step===3?'Review':'Lanjut'} <ChevronRight size={14}/>
              </button>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
