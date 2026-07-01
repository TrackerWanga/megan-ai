// ══════════════════════════════════════════════════════════
// Firebase RTDB Helpers (shared with Megan Coins)
// ══════════════════════════════════════════════════════════

import { Env } from '../types';

export async function fbGet(env: Env, path: string): Promise<any> {
  const res = await fetch(
    `${env.FIREBASE_DB}/${path}.json?auth=${env.FIREBASE_KEY}`
  );
  return res.json();
}

export async function fbPut(env: Env, path: string, data: any): Promise<void> {
  await fetch(
    `${env.FIREBASE_DB}/${path}.json?auth=${env.FIREBASE_KEY}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
}

export async function fbPatch(env: Env, path: string, data: any): Promise<void> {
  await fetch(
    `${env.FIREBASE_DB}/${path}.json?auth=${env.FIREBASE_KEY}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
}

export async function fbDelete(env: Env, path: string): Promise<void> {
  await fetch(
    `${env.FIREBASE_DB}/${path}.json?auth=${env.FIREBASE_KEY}`,
    { method: 'DELETE' }
  );
}
