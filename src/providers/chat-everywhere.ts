// ══════════════════════════════════════════════════════════
// ChatEverywhere Provider (free, unlimited, 33 models)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

const CE_BASE = 'https://chateverywhere.app/api/chat';

export const chatEverywhere: Provider = {
  name: 'chat-everywhere',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const res = await fetch(CE_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: params.prompt }],
        prompt: params.system || 'You are a helpful assistant.',
        temperature: params.temperature || 0.7,
      }),
    });

    if (!res.ok) throw new Error(`ChatEverywhere error ${res.status}`);

    const text = await res.text();

    if (!text || text.trim().length === 0) {
      throw new Error('ChatEverywhere returned empty response');
    }

    return {
      success: true,
      text,
      provider: 'chat-everywhere',
      model: 'chateverywhere',
    };
  },
  tier: 1,
  type: 'chat',
};
