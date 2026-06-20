/**
 * PersonalFinanceView.tsx — Dashboard Keuangan Pribadi
 * Menampilkan savings goals, investasi, dan debt tracking via deep modules.
 */
import React, { useState } from 'react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import ModuleView      from '../../../shared/components/ModuleView';
import { PF_SAVINGS, PF_INVESTMENT, PF_DEBT } from '../../../core/utils/moduleEngine';
import { Target, TrendingUp, CreditCard } from 'lucide-react';

const TABS = [
  { id:'savings',    label:'Savings Goals',      icon:<Target size={14}/>,    module: PF_SAVINGS },
  { id:'investment', label:'Investment Portfolio',icon:<TrendingUp size={14}/>,module: PF_INVESTMENT },
  { id:'debt',       label:'Debt Tracking',       icon:<CreditCard size={14}/>,module: PF_DEBT },
];

export default function PersonalFinanceView() {
  const { currentColor } = useBusiness();
  const { config } = useERP();
  const accent = currentColor || config?.customAccentColor || '#7c3aed';
  const [tab, setTab] = useState('savings');
  const current = TABS.find(t => t.id === tab)!;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">Personal Finance</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Kelola keuangan pribadi — tabungan, investasi, utang</p>
      </div>
      <div className="flex items-center gap-1 border-b border-[var(--color-border-line)]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all cursor-pointer border-b-2 -mb-px ${
              tab === t.id ? 'border-current' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
            style={tab === t.id ? { color: accent, borderColor: accent } : {}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <ModuleView module={current.module} />
    </div>
  );
}
