// ══════════════════════════════════════════════════════════
// Pollinations.ai Provider (free, unlimited)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

export const pollinationsChat: Provider = {
  name: 'pollinations-chat',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const sys = params.system
      ? `&system=${encodeURIComponent(params.system)}`
      : '';

    const res = await fetch(`https://text.pollinations.ai/${q}${sys}`);

    if (!res.ok) throw new Error(`Pollinations error ${res.status}`);

    const text = await res.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Pollinations returned empty response');
    }

    return {
      success: true,
      text,
      provider: 'pollinations-chat',
      model: 'pollinations',
    };
  },
  tier: 1,
  type: 'chat',
};

export const pollinationsImage: Provider = {
  name: 'pollinations-image',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const prompt = encodeURIComponent(params.prompt);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`;

    return {
      success: true,
      text: '',
      imageUrl: url,
      provider: 'pollinations-image',
      model: 'pollinations',
    };
  },
  tier: 1,
  type: 'image',
};
