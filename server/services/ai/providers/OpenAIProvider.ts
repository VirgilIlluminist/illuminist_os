/**
 * OpenAIProvider.ts — OpenAI GPT Provider
 * Uses native fetch — no openai package needed.
 */
import { BaseProvider, GenerateOptions, GenerateResult, ProviderConfig } from './BaseProvider';
import { logger } from '../../../utils/logger';

export class OpenAIProvider extends BaseProvider {
  readonly name: string = 'openai';
  readonly displayName: string = 'OpenAI GPT';
  readonly models      = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ];

  private readonly baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = Date.now();
    if (!this.config.apiKey) throw new Error('OpenAI API key not configured');

    const model = options.model || this.config.defaultModel;
    const msgs  = options.messages.map(m => ({
      role:    m.role,
      content: m.content,
    }));

    if (options.systemPrompt) {
      msgs.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages:    msgs,
        temperature: options.temperature ?? this.config.temperature,
        max_tokens:  options.maxTokens   || this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data         = await response.json() as any;
    const text         = data.choices?.[0]?.message?.content || '';
    const inputTokens  = data.usage?.prompt_tokens     || 0;
    const outputTokens = data.usage?.completion_tokens || 0;

    logger.ai('OpenAI', `Generated ${outputTokens} tokens in ${Date.now() - start}ms`);

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
    // GPT-4o pricing
    return (inputTokens * 2.5 + outputTokens * 10) / 1_000_000;
  }
}
