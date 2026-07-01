// ══════════════════════════════════════════════════════════
// Cloudflare Workers AI Provider — All Free Models
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

// ─── Chat Models ───────────────────────────────────────────────────────────

export const workersAIChat: Provider = {
  name: 'workers-ai-llama',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: params.system || 'You are a helpful assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2048,
    });
    return {
      success: true,
      text: response.choices?.[0]?.message?.content || response.response || '',
      provider: 'workers-ai-llama',
      model: 'llama-3.2-3b',
    };
  },
  tier: 1, type: 'chat',
};

export const workersAIGLM: Provider = {
  name: 'workers-ai-glm',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const response = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
      messages: [
        { role: 'system', content: params.system || 'You are a helpful assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 2048,
    });
    return {
      success: true,
      text: response.choices?.[0]?.message?.content || response.response || '',
      provider: 'workers-ai-glm',
      model: 'glm-4.7-flash',
    };
  },
  tier: 1, type: 'chat',
};

export const workersAIDeepSeek: Provider = {
  name: 'workers-ai-deepseek',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const response = await env.AI.run('@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', {
      messages: [
        { role: 'system', content: params.system || 'You are a helpful assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 4096,
    });
    let text = response.choices?.[0]?.message?.content || response.response || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return { success: true, text, provider: 'workers-ai-deepseek', model: 'deepseek-r1-distill-qwen-32b' };
  },
  tier: 1, type: 'chat',
};

export const workersAIQwen: Provider = {
  name: 'workers-ai-qwen',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const response = await env.AI.run('@cf/qwen/qwq-32b', {
      messages: [
        { role: 'system', content: params.system || 'You are a helpful assistant.' },
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 4096,
    });
    let text = response.choices?.[0]?.message?.content || response.response || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return { success: true, text, provider: 'workers-ai-qwen', model: 'qwq-32b' };
  },
  tier: 1, type: 'chat',
};

// ─── Vision / OCR Models ───────────────────────────────────────────────────

export const workersAIVision: Provider = {
  name: 'workers-ai-llava',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    try {
      const imageResponse = await fetch(params.imageUrl!);
      if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.status}`);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageArray = [...new Uint8Array(imageBuffer)];
      
      const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: imageArray,
        prompt: params.prompt || 'Describe this image in detail.',
        max_tokens: params.maxTokens || 512,
      });
      return {
        success: true,
        text: response.description || response.response || '',
        provider: 'workers-ai-llava',
        model: 'llava-1.5-7b',
      };
    } catch (err: any) {
      throw new Error(`Llava failed: ${err.message}`);
    }
  },
  tier: 1, type: 'vision',
};

// ─── TTS ───────────────────────────────────────────────────────────────────

export const workersAITTS: Provider = {
  name: 'workers-ai-tts',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    try {
      const response = await env.AI.run('@cf/myshell-ai/melotts', {
        prompt: params.prompt,
        language: params.language || 'EN',
      });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.audio)));
      return { success: true, text: '', audioUrl: `data:audio/mp3;base64,${base64}`, provider: 'workers-ai-melotts', model: 'melotts' };
    } catch {
      const response = await env.AI.run('@cf/deepgram/aura-2-en', { prompt: params.prompt });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.audio)));
      return { success: true, text: '', audioUrl: `data:audio/mp3;base64,${base64}`, provider: 'workers-ai-aura', model: 'aura-2-en' };
    }
  },
  tier: 1, type: 'tts',
};

// ─── STT ───────────────────────────────────────────────────────────────────

export const workersAISTT: Provider = {
  name: 'workers-ai-stt',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const audioResponse = await fetch(params.audioUrl!);
    const audioBuffer = await audioResponse.arrayBuffer();
    const response = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: [...new Uint8Array(audioBuffer)],
    });
    return { success: true, text: response.text || response.transcription || '', provider: 'workers-ai-whisper', model: 'whisper-large-v3-turbo' };
  },
  tier: 1, type: 'stt',
};

// ─── Image Generation ──────────────────────────────────────────────────────

export const workersAIImage: Provider = {
  name: 'workers-ai-image',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    try {
      const response = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt: params.prompt, num_steps: 4 });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.image)));
      return { success: true, text: '', imageUrl: `data:image/png;base64,${base64}`, provider: 'workers-ai-flux', model: 'flux-1-schnell' };
    } catch {
      const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', { prompt: params.prompt, num_steps: 20 });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.image)));
      return { success: true, text: '', imageUrl: `data:image/png;base64,${base64}`, provider: 'workers-ai-sdxl', model: 'stable-diffusion-xl' };
    }
  },
  tier: 1, type: 'image',
};

// ─── Translation ───────────────────────────────────────────────────────────

export const workersAITranslate: Provider = {
  name: 'workers-ai-translate',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const response = await env.AI.run('@cf/meta/m2m100-1.2b', {
      text: params.prompt,
      source_lang: params.language || 'en',
      target_lang: params.system || 'es',
    });
    return { success: true, text: response.translated_text || response.translation || '', provider: 'workers-ai-m2m100', model: 'm2m100-1.2b' };
  },
  tier: 1, type: 'chat',
};
