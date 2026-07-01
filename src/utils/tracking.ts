// ══════════════════════════════════════════════════════════
// Request Tracking & IP Intelligence
// ══════════════════════════════════════════════════════════

import { Env } from '../types';
import { fbGet, fbPatch } from './firebase';

export interface RequestLog {
  timestamp: number;
  endpoint: string;
  provider: string;
  country: string;
  ip: string;
  city?: string;
  region?: string;
  isp?: string;
  asn?: string;
  colo?: string;
  responseMs: number;
  success: boolean;
  apiKey: string;
  userAgent?: string;
  method: string;
}

export async function logRequest(env: Env, log: RequestLog): Promise<void> {
  try {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    const hour = new Date(log.timestamp).toISOString().split(':')[0];
    
    // Total count
    await fbPatch(env, `analytics/total`, { 
      requests: ((await fbGet(env, 'analytics/total/requests')) || 0) + 1,
      lastRequest: log.timestamp 
    });
    
    // Per endpoint
    const endpoint = log.endpoint.replace(/\//g, '_');
    await fbPatch(env, `analytics/endpoints/${endpoint}`, {
      count: ((await fbGet(env, `analytics/endpoints/${endpoint}/count`)) || 0) + 1,
      lastUsed: log.timestamp,
    });

    // Per day
    await fbPatch(env, `analytics/daily/${date}`, {
      total: ((await fbGet(env, `analytics/daily/${date}/total`)) || 0) + 1,
    });
    await fbPatch(env, `analytics/daily/${date}/${log.success ? 'success' : 'errors'}`, 
      ((await fbGet(env, `analytics/daily/${date}/${log.success ? 'success' : 'errors'}`)) || 0) + 1
    );

    // Per hour
    await fbPatch(env, `analytics/hourly/${hour}`, {
      count: ((await fbGet(env, `analytics/hourly/${hour}/count`)) || 0) + 1,
    });

    // Per country
    const c = log.country || 'XX';
    await fbPatch(env, `analytics/countries/${c}`, {
      count: ((await fbGet(env, `analytics/countries/${c}/count`)) || 0) + 1,
      lastSeen: log.timestamp,
    });

    // Per IP
    const ipKey = log.ip.replace(/\./g, '_').replace(/:/g, '_');
    await fbPatch(env, `analytics/ips/${ipKey}`, {
      ip: log.ip,
      city: log.city || 'Unknown',
      region: log.region || 'Unknown',
      country: log.country,
      isp: log.isp || 'Unknown',
      asn: log.asn || 'Unknown',
      colo: log.colo || 'Unknown',
      count: ((await fbGet(env, `analytics/ips/${ipKey}/count`)) || 0) + 1,
      lastSeen: log.timestamp,
      endpoints: ((await fbGet(env, `analytics/ips/${ipKey}/endpoints`)) || '') + ',' + log.endpoint,
    });

    // Per provider
    await fbPatch(env, `analytics/providers/${log.provider}`, {
      count: ((await fbGet(env, `analytics/providers/${log.provider}/count`)) || 0) + 1,
      avgMs: log.responseMs,
      lastUsed: log.timestamp,
    });

    // Store last 1000 requests for live log
    const recentLogs = (await fbGet(env, 'analytics/recent_logs')) || [];
    recentLogs.unshift(log);
    if (recentLogs.length > 1000) recentLogs.length = 1000;
    await fbPatch(env, 'analytics', { recent_logs: recentLogs });

  } catch (e) {
    // Tracking errors should never break the API
  }
}

export function extractIPInfo(request: Request): {
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  asn: string;
  colo: string;
} {
  return {
    ip: request.headers.get('cf-connecting-ip') || 'unknown',
    country: request.headers.get('cf-ipcountry') || 'XX',
    city: request.headers.get('cf-ipcity') || 'Unknown',
    region: request.headers.get('cf-region') || 'Unknown',
    isp: request.headers.get('cf-ipasn') || 'Unknown',
    asn: request.headers.get('cf-asn') || 'Unknown',
    colo: request.headers.get('cf-colo') || 'Unknown',
  };
}
