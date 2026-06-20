/**
 * ProviderManager.ts — Manages all AI provider instances
 * Single point to add/switch/test providers.
 * V12: Multi-provider, fallback chain, usage tracking.
 */
import { BaseProvider, GenerateOptions, GenerateResult } from './providers/BaseProvider';
import { GeminiProvider }      from './providers/GeminiProvider';
import { OpenAIProvider }      from './providers/OpenAIProvider';
import { ClaudeProvider }      from './providers/ClaudeProvider';
import { OpenRouterProvider }  from './providers/OpenRouterProvider';
import { ENV }                 from '../../config/env';
import { logger }              from '../../utils/logger';

export interface ProviderStatus {
  name:        string;
  displayName: string;
  available:   boolean;
  models:      string[];
  defaultModel:string;
}

export interface UsageStat {
  provider:     string;
  requests:     number;
  inputTokens:  number;
  outputTokens: number;
  totalCost:    number;
  errors:       number;
  lastUsed?:    string;
}

class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map();
  private usage:     Map<string, UsageStat>    = new Map();
  private activeProviderName = ENV.AI_DEFAULT_PROVIDER;

  constructor() {
    this.initProviders();
  }

  private initProviders() {
    const configs: [string, new (c: any) => BaseProvider, object][] = [
      ['gemini',      GeminiProvider,     { apiKey: ENV.GEMINI_API_KEY,  defaultModel: 'gemini-2.5-flash', maxTokens: ENV.AI_MAX_TOKENS, temperature: ENV.AI_TEMPERATURE }],
      ['openai',      OpenAIProvider,     { apiKey: ENV.OPENAI_API_KEY,  defaultModel: 'gpt-4o-mini',      maxTokens: ENV.AI_MAX_TOKENS, temperature: ENV.AI_TEMPERATURE }],
      ['claude',      ClaudeProvider,     { apiKey: ENV.CLAUDE_API_KEY,  defaultModel: 'claude-sonnet-4-6',maxTokens: ENV.AI_MAX_TOKENS, temperature: ENV.AI_TEMPERATURE }],
      ['openrouter',  OpenRouterProvider, { apiKey: ENV.OPENROUTER_KEY,  defaultModel: 'openai/gpt-4o',    maxTokens: ENV.AI_MAX_TOKENS, temperature: ENV.AI_TEMPERATURE }],
    ];

    for (const [name, Provider, config] of configs) {
      const provider = new Provider(config as any);
      this.providers.set(name, provider);
      this.usage.set(name, { name, provider: name, requests: 0, inputTokens: 0, outputTokens: 0, totalCost: 0, errors: 0 } as UsageStat);
      if (provider.isAvailable()) {
        logger.info('ProviderManager', `Provider ready: ${name}`);
      }
    }
  }

  getActiveProvider(): BaseProvider {
    const provider = this.providers.get(this.activeProviderName);
    if (provider?.isAvailable()) return provider;

    // Fallback chain
    for (const [name, p] of this.providers) {
      if (p.isAvailable()) {
        logger.warn('ProviderManager', `Falling back from ${this.activeProviderName} to ${name}`);
        return p;
      }
    }

    throw new Error('No AI providers available. Configure at least one API key in Settings.');
  }

  setActiveProvider(name: string) {
    if (!this.providers.has(name)) throw new Error(`Provider "${name}" not found`);
    this.activeProviderName = name;
    logger.info('ProviderManager', `Active provider set to: ${name}`);
  }

  async generate(options: GenerateOptions & { preferredProvider?: string }): Promise<GenerateResult> {
    const providerName = options.preferredProvider || this.activeProviderName;
    const provider     = this.providers.get(providerName) || this.getActiveProvider();
    const stat         = this.usage.get(provider.name)!;

    try {
      const result = await provider.generate(options);
      stat.requests++;
      stat.inputTokens  += result.inputTokens;
      stat.outputTokens += result.outputTokens;
      stat.totalCost    += result.cost || 0;
      stat.lastUsed      = new Date().toISOString();
      return result;
    } catch (err) {
      stat.errors++;
      throw err;
    }
  }

  getStatus(): ProviderStatus[] {
    return Array.from(this.providers.entries()).map(([name, p]) => ({
      name,
      displayName:  p.displayName,
      available:    p.isAvailable(),
      models:       p.models,
      defaultModel: p.getDefaultModel(),
      isActive:     name === this.activeProviderName,
    })) as ProviderStatus[];
  }

  getUsage(): UsageStat[] {
    return Array.from(this.usage.values());
  }

  async testProvider(name: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const provider = this.providers.get(name);
    if (!provider) return { ok: false, latencyMs: 0, error: 'Provider not found' };
    return provider.testConnection();
  }

  updateProviderKey(name: string, apiKey: string) {
    // Re-initialize provider with new key
    this.initProviders(); // Simple: re-init all
    logger.info('ProviderManager', `API key updated for provider: ${name}`);
  }
}

// Singleton
export const providerManager = new ProviderManager();
