// ══════════════════════════════════════════════════════════
// Gemini API Provider (15 RPM, last resort)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash-lite';

export const geminiChat: Provider = {
  name: 'gemini-api',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const key = env?.GEMINI_API_KEY || '';

    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: params.system || 'You are a helpful assistant.' }],
          },
          contents: [
            {
              parts: [{ text: params.prompt }],
            },
          ],
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.maxTokens || 2048,
          },
        }),
      }
    );

    const data = await res.json() as any;

    if (data.error) {
      throw new Error(data.error.message || 'Gemini API error');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      text,
      provider: 'gemini-api',
      model: MODEL,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  },
  tier: 3,
  type: 'chat',
};

export const geminiVision: Provider = {
  name: 'gemini-api-vision',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const key = env?.GEMINI_API_KEY || '';

    const imageResponse = await fetch(params.imageUrl!);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(imageBuffer))
    );

    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: params.prompt || 'Describe this image in detail.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json() as any;

    if (data.error) {
      throw new Error(data.error.message || 'Gemini Vision error');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      text,
      provider: 'gemini-api-vision',
      model: MODEL,
    };
  },
  tier: 3,
  type: 'vision',
};
