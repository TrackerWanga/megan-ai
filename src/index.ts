// ══════════════════════════════════════════════════════════
// Megan AI Platform v1.0 — Main Worker
// ══════════════════════════════════════════════════════════

import { Env, AIRequest, User } from './types';
import { authenticate } from './middleware/auth';
import { runChain } from './utils/chain';
import { getProviderHealthStatus } from './utils/health';
import { fbGet, fbPatch } from './utils/firebase';
import { DEFAULT_SYSTEM_PROMPT } from './utils/system';
import { logRequest, extractIPInfo } from './utils/tracking';
import { saveToUserStorage, testStorageConnection } from './utils/storage';
import { handleAdmin, getAdminEndpoints } from './admin';
import { saveMemory } from './memory/store';
import { retrieveMemory } from './memory/retrieve';
import { handleMemoryRoutes } from './routes/memory';
import { landingPage } from './pages/landing';
import { playgroundPage } from './pages/playground';
import { gamesPage } from './pages/games';

import { workersAIChat, workersAIGLM, workersAIDeepSeek, workersAIQwen, workersAIVision, workersAITTS, workersAISTT, workersAIImage, workersAITranslate } from './providers/workers-ai';
import { siputzxGLM, siputzxQwen, siputzxDeepSeek, siputzxBible, siputzxDuckAI } from './providers/siputzx';
import { chatEverywhere } from './providers/chat-everywhere';
import { pollinationsChat, pollinationsImage } from './providers/pollinations';
import { geminiChat, geminiVision } from './providers/gemini';
import { duckduckgoSearch, gnewsSearch } from './providers/search';
import { googleTTS } from './providers/tts';
import { meganPersonas, getPersona, getPersonasByCategory, getPersonasByCountry } from './personas';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

function cors(r: Response): Response { Object.entries(corsHeaders).forEach(([k, v]) => r.headers.set(k, v)); return r; }
function ok(data: any, status = 200) { return cors(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })); }
function error(msg: string, status = 400) { return cors(new Response(JSON.stringify({ success: false, error: msg }), { status, headers: { 'Content-Type': 'application/json' } })); }

async function handleAI(request: Request, env: Env, user: User, feature: 'chat'|'vision'|'tts'|'stt'|'image'|'search', body: any): Promise<Response> {
  const params: AIRequest = {
    prompt: body.prompt||body.q||body.text||'', system: body.system||body.system_prompt||DEFAULT_SYSTEM_PROMPT,
    temperature: body.temperature||0.7, imageUrl: body.image_url||body.imageUrl||'',
    audioUrl: body.audio_url||body.audioUrl||'', country: body.country||user.country||'KE',
    language: body.language||body.lang||'en', maxTokens: body.max_tokens||2048,
  };
  if (!params.prompt && feature !== 'image') return error('Parameter "prompt" or "q" is required');
  let providers: any[] = [];
  switch (feature) {
    case 'chat': providers = [pollinationsChat,chatEverywhere,siputzxGLM,siputzxQwen,workersAIGLM,workersAIQwen,workersAIDeepSeek,workersAIChat,siputzxDeepSeek,geminiChat]; break;
    case 'vision': providers = [workersAIVision,geminiVision]; break;
    case 'tts': providers = [workersAITTS,googleTTS]; break;
    case 'stt': providers = [workersAISTT]; break;
    case 'image': providers = [workersAIImage,pollinationsImage]; break;
    case 'search': providers = [duckduckgoSearch,gnewsSearch]; break;
  }
  const start = Date.now();
  const result = await runChain(providers, params, env);
  return ok({ success:result.success, text:result.text, audio_url:result.audioUrl, image_url:result.imageUrl, provider:result.provider, model:result.model, response_ms:Date.now()-start, timestamp:new Date().toISOString() });
}

