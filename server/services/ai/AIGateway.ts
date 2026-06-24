/**
 * AIGateway.ts — Central AI Gateway
 * V12 Architecture: AI → AIGateway → ToolRegistry → Business Data
 *
 * Rules:
 * 1. AI never accesses database directly
 * 2. All data access through Tool Registry
 * 3. All actions require appropriate permission level
 * 4. All conversations logged
 * 5. Falls back gracefully if AI unavailable
 */
import { providerManager }        from './ProviderManager';
import { memoryManager }          from './MemoryManager';
import toolRegistry, { ToolContext, ERPStateSnapshot } from '../../tools/index';
import { logger }                 from '../../utils/logger';
import { ENV }                    from '../../config/env';

export interface ChatRequest {
  message:           string;
  sessionId:         string;
  userId:            string;
  companyId:         string;
  aiLevel:           number;
  erpState?:         ERPStateSnapshot;
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
  toolsUsed?:   string[];
  isOffline?:   boolean;
}

// AI OS identity prompt — preserved from V11, enhanced for V12
const SYSTEM_IDENTITY = `You are ILLUMINIST AI, the Chief of Staff for ILLUMINIST OS — an AI-powered multi-business operating system for a founder running several businesses (fashion, coffee, retail, agency, property, personal finance, and more) under one holding.

You adapt to whichever business the owner is currently working in. Never assume a single industry; read the active business context from the tool results and respond accordingly.

Your capabilities:
- Cross-business and per-business analysis of the data provided through tool results
- Strategic recommendations for inventory, production, sales, marketing, and operations
- Financial analysis, margins, and cashflow insights
- Executive summaries across the whole holding when asked
- Risk identification, proactive alerts, and mitigation strategies

Your communication style:
- Precise, data-driven, professional
- Use markdown formatting for readability
- Always cite specific IDs, amounts, and percentages
- Be direct and actionable in recommendations
- Never guess — only analyze data actually provided

CRITICAL RULES:
1. Never fabricate or hallucinate data
2. If data is not in the context, say so clearly
3. For any action that modifies data (creating POs, updating stock), ALWAYS ask for explicit approval
4. Respect user's AI permission level
5. Keep conversations in the configured language`;

class AIGateway {
  private conversationLog: Array<{
    id:        string;
    timestamp: string;
    sessionId: string;
    userId:    string;
    message:   string;
    response:  string;
    provider:  string;
    tokens:    number;
    cost:      number;
  }> = [];

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start    = Date.now();
    const toolCtx: ToolContext = {
      userId:    request.userId,
      companyId: request.companyId,
      aiLevel:   request.aiLevel,
      erpState:  request.erpState,
    };

    // 1. Check if AI is available — manual-first principle
    const hasProvider = providerManager.getStatus().some(p => p.available);
    if (!hasProvider) {
      return this.offlineFallback(request, toolCtx);
    }

    // 2. Build context from tools
    const toolContext = await this.gatherToolContext(toolCtx);

    // 3. Get conversation history
    const history = memoryManager.getHistory(request.sessionId);

    // 4. Get long-term memory for this company
    const longTermMem = memoryManager.formatForPrompt(request.companyId);

    // 5. Build system prompt with live data
    const systemPrompt = this.buildSystemPrompt(toolContext, longTermMem, request.aiLevel);

    // 6. Build messages array
    const messages = [
      ...history,
      { role: 'user' as const, content: request.message },
    ];

    // 7. Generate response
    let result;
    try {
      result = await providerManager.generate({
        messages,
        systemPrompt,
        preferredProvider: request.preferredProvider,
        model: request.preferredModel,
      });
    } catch (err: unknown) {
      logger.error('AIGateway', 'Generation failed, using offline fallback');
      return this.offlineFallback(request, toolCtx);
    }

    // 8. Store in memory
    memoryManager.addMessage(request.sessionId, { role: 'user',      content: request.message   });
    memoryManager.addMessage(request.sessionId, { role: 'assistant', content: result.text        });

