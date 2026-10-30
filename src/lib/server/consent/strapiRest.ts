// Read-only Strapi v4 REST for the consent exports (genesis, timer totals).
// Same access as strapiMirror.ts: admin token, 5s timeout; any failure is a
// 502 so the shadow panel stays gray rather than comparing against nothing.

import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { STRAPI_URL as BASE } from '$lib/server/strapiUrl.js';

export function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

export async function strapiGet(pathAndQuery: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BASE}${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${adminToken()}` },
      signal: controller.signal
    });
    if (!res.ok) throw error(502, `strapi ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    if ((e as { status?: number }).status) throw e;
    throw error(502, 'strapi unreachable');
  } finally {
    clearTimeout(timer);
  }
}
