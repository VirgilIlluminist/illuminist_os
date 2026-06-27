import React, { useState } from 'react';
import { Bot, ChevronUp, ChevronDown, AlertTriangle, Settings2, X } from 'lucide-react';
import { useAIUsage } from './useAIUsage';
import type { AIBudgetConfig } from './AIUsageService';
import type { ProviderSummary } from './AIUsageService';

interface Props {
  companyId:  string | undefined;
  sessionId?: string;
  accent?:    string;
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini:     '#4285F4',
  openai:     '#10A37F',
  claude:     '#D97757',
  openrouter: '#9C6FFF',
};

function fmt(usd: number): string {
  if (usd < 0.001) return '<$0.001';
  if (usd < 0.01)  return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function GaugeBar({ value, limit, alert }: { value: number; limit: number; alert: boolean }) {
  if (limit <= 0) return null;
  const pct = Math.min((value / limit) * 100, 100);
  const color = pct >= 100 ? '#ff3b30' : alert ? '#ff9500' : '#34c759';
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ProviderRow({ p }: { p: ProviderSummary }) {
  const color = PROVIDER_COLORS[p.provider] ?? '#888';
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs uppercase text-[var(--color-text-muted)]">{p.provider}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-muted)]">{fmtTokens(p.total_tokens)}tok</span>
        <span className="text-xs text-[var(--color-text-main)]">{fmt(p.cost_usd)}</span>
      </div>
    </div>
  );
}

function BudgetEditor({ budget, onSave, onClose }: {
  budget:  AIBudgetConfig;
  onSave:  (b: AIBudgetConfig) => void;
  onClose: () => void;
}) {
  const [daily,     setDaily]     = useState(String(budget.daily_limit_usd));
  const [monthly,   setMonthly]   = useState(String(budget.monthly_limit_usd));
  const [threshold, setThreshold] = useState(String(Math.round(budget.alert_threshold * 100)));

  const handleSave = () => {
    onSave({
      daily_limit_usd:   parseFloat(daily)   || 0,
      monthly_limit_usd: parseFloat(monthly) || 0,
      alert_threshold:   (parseInt(threshold) || 80) / 100,
    });
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-lg p-3 shadow-xl z-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">AI Budget</span>
        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
          <X size={14}/>
        </button>
      </div>
      <div className="space-y-2">
        <label className="block">
          <span className="text-xs text-[var(--color-text-muted)] uppercase">Daily Limit (USD)</span>
          <input type="text" inputMode="decimal" value={daily} onChange={e => setDaily(e.target.value.replace(/[^0-9.]/g, ''))}
            className="mt-0.5 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--color-text-muted)] uppercase">Monthly Limit (USD)</span>
          <input type="text" inputMode="decimal" value={monthly} onChange={e => setMonthly(e.target.value.replace(/[^0-9.]/g, ''))}
            className="mt-0.5 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--color-text-muted)] uppercase">Alert Threshold (%)</span>
          <input type="text" inputMode="numeric" value={threshold} onChange={e => setThreshold(e.target.value.replace(/[^0-9]/g, ''))}
            className="mt-0.5 w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"
          />
        </label>
        <button onClick={handleSave}
          className="w-full mt-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm uppercase tracking-wider text-[var(--color-text-main)] transition-all cursor-pointer">
          Simpan
        </button>
      </div>
    </div>
  );
}

export default function AIUsageMonitor({ companyId, sessionId, accent = '#d4af37' }: Props) {
  const { session, today, month, budget, alerts, collapsed, toggleCollapsed, saveBudget } = useAIUsage(companyId, sessionId);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const hasAlert = alerts.daily || alerts.monthly;

  return (
    <div className="px-3 pb-2 shrink-0 border-t border-[var(--color-border-line)] pt-2 relative">
      {/* Header */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between mb-1 group cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Bot size={14} style={{ color: accent }}/>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">AI Usage</span>
          {hasAlert && <AlertTriangle size={12} className="text-orange-400"/>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); setShowBudgetEditor(v => !v); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer"
          >
            <Settings2 size={14}/>
          </button>
          {collapsed ? <ChevronDown size={14} className="text-[var(--color-text-muted)]"/> : <ChevronUp size={14} className="text-[var(--color-text-muted)]"/>}
        </div>
      </button>

      {/* Budget editor popover */}
      {showBudgetEditor && (
        <BudgetEditor budget={budget} onSave={saveBudget} onClose={() => setShowBudgetEditor(false)} />
      )}

      {!collapsed && (
        <div className="space-y-2">
          {/* Budget alerts */}
          {alerts.daily && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle size={12} className="text-orange-400 shrink-0"/>
              <span className="text-xs text-orange-400">Budget harian {Math.round((today.total_cost_usd / budget.daily_limit_usd) * 100)}%</span>
            </div>
          )}
          {alerts.monthly && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle size={12} className="text-orange-400 shrink-0"/>
              <span className="text-xs text-orange-400">Budget bulanan {Math.round((month.total_cost_usd / budget.monthly_limit_usd) * 100)}%</span>
            </div>
          )}

          {/* Stats grid: session / today / month */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Sesi', cost: session.total_cost_usd, tokens: session.total_tokens },
              { label: 'Hari',  cost: today.total_cost_usd,   tokens: today.total_tokens },
              { label: 'Bulan', cost: month.total_cost_usd,   tokens: month.total_tokens },
            ].map(({ label, cost, tokens }) => (
              <div key={label} className="bg-white/[0.03] rounded px-1.5 py-1">
                <p className="text-xs text-[var(--color-text-muted)] uppercase">{label}</p>
                <p className="text-xs font-bold text-[var(--color-text-main)]">{fmt(cost)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{fmtTokens(tokens)}</p>
              </div>
            ))}
          </div>

          {/* Daily gauge */}
          {budget.daily_limit_usd > 0 && (
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-[var(--color-text-muted)]">Hari / {fmt(budget.daily_limit_usd)}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{Math.round((today.total_cost_usd / budget.daily_limit_usd) * 100)}%</span>
              </div>
              <GaugeBar value={today.total_cost_usd} limit={budget.daily_limit_usd} alert={alerts.daily} />
            </div>
          )}

          {/* Monthly gauge */}
          {budget.monthly_limit_usd > 0 && (
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-[var(--color-text-muted)]">Bulan / {fmt(budget.monthly_limit_usd)}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{Math.round((month.total_cost_usd / budget.monthly_limit_usd) * 100)}%</span>
              </div>
              <GaugeBar value={month.total_cost_usd} limit={budget.monthly_limit_usd} alert={alerts.monthly} />
            </div>
          )}

          {/* Per provider breakdown */}
          {month.by_provider.length > 0 && (
            <div className="border-t border-[var(--color-border-line)] pt-1.5">
              {month.by_provider.map(p => <ProviderRow key={p.provider} p={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
