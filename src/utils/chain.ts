// ══════════════════════════════════════════════════════════
// Provider Chain Runner
// ══════════════════════════════════════════════════════════

import { Provider, AIRequest, AIResponse } from '../types';
import { isProviderHealthy, recordProviderFailure, recordProviderSuccess } from './health';

export async function runChain(
  providers: Provider[],
  params: AIRequest,
  env?: any
): Promise<AIResponse> {
  const errors: string[] = [];

  const healthy = providers.filter((p) => isProviderHealthy(p.name));
  const ordered = healthy.length > 0 ? healthy : providers;

  for (const provider of ordered) {
    try {
      console.log(`[chain] Trying ${provider.name}...`);
      const start = Date.now();
      // Pass env to providers that need it (Workers AI, Gemini)
      const result = await provider.fn(params, env);
      const duration = Date.now() - start;

      recordProviderSuccess(provider.name);
      console.log(`[chain] ${provider.name} succeeded in ${duration}ms`);

      return {
        ...result,
        provider: provider.name,
        usage: {
          ...result.usage,
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
        },
      };
    } catch (error: any) {
      console.log(`[chain] ${provider.name} failed: ${error.message}`);
      recordProviderFailure(provider.name);
      errors.push(`${provider.name}: ${error.message}`);
    }
  }

  return {
    success: false,
    text: '',
    provider: 'none',
    model: 'none',
    error: `All providers failed: ${errors.join(' | ')}`,
  };
}
