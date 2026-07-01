// ══════════════════════════════════════════════════════════
// Siputzx Provider (free, unlimited)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

const SIPUTZX_BASE = 'https://api.siputzx.my.id/api/ai';

function stripThink(text: string): string {
  // Remove <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Also try to remove "Okay, the user wants..." thinking without tags
  cleaned = cleaned.replace(/^(Okay|Alright|Hmm|Let me|First|I need|I should|The user)[\s\S]*?\n\n/g, '');
  return cleaned.trim();
}

export const siputzxGLM: Provider = {
  name: 'siputzx-glm',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const sys = encodeURIComponent(params.system || 'You are a helpful assistant.');
    const temp = params.temperature || 0.7;

    const res = await fetch(
      `${SIPUTZX_BASE}/glm47flash?prompt=${q}&system=${sys}&temperature=${temp}`
    );
    const data = await res.json() as any;

    if (!data.status || !data.data?.response) {
      throw new Error(data.error || 'GLM request failed');
    }

    return {
      success: true,
      text: data.data.response,
      provider: 'siputzx-glm',
      model: 'glm-4.7-flash',
    };
  },
  tier: 1,
  type: 'chat',
};

export const siputzxQwen: Provider = {
  name: 'siputzx-qwen',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const sys = encodeURIComponent(params.system || 'You are a helpful assistant.');

    const res = await fetch(
      `${SIPUTZX_BASE}/qwq32b?prompt=${q}&system=${sys}`
    );
    const data = await res.json() as any;

    if (!data.status || !data.data?.response) {
      throw new Error(data.error || 'Qwen request failed');
    }

    const text = stripThink(data.data.response);

    return {
      success: true,
      text,
      provider: 'siputzx-qwen',
      model: 'qwq-32b',
    };
  },
  tier: 1,
  type: 'chat',
};

export const siputzxDeepSeek: Provider = {
  name: 'siputzx-deepseek',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const sys = encodeURIComponent(params.system || 'You are a helpful assistant.');

    const res = await fetch(
      `${SIPUTZX_BASE}/deepseekr1?prompt=${q}&system=${sys}`
    );
    const data = await res.json() as any;

    if (!data.status || !data.data?.response) {
      throw new Error(data.error || 'DeepSeek request failed');
    }

    const text = stripThink(data.data.response);

    return {
      success: true,
      text,
      provider: 'siputzx-deepseek',
      model: 'deepseek-r1',
    };
  },
  tier: 1,
  type: 'chat',
};

export const siputzxBible: Provider = {
  name: 'siputzx-bible',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);

    const res = await fetch(`${SIPUTZX_BASE}/bibleai?question=${q}`);
    const data = await res.json() as any;

    if (!data.status || !data.data?.results?.answer) {
      throw new Error(data.error || 'Bible AI request failed');
    }

    return {
      success: true,
      text: data.data.results.answer,
      provider: 'siputzx-bible',
      model: 'bible-ai',
    };
  },
  tier: 1,
  type: 'chat',
};

export const siputzxDuckAI: Provider = {
  name: 'siputzx-duckai',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const msg = encodeURIComponent(params.prompt);
    const sys = encodeURIComponent(params.system || 'You are a helpful assistant.');

    const res = await fetch(
      `${SIPUTZX_BASE}/duckai?message=${msg}&system=${sys}`
    );
    const data = await res.json() as any;

    if (!data.status) {
      throw new Error(data.error || 'DuckAI request failed');
    }

    return {
      success: true,
      text: data.data?.message || '',
      provider: 'siputzx-duckai',
      model: 'gpt-4o-mini',
    };
  },
  tier: 1,
  type: 'chat',
};
