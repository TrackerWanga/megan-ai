// ══════════════════════════════════════════════════════════
// Memory API — View, search, delete stored conversations
// ══════════════════════════════════════════════════════════

import { Env, User } from '../types';
import { retrieveMemory } from '../memory/retrieve';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
function error(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

export async function handleMemoryRoutes(
  request: Request,
  env: Env,
  user: User,
  path: string,
  method: string,
  url: URL
): Promise<Response | null> {

  // ═══ GET: Retrieve memory context ═══
  if (path === '/api/memory/context' && method === 'GET') {
    const sessionId = url.searchParams.get('session') || 'default';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const context = await retrieveMemory(env, user.uid, sessionId, limit);
    return ok({ success: true, ...context });
  }

  // ═══ GET: List all stored conversations ═══
  if (path === '/api/memory/list' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const context = await retrieveMemory(env, user.uid, 'default', limit);
    return ok({ success: true, messages: context.recentMessages, count: context.recentMessages.length });
  }

  // ═══ DELETE: Clear all memory ═══
  if (path === '/api/memory/clear' && method === 'DELETE') {
    // Get user's storage config
    const result = await env.DB.prepare(
      "SELECT storage_config FROM users WHERE uid = ?"
    ).bind(user.uid).first() as any;
    
    if (result?.storage_config) {
      try {
        const config = JSON.parse(result.storage_config);
        if (config.type === 'supabase') {
          await fetch(`${config.url}/rest/v1/${config.table || 'ai_memory'}?user_id=eq.${user.uid}`, {
            method: 'DELETE',
            headers: {
              'apikey': config.apiKey,
              'Authorization': `Bearer ${config.apiKey}`,
            },
          });
        }
        // For other backends, just remove config
        await env.DB.prepare("UPDATE users SET storage_config = NULL WHERE uid = ?").bind(user.uid).run();
      } catch {}
    }
    return ok({ success: true, message: 'Memory cleared' });
  }

  // ═══ GET: Memory stats ═══
  if (path === '/api/memory/stats' && method === 'GET') {
    const result = await env.DB.prepare(
      "SELECT storage_config FROM users WHERE uid = ?"
    ).bind(user.uid).first() as any;
    
    const hasStorage = !!(result?.storage_config);
    let storageType = 'none';
    if (hasStorage) {
      try { storageType = JSON.parse(result.storage_config).type; } catch {}
    }
    
    return ok({
      success: true,
      hasStorage,
      storageType,
      message: hasStorage 
        ? `Memory active — using ${storageType}` 
        : 'No storage configured. Set up at /api/storage/config to enable AI memory.',
    });
  }

  return null;
}
