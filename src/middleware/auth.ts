// ══════════════════════════════════════════════════════════
// Authentication Middleware (uses Megan Coins Firebase)
// ══════════════════════════════════════════════════════════

import { Env, User } from '../types';
import { fbGet, fbPatch } from '../utils/firebase';

const TIERS: Record<string, { daily: number; rate: number }> = {
  bronze: { daily: 50, rate: 10 },
  silver: { daily: 500, rate: 30 },
  gold: { daily: 5000, rate: 100 },
  platinum: { daily: 50000, rate: 300 },
  diamond: { daily: 999999, rate: 1000 },
};

export async function authenticate(
  request: Request,
  env: Env,
  body?: any
): Promise<{ user: User | null; error?: string; status?: number }> {
  // Check multiple places for API key
  let apiKey =
    request.headers.get('x-api-key') ||
    new URL(request.url).searchParams.get('api_key') ||
    body?.api_key ||
    body?.apiKey;

  if (!apiKey) {
    return { user: null, error: 'API key required. Get one at megan-coins.worker.dev', status: 401 };
  }

  // Scan users for the key (Megan Coins stores keys under users/{uid}/keys/{key})
  let uid: string | null = null;
  try {
    const users = await fbGet(env, 'users');
    if (users) {
      for (const [potentialUid, userData] of Object.entries(users)) {
        const keys = (userData as any)?.keys;
        if (keys && keys[apiKey] && keys[apiKey].active) {
          uid = potentialUid;
          break;
        }
      }
    }
  } catch {}

  if (!uid) {
    return { user: null, error: 'Invalid or revoked API key', status: 401 };
  }

  const user = await fbGet(env, `users/${uid}`);
  if (!user) {
    return { user: null, error: 'User not found', status: 404 };
  }

  if (user.suspended) {
    return { user: null, error: 'Account suspended', status: 403 };
  }

  const tier = user.tier || 'bronze';
  const limit = TIERS[tier]?.daily || 50;
  const today = new Date().toISOString().split('T')[0];
  const usage = (await fbGet(env, `usage/${uid}/${today}`)) || 0;

  if (usage >= limit) {
    return {
      user: null,
      error: `Daily limit reached (${limit} requests). Upgrade tier or wait until tomorrow.`,
      status: 429,
    };
  }

  await fbPatch(env, `usage/${uid}`, {
    [today]: usage + 1,
  });

  return {
    user: {
      uid: user.uid || uid,
      username: user.username || 'unknown',
      email: user.email || '',
      tier,
      mgc_balance: user.mgc_balance || 0,
      api_key: apiKey,
      country: user.country || 'KE',
      storage: user.storage_config,
    },
  };
}
