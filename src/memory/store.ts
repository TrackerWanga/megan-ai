// ══════════════════════════════════════════════════════════
// AI Memory Store — Fast, non-blocking auto-save
// ══════════════════════════════════════════════════════════

import { Env, StorageConfig } from '../types';

export async function saveMemory(
  env: Env,
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): Promise<void> {
  if (!userId || !content) return;

  try {
    const result = await env.DB.prepare(
      "SELECT storage_config FROM users WHERE uid = ?"
    ).bind(userId).first() as any;

    if (!result?.storage_config) return;

    let config: StorageConfig;
    try { config = JSON.parse(result.storage_config); } catch { return; }

    const entry = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      provider: metadata?.provider,
      model: metadata?.model,
      response_ms: metadata?.responseMs,
      created_at: new Date().toISOString(),
    };

    if (config.type === 'supabase' && config.url && config.apiKey) {
      // Fire and forget — don't await
      fetch(`${config.url}/rest/v1/${config.table || 'ai_memory'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(entry),
      }).catch(() => {});
    }
  } catch {}
}
