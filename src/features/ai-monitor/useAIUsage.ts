import { useState, useEffect, useCallback, useRef } from 'react';
import { AIUsageService, AIBudgetConfig } from './AIUsageService';
import type { UsageSummary } from './AIUsageService';

interface AIUsageState {
  session:  UsageSummary;
  today:    UsageSummary;
  month:    UsageSummary;
  budget:   AIBudgetConfig;
  alerts:   { daily: boolean; monthly: boolean };
  loading:  boolean;
}

const EMPTY: UsageSummary = {
  total_input_tokens: 0, total_output_tokens: 0, total_tokens: 0,
  total_cost_usd: 0, call_count: 0, by_provider: [],
};

const COLLAPSED_KEY = 'illum_ai_monitor_collapsed';

export function useAIUsage(companyId: string | undefined, sessionId?: string) {
  const [state, setState] = useState<AIUsageState>({
    session: EMPTY, today: EMPTY, month: EMPTY,
    budget: AIUsageService.loadBudget(),
    alerts: { daily: false, monthly: false },
    loading: false,
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await AIUsageService.getFullSummary(companyId, sessionId);
      setState({ ...data, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [companyId, sessionId]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const saveBudget = useCallback((config: AIBudgetConfig) => {
    AIUsageService.saveBudget(config);
    setState(s => ({ ...s, budget: config }));
  }, []);

  return { ...state, collapsed, toggleCollapsed, saveBudget, refresh };
}
