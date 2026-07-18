// ══════════════════════════════════════════════════════════
// AI Memory Retrieval — Fast, non-blocking
// ══════════════════════════════════════════════════════════

import { Env, StorageConfig } from '../types';

export interface MemoryContext {
  recentMessages: Array<{ role: string; content: string }>;
  hasMemory: boolean;
}

export async function retrieveMemory(
  env: Env,
  userId: string,
  sessionId: string,
  limit: number = 10
): Promise<MemoryContext> {
  // Skip if no userId
  if (!userId) return { recentMessages: [], hasMemory: false };

  try {
    // Check storage config with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const result = await env.DB.prepare(
      "SELECT storage_config FROM users WHERE uid = ?"
    ).bind(userId).first() as any;

    clearTimeout(timeout);

    if (!result?.storage_config) {
      return { recentMessages: [], hasMemory: false };
    }

    let config: StorageConfig;
    try { config = JSON.parse(result.storage_config); } catch {
      return { recentMessages: [], hasMemory: false };
    }

    // Only fetch from Supabase for now (fastest)
    if (config.type === 'supabase' && config.url && config.apiKey) {
      const url = `${config.url}/rest/v1/${config.table || 'ai_memory'}?user_id=eq.${userId}&order=created_at.desc&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
        },
        signal: controller.signal,
      });
      if (res.ok) {
        const messages = await res.json();
        return {
          recentMessages: (messages || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })).reverse(),
          hasMemory: true,
        };
      }
    }
  } catch {}

  return { recentMessages: [], hasMemory: false };
}
