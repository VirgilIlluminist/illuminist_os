/**
 * ai.service.ts — Frontend AI service
 * Communicates with the V12 AI Gateway backend.
 * Falls back gracefully if backend unavailable.
 */
import api, { APIClientError } from './client';

export interface ChatMessage {
  role:      'user' | 'assistant' | 'system';
  content:   string;
  timestamp?: string;
}

export interface ChatRequest {
  message:           string;
  sessionId?:        string;
  erpState?:         Record<string, unknown>;
  preferredProvider?:string;
  preferredModel?:   string;
}

export interface ChatResponse {
  text:         string;
  sessionId:    string;
  provider:     string;
  model:        string;
  inputTokens:  number;
  outputTokens: number;
  latencyMs:    number;
  cost?:        number;
  isOffline?:   boolean;
}

export interface ProviderStatus {
  name:        string;
  displayName: string;
  available:   boolean;
  models:      string[];
  defaultModel:string;
  isActive?:   boolean;
}

export interface AIStats {
  totalConversations: number;
  totalTokens:        number;
  totalCost:          string;
  memoryStats:        { activeSessions: number; companies: number };
}

const aiService = {
  // ─── Chat ───────────────────────────────────────────────────────────────
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      return await api.post<ChatResponse>('/api/ai/chat', request);
    } catch (err) {
      // Graceful fallback if backend unavailable
      if (err instanceof APIClientError && err.statusCode === 0) {
        return {
          text:         'AI backend tidak tersedia. Pastikan server berjalan dan API key dikonfigurasi di Settings.',
          sessionId:    request.sessionId || 'offline',
          provider:     'offline',
          model:        'offline',
          inputTokens:  0,
          outputTokens: 0,
          latencyMs:    0,
          isOffline:    true,
        };
      }
      throw err;
    }
  },

  // ─── Providers ─────────────────────────────────────────────────────────
  async getProviders(): Promise<{ providers: ProviderStatus[]; usage: unknown[] }> {
    return api.get('/api/ai/providers');
  },

  async testProvider(name: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    return api.post(`/api/ai/providers/${name}/test`, {});
  },

  async setActiveProvider(provider: string): Promise<void> {
    await api.post('/api/ai/providers/active', { provider });
  },

  // ─── Memory ────────────────────────────────────────────────────────────
  async getMemoryStats(): Promise<{ activeSessions: number; companies: number }> {
    return api.get('/api/ai/memory/stats');
  },

  async clearSession(sessionId: string): Promise<void> {
    await api.delete(`/api/ai/memory/${sessionId}`);
  },

  async addBusinessRule(rule: string, companyId?: string): Promise<void> {
    await api.post('/api/ai/memory/rules', { rule, companyId });
  },

  // ─── Stats ─────────────────────────────────────────────────────────────
  async getStats(): Promise<AIStats> {
    return api.get('/api/ai/stats');
  },

  async getLogs(limit = 50): Promise<unknown[]> {
    return api.get(`/api/ai/logs?limit=${limit}`);
  },

  // ─── Health ────────────────────────────────────────────────────────────
  async checkHealth(): Promise<{ status: string; ai: { status: string } }> {
    return api.get('/health');
  },
};

export default aiService;
