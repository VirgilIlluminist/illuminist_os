/**
 * GeminiProvider.ts — Google Gemini AI Provider
 * Preserves existing Gemini functionality from V11 server.ts
 */
import { GoogleGenAI } from '@google/genai';
import { BaseProvider, GenerateOptions, GenerateResult, ProviderConfig } from './BaseProvider';
import { logger } from '../../../utils/logger';

export class GeminiProvider extends BaseProvider {
  readonly name        = 'gemini';
  readonly displayName = 'Google Gemini';
  readonly models      = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  private client: GoogleGenAI | null = null;

  constructor(config: ProviderConfig) {
    super(config);
    if (config.apiKey) {
      this.client = new GoogleGenAI({
        apiKey: config.apiKey,
        httpOptions: { headers: { 'User-Agent': 'nevaeh-ai-os-v12' } }
      });
    }
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = Date.now();
    if (!this.client) throw new Error('Gemini API key not configured');

    const model       = options.model || this.config.defaultModel;
    const temperature = options.temperature ?? this.config.temperature;

    // Build contents array for Gemini format
    const contents = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    // System message from either first system msg or systemPrompt param
    const systemMsg = options.systemPrompt ||
      options.messages.find(m => m.role === 'system')?.content || '';

    try {
      const response = await this.client.models.generateContent({
        model,
        contents,
        config: {
          temperature,
          maxOutputTokens: options.maxTokens || this.config.maxTokens,
          ...(systemMsg ? { systemInstruction: systemMsg } : {}),
        },
      });

      const text         = response.text || '';
      const inputTokens  = response.usageMetadata?.promptTokenCount     || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount  || 0;

      logger.ai('Gemini', `Generated ${outputTokens} tokens in ${Date.now() - start}ms`);

      return {
        text,
        inputTokens,
        outputTokens,
        model,
        provider:  this.name,
        latencyMs: Date.now() - start,
        cost:      this.estimateCost(inputTokens, outputTokens),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gemini error';
      logger.error('Gemini', `Generation failed: ${msg}`);
      throw new Error(`Gemini: ${msg}`);
    }
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.generate({
        messages: [{ role: 'user', content: 'Say: OK' }],
        maxTokens: 10,
      });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: unknown) {
      return { ok: false, latencyMs: Date.now() - start,
               error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 2.5 Flash pricing (per 1M tokens as of 2025)
    return (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000;
  }
}
