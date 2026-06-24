/**
 * AIUsageTracker — core service untuk mencatat AI token usage.
 * Disimpan ke repository layer (localStorage → Supabase ready).
 * Dipanggil dari useAI hook setelah setiap response.
 */
import { getRepo, BaseRecord } from '../repositories';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIUsageRecord extends BaseRecord {
  session_id:    string;
  provider:      string;   // gemini | openai | claude | openrouter | offline
  model:         string;
  input_tokens:  number;
  output_tokens: number;
  cost_usd:      number;
  date:          string;   // YYYY-MM-DD
  context:       string;   // chat | insight | auto
}

// ─── Pricing table (USD per 1M tokens) ───────────────────────────────────────

const PRICING_PER_1M: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash':             { input: 0.10,  output: 0.40  },
  'gemini-2.0-flash-exp':         { input: 0.10,  output: 0.40  },
  'gemini-1.5-flash':             { input: 0.075, output: 0.30  },
  'gemini-1.5-flash-8b':          { input: 0.0375,output: 0.15  },
  'gemini-1.5-pro':               { input: 1.25,  output: 5.00  },
  'gpt-4o':                       { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':                  { input: 0.15,  output: 0.60  },
  'gpt-4-turbo':                  { input: 10.00, output: 30.00 },
  'claude-3-5-sonnet-20241022':   { input: 3.00,  output: 15.00 },
  'claude-3-5-haiku-20241022':    { input: 0.80,  output: 4.00  },
  'claude-3-opus-20240229':       { input: 15.00, output: 75.00 },
};

const PROVIDER_FALLBACK: Record<string, { input: number; output: number }> = {
  gemini:     { input: 0.10,  output: 0.40  },
  openai:     { input: 2.50,  output: 10.00 },
  claude:     { input: 3.00,  output: 15.00 },
  openrouter: { input: 1.00,  output: 3.00  },
  offline:    { input: 0,     output: 0     },
};

function estimateCost(provider: string, model: string, input: number, output: number): number {
  const p = PRICING_PER_1M[model] ?? PROVIDER_FALLBACK[provider] ?? { input: 1.00, output: 3.00 };
  return (input * p.input + output * p.output) / 1_000_000;
}

// ─── Tracker ──────────────────────────────────────────────────────────────────

export const AIUsageTracker = {
  async record(payload: {
    companyId:    string;
    sessionId:    string;
    provider:     string;
    model:        string;
    inputTokens:  number;
    outputTokens: number;
    cost?:        number;
    context?:     string;
  }): Promise<void> {
    if (!payload.companyId || payload.provider === 'offline') return;
    const cost = payload.cost ?? estimateCost(
      payload.provider, payload.model, payload.inputTokens, payload.outputTokens
    );
    await getRepo<AIUsageRecord>('ai_usage').create(payload.companyId, {
      session_id:    payload.sessionId,
      provider:      payload.provider,
      model:         payload.model,
      input_tokens:  payload.inputTokens,
      output_tokens: payload.outputTokens,
      cost_usd:      cost,
      date:          new Date().toISOString().slice(0, 10),
      context:       payload.context ?? 'chat',
    });
  },

  async getAll(companyId: string, limit = 500): Promise<AIUsageRecord[]> {
    const result = await getRepo<AIUsageRecord>('ai_usage').findAll(companyId, {
      orderBy: { column: 'created_at', direction: 'desc' },
      limit,
    });
    return result.data;
  },

  estimateCost,
};
