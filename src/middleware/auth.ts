// ══════════════════════════════════════════════════════════
// Authentication Middleware — Uses Megan Auth Service
// ══════════════════════════════════════════════════════════

import { Env, User } from '../types';

export async function authenticate(
  request: Request,
  env: Env,
  body?: any
): Promise<{ user: User | null; error?: string; status?: number }> {
  const apiKey =
    request.headers.get('x-api-key') ||
    new URL(request.url).searchParams.get('api_key') ||
    body?.api_key ||
    body?.apiKey;

  if (!apiKey) {
    return { user: null, error: 'API key required. Get one at apis.megan.qzz.io/keys', status: 401 };
  }

  try {
    // Validate key via Auth Service
    const res = await fetch('https://auth.megan.qzz.io/auth/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey, project: 'megan-ai' }),
    });
    const data = await res.json() as any;

    if (!data.valid || !data.user) {
      return { user: null, error: 'Invalid or revoked API key', status: 401 };
    }

    const user = data.user;
    const today = data.usage?.today || 0;

    // Tier limits
    const limits: Record<string, number> = {
      bronze: 50, silver: 500, gold: 5000, platinum: 50000, diamond: 999999,
    };
    const limit = limits[user.tier] || 50;

    if (today >= limit) {
      return { user: null, error: `Daily limit reached (${limit} requests). Upgrade your tier.`, status: 429 };
    }

    return {
      user: {
        uid: user.uid,
        username: user.username || 'unknown',
        email: user.email || '',
        tier: user.tier || 'bronze',
        mgc_balance: user.mgc_balance || 0,
        api_key: apiKey,
        country: 'KE',
      },
    };
  } catch {
    return { user: null, error: 'Auth service unavailable', status: 503 };
  }
}
