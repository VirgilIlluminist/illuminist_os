/**
 * BaseProvider.ts — Abstract base class for all AI providers
 * Every provider (Gemini, OpenAI, Claude, OpenRouter) extends this.
 */

export interface ChatMessage {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOptions {
  messages:        ChatMessage[];
  systemPrompt?:   string;
  temperature?:    number;
  maxTokens?:      number;
  model?:          string;
}

export interface GenerateResult {
  text:         string;
  inputTokens:  number;
  outputTokens: number;
  model:        string;
  provider:     string;
  latencyMs:    number;
  cost?:        number;
}

export interface ProviderConfig {
  apiKey:       string;
  defaultModel: string;
  maxTokens:    number;
  temperature:  number;
  baseUrl?:     string;
}

export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly models: string[];
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract generate(options: GenerateOptions): Promise<GenerateResult>;
  abstract testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;

  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  getDefaultModel(): string {
    return this.config.defaultModel;
  }

  estimateCost(_inputTokens: number, _outputTokens: number): number {
    return 0; // Override in specific provider
  }
}