async function fetchPageText(url: string, maxLen = 5000): Promise<string> {
  try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); return (await r.text()).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().substring(0,maxLen); }
  catch { return ''; }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    try {
      // ═══ PUBLIC PAGES ═══
      if (path === '/') {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Megan AI</title>
  <meta http-equiv="refresh" content="0;url=https://playground.ai.megan.qzz.io">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #06060E; color: #E8E8FF; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
    .card { background: rgba(108,99,255,0.04); border: 1px solid rgba(108,99,255,0.1); border-radius: 20px; padding: 40px; max-width: 500px; }
    h1 { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6C63FF, #00D4FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; }
    p { color: rgba(232,232,255,0.5); font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6C63FF, #8B83FF); color: #fff; font-weight: 700; font-size: 14px; border-radius: 12px; text-decoration: none; transition: all 0.3s; }
    .btn:hover { box-shadow: 0 0 30px rgba(108,99,255,0.4); transform: translateY(-2px); }
    .links { margin-top: 16px; font-size: 11px; color: rgba(232,232,255,0.3); }
    .links a { color: #6C63FF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Megan AI</h1>
    <p>Redirecting to the AI Playground...</p>
    <a href="https://playground.ai.megan.qzz.io" class="btn">🚀 Go to Playground</a>
    <div class="links">
      <a href="/api/ai/chat?prompt=Hello&api_key=megan_admin_master">API</a> &bull; 
      <a href="/health">Health</a> &bull;
      <a href="/api/endpoints">Endpoints</a>
    </div>
  </div>
</body>
</html>`;
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }
      if (path === '/playground') return new Response(playgroundPage(), { headers: { 'Content-Type': 'text/html' } });
      if (path === '/games') return new Response(gamesPage(), { headers: { 'Content-Type': 'text/html' } });
      if (path === '/login') return Response.redirect('https://megan-coins.trackerwanga254.workers.dev/api/auth/login', 302);
      if (path === '/signup') return Response.redirect('https://megan-coins.trackerwanga254.workers.dev/api/auth/signup', 302);

      // ═══ PUBLIC API ═══
            // ═══ PUBLIC TEST ENDPOINT (no API key needed) ═══
      // Uses server-side master key so anyone can try AI instantly
      if (path === '/api/test/chat' && method === 'GET') {
        const prompt = url.searchParams.get('prompt') || url.searchParams.get('q') || 'Hello';
        const provider = url.searchParams.get('provider') || 'pollinations';
        try {
          let text = '';
          if (provider === 'pollinations') {
            const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
            text = await res.text();
          } else if (provider === 'chateverywhere') {
            const res = await fetch('https://chateverywhere.app/api/chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], prompt: 'You are a helpful assistant.', temperature: 0.7 }),
            });
            text = await res.text();
          } else {
            const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
            text = await res.text();
          }
          return ok({ success: true, text, provider, model: provider, note: 'Testing with Megan server key. Get your own key at /dashboard for unlimited access.' });
        } catch (e: any) {
          return error('AI service temporarily unavailable. Try again.');
        }
      }

      // ═══ HEALTH ═══
      if (path === '/health') return ok({ status:'ok', name:'Megan AI Platform', version:'1.0.0' });
      if (path === '/api/status') return ok({ status:'ok', providers:getProviderHealthStatus() });
      if (path === '/api/endpoints') return ok({
        pages: { home:'/', playground:'/playground', games:'/games', login:'/login', signup:'/signup' },
        chat: ['/api/ai/chat','/api/ai/reason','/api/ai/code','/api/ai/translate','/api/ai/bible'],
        models: ['/api/models/chat','/api/models/vision','/api/models/tts','/api/models/stt','/api/models/image'],
        vision: ['/api/vision/describe','/api/vision/ocr','/api/vision/analyze','/api/vision/handwriting'],
        audio: ['/api/audio/tts','/api/audio/stt','/api/audio/voices'],
        image: ['/api/image/generate','/api/image/search'],
        web: ['/api/web/search','/api/web/news','/api/web/fetch','/api/web/summarize','/api/web/research'],
        text: ['/api/text/summarize','/api/text/rewrite','/api/text/sentiment','/api/text/extract','/api/text/grammar','/api/text/moderate','/api/text/expand','/api/text/keywords'],
        personas: '/api/megan/:persona', chains: ['/api/chain/read-aloud'],
        storage: ['/api/storage/config','/api/storage/test','/api/storage/remove'],
        memory: ['/api/memory/save','/api/memory/get','/api/memory/del','/api/memory/keys'],
        admin: getAdminEndpoints(), profile: '/api/me',
      });
      if (path === '/api/models/chat' && method === 'GET') return ok({ models: ['llama-3.2-3b','glm-4.7-flash','deepseek-r1','qwq-32b'] });
      if (path === '/api/models/vision' && method === 'GET') return ok({ models: ['llava-1.5-7b','llama-3.2-11b-vision'] });
      if (path === '/api/models/tts' && method === 'GET') return ok({ models: ['melotts','aura-2-en'] });

      // ═══ AUTH ═══
      let reqBody: any = {};
      try { if (method !== 'GET') reqBody = await request.clone().json(); } catch {}
      const auth = await authenticate(request, env, reqBody);
      if (!auth.user) return error(auth.error||'Unauthorized', auth.status||401);
      const user = auth.user;

            // ═══ DEDICATED PROVIDER ENDPOINTS ═══
      // Pollinations — fastest, free, no key needed
      if (path === '/api/ai/pollinations' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(p)}${b.system ? '?system=' + encodeURIComponent(b.system) : ''}`);
        return ok({ success: true, text: await res.text(), provider: 'pollinations', model: 'pollinations' });
      }

      // ChatEverywhere — 33 models, free
      if (path === '/api/ai/chateverywhere' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const ceRes = await fetch('https://chateverywhere.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: p }], prompt: b.system || 'You are a helpful assistant.', temperature: b.temperature || 0.7 }),
        });
        return ok({ success: true, text: await ceRes.text(), provider: 'chateverywhere', model: 'chateverywhere' });
      }

      // Siputzx GLM
      if (path === '/api/ai/siputzx/glm' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const q = encodeURIComponent(p);
        const sys = encodeURIComponent(b.system || 'You are a helpful assistant.');
        const res = await fetch(`https://api.siputzx.my.id/api/ai/glm47flash?prompt=${q}&system=${sys}&temperature=${b.temperature || 0.7}`);
        const data = await res.json() as any;
        return ok({ success: true, text: data.data?.response || data.response || '', provider: 'siputzx-glm', model: 'glm-4.7-flash' });
      }

      // Siputzx Qwen
      if (path === '/api/ai/siputzx/qwen' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const q = encodeURIComponent(p);
        const sys = encodeURIComponent(b.system || 'You are a helpful assistant.');
        const res = await fetch(`https://api.siputzx.my.id/api/ai/qwq32b?prompt=${q}&system=${sys}`);
        const data = await res.json() as any;
        let text = data.data?.response || data.response || '';
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return ok({ success: true, text, provider: 'siputzx-qwen', model: 'qwq-32b' });
      }

      // Workers AI GLM
      if (path === '/api/ai/workers/glm' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const response = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
          messages: [{ role: 'system', content: b.system || 'You are a helpful assistant.' }, { role: 'user', content: p }],
          temperature: b.temperature || 0.7, max_tokens: b.max_tokens || 2048,
        });
        return ok({ success: true, text: response.choices?.[0]?.message?.content || response.response || '', provider: 'workers-ai-glm', model: 'glm-4.7-flash' });
      }

      // Workers AI Llama
      if (path === '/api/ai/workers/llama' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [{ role: 'system', content: b.system || 'You are a helpful assistant.' }, { role: 'user', content: p }],
          temperature: b.temperature || 0.7, max_tokens: b.max_tokens || 2048,
        });
        return ok({ success: true, text: response.choices?.[0]?.message?.content || response.response || '', provider: 'workers-ai-llama', model: 'llama-3.2-3b' });
      }

      // Gemini
      if (path === '/api/ai/gemini' && (method === 'GET' || method === 'POST')) {
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        if (!env.GEMINI_API_KEY) return error('Gemini API key not configured');
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: (b.system ? b.system + '\n\n' : '') + p }] }] }),
        });
        const gdata = await geminiRes.json() as any;
        const text = gdata.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return ok({ success: true, text, provider: 'gemini', model: 'gemini-2.0-flash' });
      }


      
      // ═══ POLLINATIONS MODELS ═══
      // Pollinations supports multiple models via system prompt
      if (path.startsWith('/api/ai/pollinations/') && (method === 'GET' || method === 'POST')) {
        const model = path.replace('/api/ai/pollinations/', '').split('?')[0];
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const modelSystems: Record<string, string> = {
          'gpt4': 'You are GPT-4, an advanced AI by OpenAI.',
          'claude': 'You are Claude, an AI by Anthropic. Be thoughtful and nuanced.',
          'mistral': 'You are Mistral AI. Be direct and efficient.',
          'llama': 'You are LLaMA by Meta. Be helpful and honest.',
          'gemini': 'You are Gemini by Google. Be analytical.',
          'deepseek': 'You are DeepSeek. Think step by step.',
        };
        const system = b.system || modelSystems[model] || 'You are a helpful AI assistant.';
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(p)}?system=${encodeURIComponent(system)}`);
        return ok({ success: true, text: await res.text(), provider: 'pollinations', model });
      }

      // ═══ CHATEVERYWHERE MODELS ═══
      if (path.startsWith('/api/ai/ce/') && (method === 'GET' || method === 'POST')) {
        const model = path.replace('/api/ai/ce/', '').split('?')[0];
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        const ceRes = await fetch('https://chateverywhere.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: p }],
            prompt: b.system || `You are ${model}. Be helpful.`,
            temperature: b.temperature || 0.7,
          }),
        });
        return ok({ success: true, text: await ceRes.text(), provider: 'chateverywhere', model });
      }

      // ═══ WORKERS AI MODELS ═══
      if (path.startsWith('/api/ai/workers/') && (method === 'GET' || method === 'POST')) {
        const model = path.replace('/api/ai/workers/', '').split('?')[0];
        const b = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const p = b.prompt || b.q || '';
        if (!p) return error('prompt or q required');
        
        const workersModels: Record<string, string> = {
          'glm': '@cf/zai-org/glm-4.7-flash',
          'llama': '@cf/meta/llama-3.2-3b-instruct',
          'qwen': '@cf/qwen/qwq-32b',
          'deepseek': '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        };
        const aiModel = workersModels[model];
        if (!aiModel) return error(`Unknown model: ${model}. Available: glm, llama, qwen, deepseek`);
        
        const response = await env.AI.run(aiModel, {
          messages: [{ role: 'system', content: b.system || 'You are a helpful assistant.' }, { role: 'user', content: p }],
          temperature: b.temperature || 0.7, max_tokens: b.max_tokens || 2048,
        });
        let text = response.choices?.[0]?.message?.content || response.response || '';
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return ok({ success: true, text, provider: `workers-ai-${model}`, model });
      }


      // ═══ AI CHAT (5 endpoints) ═══
      if (path === '/api/ai/chat') {
        const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json();
        // Inject memory context
        const memory = await retrieveMemory(env, user.uid, b.session || 'default', 10);
        if (memory.recentMessages.length > 0) {
          const contextStr = memory.recentMessages
            .map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`)
            .join('\n');
          b.system = (b.system || 'You are a helpful AI assistant.') + `\n\nPrevious conversation:\n${contextStr}`;
        }
        const result = await handleAI(request, env, user, 'chat', b);
        // Auto-save to memory
        const resp = result.clone();
        const data = await resp.json();
        if (data.success) {
          await saveMemory(env, user.uid, b.session || 'default', 'user', b.prompt || b.q || '');
          await saveMemory(env, user.uid, b.session || 'default', 'assistant', data.text, {
            provider: data.provider,
            model: data.model,
            responseMs: data.response_ms,
          });
        }
        return result;
      }
      if (path === '/api/ai/reason') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); const memory = await retrieveMemory(env, user.uid, b.session || 'default', 5); if (memory.recentMessages.length > 0) { const ctx = memory.recentMessages.map((m: any) => (m.role==='assistant'?'AI':'User')+': '+m.content).join('\\n'); b.system = (b.system||'You are a helpful AI assistant.') + '\\n\\nPrevious:\\n' + ctx; } b.system = b.system||'You are a reasoning expert.'; return handleAI(request, env, user, 'chat', b); }
      if (path === '/api/ai/code') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); const memory = await retrieveMemory(env, user.uid, b.session || 'default', 5); if (memory.recentMessages.length > 0) { const ctx = memory.recentMessages.map((m: any) => (m.role==='assistant'?'AI':'User')+': '+m.content).join('\\n'); b.system = (b.system||'You are a helpful AI assistant.') + '\\n\\nPrevious:\\n' + ctx; } b.system = b.system||'You are an expert programmer.'; return handleAI(request, env, user, 'chat', b); }
      if (path === '/api/ai/translate') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); const memory = await retrieveMemory(env, user.uid, b.session || 'default', 5); if (memory.recentMessages.length > 0) { const ctx = memory.recentMessages.map((m: any) => (m.role==='assistant'?'AI':'User')+': '+m.content).join('\\n'); b.system = (b.system||'You are a helpful AI assistant.') + '\\n\\nPrevious:\\n' + ctx; } b.system = 'Translate to '+(b.to||'en')+'. Only return the translation.'; return handleAI(request, env, user, 'chat', b); }
      if (path === '/api/ai/bible') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); const r = await runChain([siputzxBible,pollinationsChat,geminiChat], { prompt:b.prompt, system:'You are a Bible teacher.' }, env); return ok(r); }

      // ═══ VISION (4 endpoints) ═══
      const va: Record<string,string> = { describe:'Describe this image.', ocr:'Read all text from this image.', analyze:'Analyze this image completely.', handwriting:'Transcribe all handwritten text.' };
      for (const [a,dp] of Object.entries(va)) { if (path==='/api/vision/'+a && method==='POST') { const b = await request.json(); b.prompt = b.prompt||dp; return handleAI(request, env, user, 'vision', b); } }

      // ═══ AUDIO (3 endpoints) ═══
      if (path === '/api/audio/tts') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); return handleAI(request, env, user, 'tts', b); }
      if (path === '/api/audio/stt' && method === 'POST') return handleAI(request, env, user, 'stt', await request.json());
      if (path === '/api/audio/voices') return ok({ voices: ['en','sw','fr','ar','pt','ha','zu','am'] });

      // ═══ IMAGE (2 endpoints) ═══
      if (path === '/api/image/generate') { const b = method==='GET' ? Object.fromEntries(url.searchParams) : await request.json(); return handleAI(request, env, user, 'image', b); }
      if (path === '/api/image/search' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([duckduckgoSearch], { prompt:q }, env); return ok(JSON.parse(r.text||'[]')); }

      // ═══ WEB (5 endpoints) ═══
      if (path === '/api/web/search' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([duckduckgoSearch,gnewsSearch], { prompt:q, country:url.searchParams.get('country')||user.country }, env); return ok(r); }
      if (path === '/api/web/news' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([gnewsSearch,duckduckgoSearch], { prompt:q, country:url.searchParams.get('country')||user.country }, env); return ok(r); }
      if (path === '/api/web/fetch' && method === 'POST') { const { url:u } = await request.json(); if (!u) return error('url required'); return ok({ url:u, text:await fetchPageText(u) }); }
      if (path === '/api/web/summarize' && method === 'POST') { const { url:u } = await request.json(); if (!u) return error('url required'); const t = await fetchPageText(u,3000); return handleAI(request, env, user, 'chat', { prompt:'Summarize this article:\n\n'+t }); }
      if (path === '/api/web/research' && method === 'POST') { const b = await request.json(); const q = b.query||b.prompt; if (!q) return error('query required'); const sr = await runChain([duckduckgoSearch,gnewsSearch], { prompt:q, country:b.country||user.country }, env); const results = JSON.parse(sr.text||'[]'); const pages = (await Promise.all(results.slice(0,3).map(async (r:any) => { try { return { title:r.title, url:r.url, text:await fetchPageText(r.url,2000) }; } catch { return null; } }))).filter(Boolean); const ctx = pages.map((p:any)=>'Source: '+p.title+'\n'+p.url+'\n'+p.text).join('\n\n'); return handleAI(request, env, user, 'chat', { prompt:'Research: '+q+'\n\nSources:\n'+ctx+'\n\nAnswer with citations.' }); }

      // ═══ TEXT TOOLS (8 endpoints) ═══
      const tt: Record<string,string> = { summarize:'Summarize:', rewrite:'Rewrite professionally:', sentiment:'Analyze sentiment:', extract:'Extract entities as JSON:', grammar:'Fix grammar:', moderate:'Check safety:', expand:'Expand:', keywords:'Extract keywords:' };
      for (const [t,sp] of Object.entries(tt)) { if (path==='/api/text/'+t && method==='POST') { const b = await request.json(); if (!b.text) return error('text required'); return handleAI(request, env, user, 'chat', { prompt:sp+'\n\n"""'+b.text+'"""' }); } }

      // ═══ MEGAN PERSONAS (2 endpoints + 12 dynamic) ═══
      if (path === '/api/megan' && method === 'GET') { let p = meganPersonas; const cat = url.searchParams.get('category'), cty = url.searchParams.get('country'); if (cat) p = getPersonasByCategory(cat); if (cty) p = getPersonasByCountry(cty); return ok({ personas:p.map(x=>({ id:x.id, name:x.name, description:x.description, icon:x.icon })) }); }
      if (path.startsWith('/api/megan/') && method === 'GET') { const pid = path.replace('/api/megan/','').split('?')[0]; const persona = getPersona(pid); if (!persona) return error('Persona not found',404); const q = url.searchParams.get('q'); if (!q) return error('q required'); return handleAI(request, env, user, 'chat', { prompt:q, system:persona.systemPrompt }); }

      // ═══ CHAINS (1 endpoint) ═══
      if (path === '/api/chain/read-aloud' && method === 'POST') { const b = await request.json(); if (!b.image_url) return error('image_url required'); const ocr = await runChain([workersAIVision,geminiVision], { prompt:'Read all text.', imageUrl:b.image_url }, env); if (!ocr.success) return ok(ocr); const tts = await runChain([workersAITTS,googleTTS], { prompt:ocr.text||'', language:b.language||'en' }, env); return ok({ original_text:ocr.text, audio_url:tts.audioUrl, steps:['ocr','tts'] }); }

      // ═══ STORAGE (4 endpoints) ═══
      if (path === '/api/storage/config' && method === 'POST') { const b = await request.json(); if (!b.type||!b.url) return error('type and url required'); const cfg: any = { type:b.type, url:b.url, apiKey:b.api_key||b.apikey, table:b.table||'megan_logs', headers:b.headers||{} }; const tr = await testStorageConnection(cfg); await fbPatch(env, 'users/'+user.uid, { storage_config:cfg }); return ok({ success:tr.success, message:tr.message, config:{ type:cfg.type, url:cfg.url } }); }
      if (path === '/api/storage/config' && method === 'GET') { const ud = await fbGet(env, 'users/'+user.uid); return ok({ storage:ud?.storage_config||{ type:'none' } }); }
      if (path === '/api/storage/test' && method === 'POST') { const ud = await fbGet(env, 'users/'+user.uid); if (!ud?.storage_config) return error('No storage configured'); return ok(await testStorageConnection(ud.storage_config)); }
      if (path === '/api/storage/remove' && method === 'DELETE') { await fbPatch(env, 'users/'+user.uid, { storage_config:null }); return ok({ success:true }); }

      // ═══ MEMORY (4 endpoints) ═══
      if (path === '/api/memory/save' && method === 'POST') { const b = await request.json(); if (!b.key||b.value===undefined) return error('key and value required'); await fbPatch(env, 'memory/'+user.uid+'/'+b.key, { value:b.value, updated_at:Date.now() }); return ok({ success:true, key:b.key }); }
      if (path === '/api/memory/get' && method === 'GET') { const k = url.searchParams.get('key'); if (!k) return error('key required'); const d = await fbGet(env, 'memory/'+user.uid+'/'+k); return ok({ key:k, data:d?.value||null }); }
      if (path === '/api/memory/del' && method === 'DELETE') { const k = url.searchParams.get('key'); if (!k) return error('key required'); await fbPatch(env, 'memory/'+user.uid+'/'+k, null); return ok({ success:true, key:k }); }
      if (path === '/api/memory/keys' && method === 'GET') { const mem = await fbGet(env, 'memory/'+user.uid)||{}; return ok({ keys:Object.keys(mem) }); }

        // ═══ MEMORY ═══
      const memoryRes = await handleMemoryRoutes(request, env, user, path, method, url);
      if (memoryRes) return memoryRes;

      // ═══ ADMIN (10+ endpoints) ═══
      if (path.startsWith('/api/admin')) return handleAdmin(env, path, url, request);

      // ═══ PROFILE (1 endpoint) ═══
      if (path === '/api/me') return ok({ uid:user.uid, username:user.username, tier:user.tier, country:user.country });

      return error('Not found', 404);
    } catch (e: any) {
      return error(e.message||'Internal error', 500);
    }
  },
};
