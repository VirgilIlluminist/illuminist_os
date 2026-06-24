/**
 * AIUsageService — aggregasi usage records jadi summary per sesi/hari/bulan.
 * Budget config disimpan di localStorage (siap upgrade ke Supabase).
 */
import { AIUsageRecord, AIUsageTracker } from '../../core/services/AIUsageTracker';

export type BudgetPeriod = 'daily' | 'monthly';

export interface AIBudgetConfig {
  daily_limit_usd:   number;
  monthly_limit_usd: number;
  alert_threshold:   number;  // 0-1, e.g. 0.8 = alert at 80%
}

export interface ProviderSummary {
  provider:      string;
  input_tokens:  number;
  output_tokens: number;
  total_tokens:  number;
  cost_usd:      number;
  call_count:    number;
}

export interface UsageSummary {
  total_input_tokens:  number;
  total_output_tokens: number;
  total_tokens:        number;
  total_cost_usd:      number;
  call_count:          number;
  by_provider:         ProviderSummary[];
}

const BUDGET_KEY = 'illum_ai_budget_config';
const DEFAULT_BUDGET: AIBudgetConfig = {
  daily_limit_usd:   1.00,
  monthly_limit_usd: 20.00,
  alert_threshold:   0.80,
};

function aggregate(records: AIUsageRecord[]): UsageSummary {
  const byProvider: Record<string, ProviderSummary> = {};
  let totalInput = 0, totalOutput = 0, totalCost = 0;

  for (const r of records) {
    totalInput  += r.input_tokens;
    totalOutput += r.output_tokens;
    totalCost   += r.cost_usd;
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = { provider: r.provider, input_tokens: 0, output_tokens: 0, total_tokens: 0, cost_usd: 0, call_count: 0 };
    }
    byProvider[r.provider].input_tokens  += r.input_tokens;
    byProvider[r.provider].output_tokens += r.output_tokens;
    byProvider[r.provider].total_tokens  += r.input_tokens + r.output_tokens;
    byProvider[r.provider].cost_usd      += r.cost_usd;
    byProvider[r.provider].call_count    += 1;
  }

  return {
    total_input_tokens:  totalInput,
    total_output_tokens: totalOutput,
    total_tokens:        totalInput + totalOutput,
    total_cost_usd:      totalCost,
    call_count:          records.length,
    by_provider:         Object.values(byProvider).sort((a, b) => b.cost_usd - a.cost_usd),
  };
}

export const AIUsageService = {
  loadBudget(): AIBudgetConfig {
    try {
      const raw = localStorage.getItem(BUDGET_KEY);
      if (raw) return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_BUDGET;
  },

  saveBudget(config: AIBudgetConfig): void {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
  },

  async getSummaryForSession(companyId: string, sessionId: string): Promise<UsageSummary> {
    const all = await AIUsageTracker.getAll(companyId, 500);
    return aggregate(all.filter(r => r.session_id === sessionId));
  },

  async getSummaryForDay(companyId: string, date: string): Promise<UsageSummary> {
    const all = await AIUsageTracker.getAll(companyId, 1000);
    return aggregate(all.filter(r => r.date === date));
  },

  async getSummaryForMonth(companyId: string, yearMonth: string): Promise<UsageSummary> {
    const all = await AIUsageTracker.getAll(companyId, 5000);
    return aggregate(all.filter(r => r.date.startsWith(yearMonth)));
  },

  async getFullSummary(companyId: string, sessionId?: string): Promise<{
    session:  UsageSummary;
    today:    UsageSummary;
    month:    UsageSummary;
    budget:   AIBudgetConfig;
    alerts:   { daily: boolean; monthly: boolean };
  }> {
    const all   = await AIUsageTracker.getAll(companyId, 5000);
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const budget = AIUsageService.loadBudget();

    const sessionRecords = sessionId ? all.filter(r => r.session_id === sessionId) : [];
    const todayRecords   = all.filter(r => r.date === today);
    const monthRecords   = all.filter(r => r.date.startsWith(month));

    const todaySummary = aggregate(todayRecords);
    const monthSummary = aggregate(monthRecords);

    return {
      session: aggregate(sessionRecords),
      today:   todaySummary,
      month:   monthSummary,
      budget,
      alerts: {
        daily:   budget.daily_limit_usd   > 0 && todaySummary.total_cost_usd   >= budget.daily_limit_usd   * budget.alert_threshold,
        monthly: budget.monthly_limit_usd > 0 && monthSummary.total_cost_usd   >= budget.monthly_limit_usd * budget.alert_threshold,
      },
    };
  },
};
