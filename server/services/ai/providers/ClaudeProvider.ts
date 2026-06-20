/**
 * ClaudeProvider.ts — Anthropic Claude Provider
 * Uses native fetch — no @anthropic-ai/sdk needed.
 */
import { BaseProvider, GenerateOptions, GenerateResult, ProviderConfig } from './BaseProvider';
import { logger } from '../../../utils/logger';

export class ClaudeProvider extends BaseProvider {
  readonly name        = 'claude';
  readonly displayName = 'Anthropic Claude';
  readonly models      = [
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ];

  constructor(config: ProviderConfig) {
    super(config);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = Date.now();
    if (!this.config.apiKey) throw new Error('Claude API key not configured');

    const model     = options.model || this.config.defaultModel;
    const messages  = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const systemMsg = options.systemPrompt ||
      options.messages.find(m => m.role === 'system')?.content;

    const body: Record<string, unknown> = {
      model,
      max_tokens:  options.maxTokens  || this.config.maxTokens,
      temperature: options.temperature ?? this.config.temperature,
      messages,
    };
    if (systemMsg) body.system = systemMsg;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data         = await response.json() as any;
    const text         = data.content?.[0]?.text || '';
    const inputTokens  = data.usage?.input_tokens  || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    logger.ai('Claude', `Generated ${outputTokens} tokens in ${Date.now() - start}ms`);

    return { text, inputTokens, outputTokens, model,
             provider: this.name, latencyMs: Date.now() - start,
             cost: this.estimateCost(inputTokens, outputTokens) };
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this.generate({ messages: [{ role: 'user', content: 'OK' }], maxTokens: 5 });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: unknown) {
      return { ok: false, latencyMs: Date.now() - start,
               error: err instanceof Error ? err.message : 'Unknown' };
    }
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // Claude Sonnet 4.6 pricing
    return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }
}