    // 9. Log conversation
    this.logConversation(request, result);

    logger.ai('AIGateway', `Chat complete — ${result.outputTokens} tokens, ${Date.now()-start}ms, cost: $${result.cost?.toFixed(6)}`);

    return {
      text:         result.text,
      sessionId:    request.sessionId,
      provider:     result.provider,
      model:        result.model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs:    Date.now() - start,
      cost:         result.cost,
      toolsUsed:    Object.keys(toolContext),
    };
  }

  private async gatherToolContext(ctx: ToolContext): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {};
    const readTools = toolRegistry.getByLevel(ctx.aiLevel).filter(t => t.category !== 'write');

    await Promise.allSettled(
      readTools.map(async tool => {
        const result = await toolRegistry.execute(tool.name, {}, ctx);
        if (result.success) context[tool.name] = result.data;
      })
    );
    return context;
  }

  private buildSystemPrompt(toolContext: Record<string, unknown>, longTermMem: string, level: number): string {
    const toolsAvailable = toolRegistry.formatForPrompt(level);
    const dataContext    = Object.entries(toolContext)
      .map(([k, v]) => `### ${k}\n${JSON.stringify(v, null, 2)}`)
      .join('\n\n');

    return [
      SYSTEM_IDENTITY,
      longTermMem ? `\n## Company Memory\n${longTermMem}` : '',
      `\n## Available Tools\n${toolsAvailable}`,
      `\n## Current Business Data\n${dataContext}`,
    ].filter(Boolean).join('\n');
  }

  private offlineFallback(request: ChatRequest, ctx: ToolContext): ChatResponse {
    const state   = ctx.erpState;
    const matCount= (state?.materials   as any[])?.length || 0;
    const prodCount=(state?.products    as any[])?.length || 0;
    const salesCnt =(state?.sales       as any[])?.length || 0;

    const text = `### ILLUMINIST AI — Mode Offline

Tidak ada provider AI yang terkonfigurasi saat ini. Sistem bisnis Anda tetap berjalan normal — AI adalah lapisan tambahan, bukan inti operasional.

**Status Sistem Lokal:**
- Bahan Baku: ${matCount} material terdaftar
- Produk Aktif: ${prodCount} produk
- Transaksi Penjualan: ${salesCnt} entri

**Cara Mengaktifkan AI:**
Masuk ke **Pengaturan → AI Settings** dan tambahkan minimal satu API key:
- Google Gemini (Gratis mulai dari \`GEMINI_API_KEY\`)
- OpenAI GPT (\`OPENAI_API_KEY\`)
- Anthropic Claude (\`CLAUDE_API_KEY\`)

_Pesan Anda: "${request.message.slice(0, 100)}..."_`;

    return {
      text, sessionId: request.sessionId, provider: 'offline',
      model: 'offline', inputTokens: 0, outputTokens: 0,
      latencyMs: 0, isOffline: true,
    };
  }

  private logConversation(req: ChatRequest, result: { text: string; provider: string; outputTokens: number; cost?: number }) {
    if (this.conversationLog.length > 5000) this.conversationLog.shift();
    this.conversationLog.push({
      id:        `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sessionId: req.sessionId,
      userId:    req.userId,
      message:   req.message.slice(0, 200),
      response:  result.text.slice(0, 500),
      provider:  result.provider,
      tokens:    result.outputTokens,
      cost:      result.cost || 0,
    });
  }

  getConversationLog(limit = 50) {
    return this.conversationLog.slice(-limit);
  }

  getStats() {
    const totalCost   = this.conversationLog.reduce((s, l) => s + l.cost, 0);
    const totalTokens = this.conversationLog.reduce((s, l) => s + l.tokens, 0);
    return {
      totalConversations: this.conversationLog.length,
      totalTokens,
      totalCost: totalCost.toFixed(6),
      memoryStats: memoryManager.getStats(),
    };
  }
}

export const aiGateway = new AIGateway();
