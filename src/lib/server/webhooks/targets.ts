// src/lib/server/webhooks/targets.ts
//
// "Which api-keys of this rikma asked to be called back?"
//
// This question is asked on every successful createTask/updateTask in the whole
// site, so the answer is cached per rikma. The overwhelmingly common answer is
// "none" — a rikma with no integration must not pay a Strapi round trip every
// time somebody ticks a checkbox — and that negative answer is cached just like
// a positive one.

import type { AnyWebhookEvent } from './dispatch.js';

export interface WebhookTarget {
  keyId: string;
  name: string | null;
  url: string;
  /** Empty ⇒ every event. */
  events: AnyWebhookEvent[];
  /**
   * The key's flat scopes. Order events go only to a key that may read orders
   * (`mayReceive` in ordersApi.ts) — "every event" was written for tasks.
   */
  scopes: string[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { targets: WebhookTarget[]; expiresAt: number }>();

/** Drop a rikma's cached answer — called when a key's callback URL changes. */
export function invalidateWebhookTargets(projectId: string): void {
  cache.delete(String(projectId));
}

/** Test seam: wipe everything. */
export function clearWebhookTargetCache(): void {
  cache.clear();
}

function parseRow(row: any): WebhookTarget | null {
  const url = row?.attributes?.callback_url;
  if (typeof url !== 'string' || !url.trim()) return null;
  // A callback must be a real absolute http(s) endpoint. Anything else (a
  // relative path, a `file:` url) is a misconfiguration we refuse to call.
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const rawEvents = row.attributes.webhook_events;
  const events: AnyWebhookEvent[] = Array.isArray(rawEvents)
    ? rawEvents.map((e: unknown) => String(e) as AnyWebhookEvent).filter(Boolean)
    : [];
  const rawScopes = row.attributes.scopes;
  const scopes = Array.isArray(rawScopes) ? rawScopes.map((s: unknown) => String(s)) : [];

  return {
    keyId: String(row.id),
    name: row.attributes.name ?? null,
    url: parsed.toString(),
    events,
    scopes
  };
}

/**
 * Cached list of this rikma's webhook targets.
 *
 * Never throws: a Strapi hiccup resolves to "no targets" rather than failing
 * the action that triggered the lookup. It also caches the empty result, which
 * is deliberate — a backend blip should not turn into a lookup storm.
 */
export async function getWebhookTargets(
  projectId: string,
  strapi: { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> },
  fetchFn: typeof globalThis.fetch
): Promise<WebhookTarget[]> {
  const pid = String(projectId);
  const hit = cache.get(pid);
  if (hit && hit.expiresAt > Date.now()) return hit.targets;

  let targets: WebhookTarget[] = [];
  try {
    const res = await strapi.execute('tasksApiWebhookTargets', { pid }, undefined, fetchFn);
    const rows: any[] = res?.data?.apiKeys?.data ?? [];
    targets = rows.map(parseRow).filter((t): t is WebhookTarget => t !== null);
  } catch (e) {
    console.warn('[webhooks] target lookup failed for project', pid, e);
    targets = [];
  }

  cache.set(pid, { targets, expiresAt: Date.now() + CACHE_TTL_MS });
  return targets;
}

/** Does this target want this event? An empty subscription list means "all". */
export function wants(target: WebhookTarget, event: AnyWebhookEvent): boolean {
  return target.events.length === 0 || target.events.includes(event);
}
