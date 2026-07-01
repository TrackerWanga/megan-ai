// ══════════════════════════════════════════════════════════
// User Storage Adapter — All Backends
// ══════════════════════════════════════════════════════════

import { StorageConfig, AIRequest, AIResponse } from '../types';

export interface StoragePayload {
  requestId: string;
  endpoint: string;
  input: AIRequest;
  output: AIResponse;
  userId: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export async function saveToUserStorage(
  config: StorageConfig | undefined,
  data: StoragePayload
): Promise<{ success: boolean; backend: string; error?: string }> {
  if (!config || config.type === 'none') {
    return { success: true, backend: 'none' };
  }

  try {
    switch (config.type) {
      // ─── Webhook ──────────────────────────────────────────
      case 'webhook':
        await fetch(config.url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.headers || {}),
          },
          body: JSON.stringify(data),
        });
        return { success: true, backend: 'webhook' };

      // ─── Supabase ─────────────────────────────────────────
      case 'supabase':
        await fetch(
          `${config.url}/rest/v1/${config.table || 'megan_logs'}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: config.apiKey!,
              Authorization: `Bearer ${config.apiKey}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              request_id: data.requestId,
              endpoint: data.endpoint,
              input: JSON.stringify(data.input),
              output: JSON.stringify(data.output),
              user_id: data.userId,
              timestamp: new Date(data.timestamp).toISOString(),
            }),
          }
        );
        return { success: true, backend: 'supabase' };

      // ─── Firebase ─────────────────────────────────────────
      case 'firebase':
        await fetch(
          `${config.url}/${config.table || 'megan_logs'}.json?auth=${config.apiKey || ''}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }
        );
        return { success: true, backend: 'firebase' };

      // ─── PostgreSQL (via PostgREST or direct REST) ────────
      case 'postgres':
        await fetch(
          `${config.url}/${config.table || 'megan_logs'}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {}),
            },
            body: JSON.stringify({
              request_id: data.requestId,
              endpoint: data.endpoint,
              user_id: data.userId,
              input: JSON.stringify(data.input),
              output: JSON.stringify(data.output),
              provider: data.output.provider,
              success: data.output.success,
              response_ms: data.output.response_ms,
              created_at: new Date(data.timestamp).toISOString(),
            }),
          }
        );
        return { success: true, backend: 'postgres' };

      // ─── MongoDB (via Data API or Realm) ─────────────────
      case 'mongodb':
        await fetch(
          `${config.url}/action/insertOne`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': config.apiKey!,
            },
            body: JSON.stringify({
              dataSource: config.headers?.cluster || 'Cluster0',
              database: config.headers?.database || 'megan',
              collection: config.table || 'logs',
              document: {
                request_id: data.requestId,
                endpoint: data.endpoint,
                user_id: data.userId,
                input: data.input,
                output: data.output,
                timestamp: new Date(data.timestamp),
              },
            }),
          }
        );
        return { success: true, backend: 'mongodb' };

      // ─── Redis (via Upstash REST API) ────────────────────
      case 'redis':
        await fetch(
          `${config.url}/lpush/${config.table || 'megan_logs'}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([JSON.stringify(data)]),
          }
        );
        return { success: true, backend: 'redis' };

      // ─── MySQL (via PlanetScale or direct REST) ──────────
      case 'mysql':
        await fetch(
          `${config.url}/${config.table || 'megan_logs'}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {}),
            },
            body: JSON.stringify(data),
          }
        );
        return { success: true, backend: 'mysql' };

      default:
        return { success: false, backend: 'unknown', error: `Unsupported storage type: ${config.type}` };
    }
  } catch (error: any) {
    console.log(`[storage] Failed to save to ${config.type}: ${error.message}`);
    return { success: false, backend: config.type, error: error.message };
  }
}

// ─── Test Storage Connection ────────────────────────────────────────────────
export async function testStorageConnection(
  config: StorageConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const testPayload: StoragePayload = {
      requestId: 'test-connection',
      endpoint: '/api/test',
      input: { prompt: 'test' },
      output: { success: true, text: 'Connection successful!', provider: 'test', model: 'test' },
      userId: 'test',
      timestamp: Date.now(),
    };

    const result = await saveToUserStorage(config, testPayload);
    return {
      success: result.success,
      message: result.success
        ? `✅ Connected to ${config.type} successfully!`
        : `❌ Failed: ${result.error}`,
    };
  } catch (e: any) {
    return { success: false, message: `❌ Error: ${e.message}` };
  }
}
