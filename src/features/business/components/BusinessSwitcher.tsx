import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useBusiness, Business } from '../../../app/store/BusinessContext';

export const TYPE_ICONS: Record<string, string> = {
  fashion:'👗', coffee:'☕', restaurant:'🍽', retail:'🏪',
  agency:'💼', manufacturing:'🏭', service:'🛠',
  personal_finance:'💰', investment:'📈', holding:'🏢', custom:'⚡',
};

export default function BusinessSwitcher({ onCreateNew }: { onCreateNew: () => void }) {
  const { businesses, activeBusiness, switchBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const holding  = businesses.filter(b => !b.parent_id);
  const children = businesses.filter(b =>  b.parent_id);

  const BizItem = ({ biz, indent = false }: { biz: Business; indent?: boolean }) => {
    const isActive = biz.id === activeBusiness?.id;
    return (
      <button
        onClick={() => { switchBusiness(biz.id); setOpen(false); }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer text-left ${indent ? 'ml-4 w-[calc(100%-16px)]' : ''} ${isActive ? 'bg-[var(--color-accent-highlight)]/10 text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-main)]'}`}
      >
        <span className="text-sm">{TYPE_ICONS[biz.business_type] || '🏢'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate leading-tight">{biz.name}</p>
          <p className="text-xs opacity-60 capitalize leading-tight">{biz.business_type?.replace('_',' ')}</p>
        </div>
        {isActive && <Check size={14} style={{ color:'var(--color-accent-highlight)', flexShrink:0 }} />}
      </button>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer">
        <span className="text-lg">{TYPE_ICONS[activeBusiness?.business_type || 'holding']||'🏢'}</span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-[var(--color-text-main)] truncate leading-tight">
            {activeBusiness?.name || 'Select Business'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] capitalize leading-tight">
            {activeBusiness?.business_type?.replace('_',' ') || ''}
          </p>
        </div>
        <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform shrink-0 ${open?'rotate-180':''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-4, scale:0.97 }} transition={{ duration:0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl shadow-2xl overflow-hidden"
            style={{ minWidth:220 }}
          >
            <div className="p-2 max-h-72 overflow-y-auto space-y-0.5">
              {holding.map(h => (
                <div key={h.id}>
                  <BizItem biz={h} />
                  {children.filter(c => c.parent_id === h.id).map(c => (
                    <div key={c.id} className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--color-border-line)]" />
                      <BizItem biz={c} indent />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-border-line)] p-2">
              <button onClick={() => { setOpen(false); onCreateNew(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-highlight)] hover:bg-[var(--color-accent-highlight)]/5 transition-all cursor-pointer">
                <Plus size={14} /><span>Tambah Bisnis Baru</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
