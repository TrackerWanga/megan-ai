// ══════════════════════════════════════════════════════════
// Megan AI Admin Endpoints
// ══════════════════════════════════════════════════════════

import { Env } from './types';
import { fbGet } from './utils/firebase';
import { getProviderHealthStatus } from './utils/health';

export async function handleAdmin(env: Env, path: string, url: URL, request: Request): Promise<Response> {
  
  // ─── Dashboard Summary ──────────────────────────────────────────────
  if (path === '/api/admin/dashboard') {
    const total = await fbGet(env, 'analytics/total') || {};
    const daily = await fbGet(env, 'analytics/daily') || {};
    const providers = getProviderHealthStatus();
    const countries = await fbGet(env, 'analytics/countries') || {};
    const ips = await fbGet(env, 'analytics/ips') || {};
    const endpoints = await fbGet(env, 'analytics/endpoints') || {};
    const hourly = await fbGet(env, 'analytics/hourly') || {};
    
    // Deployment uptime
    const deployed = new Date('2026-07-01T10:40:00Z'); // When you deployed
    const uptimeHours = Math.floor((Date.now() - deployed.getTime()) / (1000 * 60 * 60));
    
    // Top countries
    const topCountries = Object.entries(countries)
      .sort(([, a]: any, [, b]: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map(([code, data]: any) => ({ code, count: data.count, lastSeen: data.lastSeen }));
    
    // Top endpoints
    const topEndpoints = Object.entries(endpoints)
      .sort(([, a]: any, [, b]: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map(([ep, data]: any) => ({ endpoint: ep.replace(/_/g, '/'), count: data.count }));
    
    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayData = daily[today] || { total: 0, success: 0, errors: 0 };

    return Response.json({
      success: true,
      dashboard: {
        totalRequests: total.requests || 0,
        uniqueIPs: Object.keys(ips).length,
        deployedAt: deployed.toISOString(),
        uptimeHours,
        uptimeDays: Math.floor(uptimeHours / 24),
        today: todayData,
        topCountries,
        topEndpoints,
        providers,
        activeConnections: (await fbGet(env, 'analytics/hourly')) ? Object.keys(hourly).length : 0,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Live Logs (Last Requests) ────────────────────────────────────
  if (path === '/api/admin/logs') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const logs = (await fbGet(env, 'analytics/recent_logs')) || [];
    return Response.json({ success: true, count: logs.length, logs: logs.slice(0, limit) });
  }

  // ─── IP Intelligence ──────────────────────────────────────────────
  if (path === '/api/admin/ips') {
    const ips = await fbGet(env, 'analytics/ips') || {};
    const list = Object.entries(ips)
      .map(([key, data]: any) => ({
        ip: key.replace(/_/g, '.'),
        ...data,
      }))
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 100);
    return Response.json({ success: true, total: Object.keys(ips).length, ips: list });
  }

  // ─── Single IP Lookup ─────────────────────────────────────────────
  if (path === '/api/admin/ip') {
    const ip = url.searchParams.get('ip') || request.headers.get('cf-connecting-ip');
    const ipKey = (ip || '').replace(/\./g, '_').replace(/:/g, '_');
    const data = await fbGet(env, `analytics/ips/${ipKey}`);
    return Response.json({ success: true, ip, data: data || { message: 'No data for this IP' } });
  }

  // ─── Country Breakdown ────────────────────────────────────────────
  if (path === '/api/admin/countries') {
    const countries = await fbGet(env, 'analytics/countries') || {};
    const list = Object.entries(countries)
      .map(([code, data]: any) => ({ code, ...data }))
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0));
    return Response.json({ success: true, total: list.length, countries: list });
  }

  // ─── Endpoint Usage ────────────────────────────────────────────────
  if (path === '/api/admin/endpoints') {
    const endpoints = await fbGet(env, 'analytics/endpoints') || {};
    const list = Object.entries(endpoints)
      .map(([ep, data]: any) => ({ endpoint: ep.replace(/_/g, '/'), ...data }))
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0));
    return Response.json({ success: true, total: list.length, endpoints: list });
  }

  // ─── Provider Health ──────────────────────────────────────────────
  if (path === '/api/admin/providers') {
    return Response.json({ success: true, providers: getProviderHealthStatus() });
  }

  // ─── Daily Stats ───────────────────────────────────────────────────
  if (path === '/api/admin/daily') {
    const days = url.searchParams.get('days') || '7';
    const since = Date.now() - (parseInt(days) * 86400000);
    const daily = await fbGet(env, 'analytics/daily') || {};
    const list = Object.entries(daily)
      .filter(([date]) => new Date(date).getTime() > since)
      .map(([date, data]: any) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return Response.json({ success: true, days: list });
  }

  // ─── Hourly Breakdown ─────────────────────────────────────────────
  if (path === '/api/admin/hourly') {
    const hourly = await fbGet(env, 'analytics/hourly') || {};
    const list = Object.entries(hourly)
      .map(([hour, data]: any) => ({ hour, ...data }))
      .sort((a, b) => b.hour.localeCompare(a.hour))
      .slice(0, 48);
    return Response.json({ success: true, hourly: list });
  }

  // ─── Clear Data ────────────────────────────────────────────────────
  if (path === '/api/admin/clear') {
    const type = url.searchParams.get('type') || 'all';
    if (type === 'logs') {
      await fbPatch(env, 'analytics', { recent_logs: [] });
    }
    return Response.json({ success: true, message: `Cleared ${type}` });
  }

  return Response.json({ error: 'Admin endpoint not found' }, { status: 404 });
}

export function getAdminEndpoints(): string[] {
  return [
    '/api/admin/dashboard',
    '/api/admin/logs',
    '/api/admin/ips',
    '/api/admin/ip',
    '/api/admin/countries',
    '/api/admin/endpoints',
    '/api/admin/providers',
    '/api/admin/daily',
    '/api/admin/hourly',
    '/api/admin/clear',
  ];
}
