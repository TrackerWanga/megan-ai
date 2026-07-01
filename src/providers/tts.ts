// ══════════════════════════════════════════════════════════
// Google Translate TTS Provider (free, unlimited)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

export const googleTTS: Provider = {
  name: 'google-tts',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const text = encodeURIComponent(params.prompt.substring(0, 200));
    const lang = params.language || 'en';

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${text}`;

    return {
      success: true,
      text: '',
      audioUrl: url,
      provider: 'google-tts',
      model: 'google-translate',
    };
  },
  tier: 1,
  type: 'tts',
};
