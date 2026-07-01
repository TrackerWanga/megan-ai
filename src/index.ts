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

function cors(r: Response): Response {
  Object.entries(corsHeaders).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}

function ok(data: any, status = 200) {
  return cors(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
}

function error(msg: string, status = 400) {
  return cors(new Response(JSON.stringify({ success: false, error: msg }), { status, headers: { 'Content-Type': 'application/json' } }));
}

async function handleAI(
  request: Request, env: Env, user: User,
  feature: 'chat' | 'vision' | 'tts' | 'stt' | 'image' | 'search',
  body: any
): Promise<Response> {
  const params: AIRequest = {
    prompt: body.prompt || body.q || body.text || '',
    system: body.system || body.system_prompt || DEFAULT_SYSTEM_PROMPT,
    temperature: body.temperature || 0.7,
    imageUrl: body.image_url || body.imageUrl || '',
    audioUrl: body.audio_url || body.audioUrl || '',
    country: body.country || user.country || 'KE',
    language: body.language || body.lang || 'en',
    maxTokens: body.max_tokens || 2048,
  };
  if (!params.prompt && feature !== 'image') return error('Parameter "prompt" or "q" is required');

  let providers: any[] = [];
  switch (feature) {
    case 'chat': providers = [workersAIGLM, workersAIQwen, workersAIDeepSeek, workersAIChat, siputzxGLM, siputzxQwen, siputzxDeepSeek, chatEverywhere, pollinationsChat, geminiChat]; break;
    case 'vision': providers = [workersAIVision, geminiVision]; break;
    case 'tts': providers = [workersAITTS, googleTTS]; break;
    case 'stt': providers = [workersAISTT]; break;
    case 'image': providers = [workersAIImage, pollinationsImage]; break;
    case 'search': providers = [duckduckgoSearch, gnewsSearch]; break;
  }

  const start = Date.now();
  const result = await runChain(providers, params, env);
  const duration = Date.now() - start;
  return ok({ success: result.success, text: result.text, audio_url: result.audioUrl, image_url: result.imageUrl, provider: result.provider, model: result.model, response_ms: duration, timestamp: new Date().toISOString() });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    try {
      // ═══ PUBLIC PAGES ═══
      if (path === '/') return new Response(landingPage(), { headers: { 'Content-Type': 'text/html' } });
      if (path === '/playground') return new Response(playgroundPage(), { headers: { 'Content-Type': 'text/html' } });
      if (path === '/games') return new Response(gamesPage(), { headers: { 'Content-Type': 'text/html' } });
      if (path === '/login') return Response.redirect('https://megan-coins.trackerwanga254.workers.dev/api/auth/login', 302);
      if (path === '/signup') return Response.redirect('https://megan-coins.trackerwanga254.workers.dev/api/auth/signup', 302);

      // ═══ PUBLIC API ═══
      if (path === '/health') return ok({ status: 'ok', name: 'Megan AI Platform', version: '1.0.0' });
      if (path === '/api/status') return ok({ status: 'ok', providers: getProviderHealthStatus() });
      if (path === '/api/endpoints') return ok({
        chat: '/api/ai/chat', reason: '/api/ai/reason', code: '/api/ai/code', translate: '/api/ai/translate', bible: '/api/ai/bible',
        models: '/api/models/chat', vision: '/api/vision/describe', audio: '/api/audio/tts', image: '/api/image/generate',
        web: '/api/web/search', text: '/api/text/summarize', personas: '/api/megan/chef', admin: getAdminEndpoints(),
      });

      // Model listings
      if (path === '/api/models/chat' && method === 'GET') return ok({ models: ['llama-3.2-3b','glm-4.7-flash','deepseek-r1','qwq-32b'] });
      if (path === '/api/models/vision' && method === 'GET') return ok({ models: ['llava-1.5-7b','llama-3.2-11b-vision'] });
      if (path === '/api/models/tts' && method === 'GET') return ok({ models: ['melotts','aura-2-en'] });

      // ═══ AUTH ═══
      let reqBody: any = {};
      try { if (method !== 'GET') reqBody = await request.clone().json(); } catch {}
      const auth = await authenticate(request, env, reqBody);
      if (!auth.user) return error(auth.error || 'Unauthorized', auth.status || 401);
      const user = auth.user;

      // ═══ AI CHAT ═══
      if (path === '/api/ai/chat') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); return handleAI(request, env, user, 'chat', body); }
      if (path === '/api/ai/reason') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); body.system = body.system || 'You are a reasoning expert.'; return handleAI(request, env, user, 'chat', body); }
      if (path === '/api/ai/code') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); body.system = body.system || 'You are an expert programmer.'; return handleAI(request, env, user, 'chat', body); }
      if (path === '/api/ai/translate') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); body.system = 'Translate to ' + (body.to || 'en') + '. Only return the translation.'; return handleAI(request, env, user, 'chat', body); }
      if (path === '/api/ai/bible') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); const r = await runChain([siputzxBible, workersAIChat, geminiChat], { prompt: body.prompt, system: 'You are a Bible teacher.' }, env); return ok(r); }

      // ═══ VISION ═══
      const va: Record<string,string> = { describe:'Describe this image.', ocr:'Read all text from this image.', analyze:'Analyze this image completely.', handwriting:'Transcribe all handwritten text.' };
      for (const [a, dp] of Object.entries(va)) { if (path === '/api/vision/' + a && method === 'POST') { const b = await request.json(); b.prompt = b.prompt || dp; return handleAI(request, env, user, 'vision', b); } }

      // ═══ AUDIO ═══
      if (path === '/api/audio/tts') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); return handleAI(request, env, user, 'tts', body); }
      if (path === '/api/audio/stt' && method === 'POST') return handleAI(request, env, user, 'stt', await request.json());
      if (path === '/api/audio/voices') return ok({ voices: ['en','sw','fr','ar','pt','ha','zu','am'] });

      // ═══ IMAGE ═══
      if (path === '/api/image/generate') { const body = method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json(); return handleAI(request, env, user, 'image', body); }
      if (path === '/api/image/search' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([duckduckgoSearch], { prompt: q }, env); return ok(JSON.parse(r.text || '[]')); }

      // ═══ WEB ═══
      if (path === '/api/web/search' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([duckduckgoSearch, gnewsSearch], { prompt: q, country: url.searchParams.get('country') || user.country }, env); return ok(r); }
      if (path === '/api/web/news' && method === 'GET') { const q = url.searchParams.get('q'); if (!q) return error('q required'); const r = await runChain([gnewsSearch, duckduckgoSearch], { prompt: q, country: url.searchParams.get('country') || user.country }, env); return ok(r); }
      if (path === '/api/web/fetch' && method === 'POST') { const { url: u } = await request.json(); if (!u) return error('url required'); const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }); const h = await res.text(); return ok({ url: u, text: h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().substring(0,5000) }); }

      // ═══ TEXT TOOLS ═══
      const tt: Record<string,string> = { summarize:'Summarize:', rewrite:'Rewrite professionally:', sentiment:'Analyze sentiment:', extract:'Extract entities as JSON:', grammar:'Fix grammar:', moderate:'Check safety:', expand:'Expand:', keywords:'Extract keywords:' };
      for (const [t, sp] of Object.entries(tt)) { if (path === '/api/text/' + t && method === 'POST') { const b = await request.json(); if (!b.text) return error('text required'); return handleAI(request, env, user, 'chat', { prompt: sp + '\n\n"""' + b.text + '"""' }); } }

      // ═══ MEGAN PERSONAS ═══
      if (path === '/api/megan' && method === 'GET') { let p = meganPersonas; const cat = url.searchParams.get('category'); const cty = url.searchParams.get('country'); if (cat) p = getPersonasByCategory(cat); if (cty) p = getPersonasByCountry(cty); return ok({ personas: p.map(x => ({ id:x.id, name:x.name, description:x.description, icon:x.icon })) }); }
      if (path.startsWith('/api/megan/') && method === 'GET') { const pid = path.replace('/api/megan/','').split('?')[0]; const persona = getPersona(pid); if (!persona) return error('Persona not found', 404); const q = url.searchParams.get('q'); if (!q) return error('q required'); return handleAI(request, env, user, 'chat', { prompt: q, system: persona.systemPrompt }); }

      // ═══ CHAINS ═══
      if (path === '/api/chain/read-aloud' && method === 'POST') { const b = await request.json(); if (!b.image_url) return error('image_url required'); const ocr = await runChain([workersAIVision, geminiVision], { prompt:'Read all text.', imageUrl:b.image_url }, env); if (!ocr.success) return ok(ocr); const tts = await runChain([workersAITTS, googleTTS], { prompt: ocr.text||'', language:b.language||'en' }, env); return ok({ original_text:ocr.text, audio_url:tts.audioUrl, steps:['ocr','tts'] }); }

      // ═══ STORAGE ═══
      if (path === '/api/storage/config' && method === 'POST') { const b = await request.json(); if (!b.type||!b.url) return error('type and url required'); const cfg = { type:b.type, url:b.url, apiKey:b.api_key||b.apikey, table:b.table||'megan_logs', headers:b.headers||{} }; const tr = await testStorageConnection(cfg); await fbPatch(env, 'users/'+user.uid, { storage_config: cfg }); return ok({ success:tr.success, message:tr.message, config:{ type:cfg.type, url:cfg.url } }); }
      if (path === '/api/storage/config' && method === 'GET') { const ud = await fbGet(env, 'users/'+user.uid); return ok({ storage: ud?.storage_config || { type:'none' } }); }
      if (path === '/api/storage/test' && method === 'POST') { const ud = await fbGet(env, 'users/'+user.uid); if (!ud?.storage_config) return error('No storage configured'); return ok(await testStorageConnection(ud.storage_config)); }
      if (path === '/api/storage/remove' && method === 'DELETE') { await fbPatch(env, 'users/'+user.uid, { storage_config: null }); return ok({ success:true }); }

      // ═══ MEMORY ═══
      if (path === '/api/memory/save' && method === 'POST') { const b = await request.json(); if (!b.key||b.value===undefined) return error('key and value required'); await fbPatch(env, 'memory/'+user.uid+'/'+b.key, { value:b.value, updated_at:Date.now() }); return ok({ success:true, key:b.key }); }
      if (path === '/api/memory/get' && method === 'GET') { const k = url.searchParams.get('key'); if (!k) return error('key required'); const d = await fbGet(env, 'memory/'+user.uid+'/'+k); return ok({ key:k, data:d?.value||null }); }
      if (path === '/api/memory/del' && method === 'DELETE') { const k = url.searchParams.get('key'); if (!k) return error('key required'); await fbPatch(env, 'memory/'+user.uid+'/'+k, null); return ok({ success:true, key:k }); }
      if (path === '/api/memory/keys' && method === 'GET') { const mem = await fbGet(env, 'memory/'+user.uid) || {}; return ok({ keys:Object.keys(mem) }); }

      // ═══ ADMIN ═══
      if (path.startsWith('/api/admin')) return handleAdmin(env, path, url, request);

      // ═══ PROFILE ═══
      if (path === '/api/me') return ok({ uid:user.uid, username:user.username, tier:user.tier, country:user.country });

      return error('Not found', 404);
    } catch (e: any) {
      return error(e.message || 'Internal error', 500);
    }
  },
};
