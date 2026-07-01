// ══════════════════════════════════════════════════════════
// Provider Health Tracking (same pattern as YouTube downloader)
// ══════════════════════════════════════════════════════════

import { ProviderHealth } from '../types';

const healthMap = new Map<string, ProviderHealth>();

const HEALTH_CONFIG = {
  maxFailures: 3,
  cooldownMs: 5 * 60 * 1000, // 5 minutes
  resetAfterMs: 15 * 60 * 1000, // 15 minutes
};

export function isProviderHealthy(name: string): boolean {
  const health = healthMap.get(name);
  if (!health) return true;
  if (Date.now() > health.cooldownUntil) {
    if (Date.now() - health.lastFailure > HEALTH_CONFIG.resetAfterMs) {
      healthMap.delete(name);
    }
    return true;
  }
  return false;
}

export function recordProviderFailure(name: string): void {
  const health = healthMap.get(name) || {
    failures: 0,
    lastFailure: 0,
    cooldownUntil: 0,
    lastSuccess: 0,
  };
  health.failures++;
  health.lastFailure = Date.now();
  if (health.failures >= HEALTH_CONFIG.maxFailures) {
    health.cooldownUntil = Date.now() + HEALTH_CONFIG.cooldownMs;
    console.log(`[health] ${name} on cooldown for ${HEALTH_CONFIG.cooldownMs / 1000}s`);
  }
  healthMap.set(name, health);
}

export function recordProviderSuccess(name: string): void {
  const health = healthMap.get(name);
  if (health) {
    health.failures = 0;
    health.lastSuccess = Date.now();
  }
}

export function getProviderHealthStatus(): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [name, h] of healthMap.entries()) {
    const onCooldown = Date.now() < h.cooldownUntil;
    out[name] = {
      failures: h.failures,
      onCooldown,
      cooldownSecondsLeft: onCooldown
        ? Math.ceil((h.cooldownUntil - Date.now()) / 1000)
        : 0,
      lastSuccess: h.lastSuccess ? new Date(h.lastSuccess).toISOString() : null,
    };
  }
  return out;
}
