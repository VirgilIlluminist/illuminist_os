/**
 * OpenRouterProvider.ts — OpenRouter (access 200+ models via one API)
 * OpenAI-compatible format.
 */
import { OpenAIProvider } from './OpenAIProvider';
import { ProviderConfig } from './BaseProvider';

export class OpenRouterProvider extends OpenAIProvider {
  override readonly name        = 'openrouter';
  override readonly displayName = 'OpenRouter';
  override readonly models      = [
    'anthropic/claude-opus-4',
    'openai/gpt-4o',
    'google/gemini-2.5-pro',
    'meta-llama/llama-3.3-70b-instruct',
    'mistralai/mistral-large',
  ];

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: 'https://openrouter.ai/api/v1',
    });
  }
}
