import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Check } from 'lucide-react';
import { useBusiness, CreateBusinessData } from '../../../app/store/BusinessContext';
import { TYPE_ICONS } from './BusinessSwitcher';

const BUSINESS_TYPES = [
  { id:'fashion',         label:'Fashion Brand',      icon:'👗', desc:'Apparel & accessories' },
  { id:'coffee',          label:'Coffee Shop',         icon:'☕', desc:'Cafe & beverage' },
  { id:'restaurant',      label:'Restaurant',          icon:'🍽', desc:'Food & beverage' },
  { id:'retail',          label:'Retail Store',        icon:'🏪', desc:'Physical & online retail' },
  { id:'agency',          label:'Agency',              icon:'💼', desc:'Creative or digital agency' },
  { id:'manufacturing',   label:'Manufacturing',        icon:'🏭', desc:'Production facility' },
  { id:'service',         label:'Service Business',    icon:'🛠', desc:'Professional services' },
  { id:'personal_finance',label:'Personal Finance',    icon:'💰', desc:'Personal money management' },
  { id:'investment',      label:'Investment Portfolio', icon:'📈', desc:'Portfolio tracking' },
  { id:'custom',          label:'Custom',              icon:'⚡', desc:'Define your own' },
];

const CURRENCIES = [
  { code:'IDR', symbol:'Rp', label:'Rupiah (IDR)' },
  { code:'USD', symbol:'$',  label:'US Dollar (USD)' },
  { code:'SGD', symbol:'S$', label:'Singapore Dollar (SGD)' },
  { code:'EUR', symbol:'€',  label:'Euro (EUR)' },
  { code:'GBP', symbol:'£',  label:'British Pound (GBP)' },
];

interface Props { open: boolean; onClose: () => void; onCreated?: (biz: unknown) => void; }

export default function CreateBusinessModal({ open, onClose, onCreated }: Props) {
  const { createBusiness, businesses } = useBusiness();
  const [step,     setStep]    = useState(1);
  const [loading,  setLoading] = useState(false);
  const [form, setForm] = useState<CreateBusinessData>({
    name:'', business_type:'fashion', currency:'IDR', currency_symbol:'Rp',
    country:'Indonesia', timezone:'Asia/Jakarta', description:'',
    parent_id:'00000000-0000-0000-0000-000000000001',
  });

  const set = (k: keyof CreateBusinessData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const result = await createBusiness(form);
      if (result) {
        onCreated?.(result);
        onClose();
        setStep(1);
        setForm({ name:'', business_type:'fashion', currency:'IDR', currency_symbol:'Rp', country:'Indonesia', timezone:'Asia/Jakarta', description:'', parent_id:'00000000-0000-0000-0000-000000000001' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 text-xs font-mono bg-[var(--color-background)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:border-[var(--color-accent-highlight)] transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div initial={{scale:0.95,y:12}} animate={{scale:1,y:0}} exit={{scale:0.95,y:8}}
            transition={{duration:0.2,ease:[0.16,1,0.3,1]}}
            className="w-full max-w-lg bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-line)]"
                 style={{borderTopColor:'var(--color-accent-highlight)',borderTopWidth:2}}>
              <div>
                <h2 className="text-sm font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">
                  Buat Bisnis Baru
                </h2>
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                  Langkah {step} dari 2
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">Pilih tipe bisnis:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {BUSINESS_TYPES.map(t => (
                      <button key={t.id} onClick={() => set('business_type', t.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          form.business_type === t.id
                            ? 'border-[var(--color-accent-highlight)] bg-[var(--color-accent-highlight)]/5'
                            : 'border-[var(--color-border-line)] hover:border-[var(--color-accent-highlight)]/40 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="text-xl mt-0.5">{t.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold font-mono leading-tight ${form.business_type===t.id?'text-[var(--color-accent-highlight)]':'text-[var(--color-text-main)]'}`}>{t.label}</p>
                          <p className="text-[9px] text-[var(--color-text-muted)] leading-tight mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} disabled={!form.business_type}
                    className="w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    style={{background:'var(--color-accent-highlight)',color:'#000'}}>
                    Lanjut →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block mb-1.5">Nama Bisnis *</label>
                    <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Contoh: NEVAEH Studio" className={inputCls} autoFocus />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block mb-1.5">Deskripsi</label>
                    <input value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Opsional" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block mb-1.5">Mata Uang</label>
                      <select value={form.currency} onChange={e=>{
                        const cur = CURRENCIES.find(c=>c.code===e.target.value);
                        set('currency',e.target.value);
                        if(cur) set('currency_symbol',cur.symbol);
                      }} className={inputCls+" cursor-pointer"}>
                        {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block mb-1.5">Negara</label>
                      <input value={form.country} onChange={e=>set('country',e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block mb-1.5">Under Company</label>
                    <select value={form.parent_id||''} onChange={e=>set('parent_id',e.target.value)} className={inputCls+" cursor-pointer"}>
                      {businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={()=>setStep(1)} className="flex-1 py-2.5 text-xs font-mono uppercase tracking-wider border border-[var(--color-border-line)] text-[var(--color-text-muted)] rounded-lg hover:text-[var(--color-text-main)] transition-all cursor-pointer">
                      ← Kembali
                    </button>
                    <button onClick={handleCreate} disabled={!form.name.trim()||loading}
                      className="flex-2 flex-grow py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-40"
                      style={{background:'var(--color-accent-highlight)',color:'#000'}}>
                      {loading ? 'Membuat...' : '✓ Buat Bisnis'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
