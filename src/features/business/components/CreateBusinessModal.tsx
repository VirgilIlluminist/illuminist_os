import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Building, Check } from 'lucide-react';
import { useBusiness, CreateBusinessData } from '../../../app/store/BusinessContext';
import { BIZ_ICON_MAP } from './BusinessSwitcher';

const BUSINESS_TYPES = [
  { id:'fashion',         label:'Fashion Brand',       desc:'Apparel & accessories' },
  { id:'coffee',          label:'Coffee Shop',          desc:'Cafe & beverage' },
  { id:'restaurant',      label:'Restaurant',           desc:'Food & beverage' },
  { id:'retail',          label:'Retail Store',         desc:'Physical & online retail' },
  { id:'agency',          label:'Agency',               desc:'Creative or digital agency' },
  { id:'manufacturing',   label:'Manufacturing',         desc:'Production facility' },
  { id:'service',         label:'Service Business',     desc:'Professional services' },
  { id:'personal_finance',label:'Personal Finance',     desc:'Personal money management' },
  { id:'investment',      label:'Investment Portfolio',  desc:'Portfolio tracking' },
  { id:'custom',          label:'Custom',               desc:'Define your own' },
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

  const inputCls = "w-full px-4 py-2.5 text-sm bg-white/[0.06] border border-white/[0.10] text-white rounded-xl focus:outline-none focus:border-white/25 transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div initial={{scale:0.95,y:12}} animate={{scale:1,y:0}} exit={{scale:0.95,y:8}}
            transition={{duration:0.2,ease:[0.16,1,0.3,1]}}
            className="w-full max-w-lg overflow-hidden"
            style={{ background: 'rgba(14,10,28,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Buat Bisnis Baru
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Langkah {step} dari 2
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white cursor-pointer transition-colors rounded-lg hover:bg-white/5">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-white/50">Pilih tipe bisnis:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {BUSINESS_TYPES.map(t => (
                      <button key={t.id} onClick={() => set('business_type', t.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          form.business_type === t.id
                            ? 'border-white/25 bg-white/[0.08]'
                            : 'border-white/[0.07] hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg mt-0.5 text-[var(--color-accent-highlight)]"
                              style={{ background: 'var(--accent-primary)18' }}>
                          {React.createElement(BIZ_ICON_MAP[t.id] ?? Building, { size: 15 })}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium leading-tight ${form.business_type===t.id?'text-white':'text-white/70'}`}>{t.label}</p>
                          <p className="text-xs text-white/40 leading-tight mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} disabled={!form.business_type}
                    className="w-full py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    style={{background:'var(--color-accent-highlight)',color:'#000'}}>
                    Lanjut →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/50 block mb-2">Nama Bisnis *</label>
                    <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Contoh: NEVAEH Studio" className={inputCls} autoFocus />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 block mb-2">Deskripsi</label>
                    <input value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Opsional" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-white/50 block mb-2">Mata Uang</label>
                      <select value={form.currency} onChange={e=>{
                        const cur = CURRENCIES.find(c=>c.code===e.target.value);
                        set('currency',e.target.value);
                        if(cur) set('currency_symbol',cur.symbol);
                      }} className={inputCls+" cursor-pointer"}>
                        {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/50 block mb-2">Negara</label>
                      <input value={form.country} onChange={e=>set('country',e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 block mb-2">Under Company</label>
                    <select value={form.parent_id||''} onChange={e=>set('parent_id',e.target.value)} className={inputCls+" cursor-pointer"}>
                      {businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={()=>setStep(1)} className="flex-1 py-3 text-sm border border-white/[0.10] text-white/50 rounded-xl hover:text-white transition-all cursor-pointer">
                      ← Kembali
                    </button>
                    <button onClick={handleCreate} disabled={!form.name.trim()||loading}
                      className="flex-grow py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40"
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
