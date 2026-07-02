// Strapi persistence for the consent mirror (Phase 1 of the store seam).
//
// Decision D-11: Strapi is a MIRROR, not the authority — the signatures and
// the DAG are. So every call here is best-effort: a down/mis-configured Strapi
// degrades the mirror to memory-only, it never blocks ingest. Rows carry the
// full signed event / key as a JSON payload plus flat columns for querying.
//
// Backend: Strapi v4 (repo 1.0b, branch shabab) — collections
// api::consent-event.consent-event and api::user-key.user-key. v4 REST
// conventions apply: `/api` prefix, `{ data: {...} }` request wrapping,
// `filters[field][$eq]` query params, `{ data: [{ id, attributes }] }`
// responses. `pagination[limit]=-1` resolves to the configured maxLimit
// (9999 in config/api.js) — plenty until snapshots (§5.1) cap replay anyway.

import { env } from '$env/dynamic/private';
import type { ConsentEvent } from '$lib/consent/event';
import type { StoredPubKey } from './store';

const BASE = (import.meta.env.VITE_URL as string | undefined) ?? 'http://127.0.0.1:1337';

function adminToken(): string {
  return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

/** The mirror is active only when the server has credentials for Strapi. */
export function mirrorEnabled(): boolean {
  return Boolean(adminToken()) && env.CONSENT_MIRROR !== 'off';
}

let warned = false;
function warnOnce(what: string, e: unknown) {
  if (warned) return;
  warned = true;
  console.warn(`[consent/strapiMirror] ${what} failed — running memory-only:`, e);
}

async function req(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken()}`,
        ...init?.headers
      },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// v4 rows come back as { id, attributes: {...} }; tolerate a flat row too
// (populated deeply / transformer plugins).
function rowPayload(row: unknown): unknown {
  const r = row as { attributes?: { payload?: unknown }; payload?: unknown } | undefined;
  return r?.attributes?.payload ?? r?.payload;
}

function responseRows(json: unknown): unknown[] {
  const data = (json as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? data : [];
}

// ── events ───────────────────────────────────────────────────────────────────

function rowToEvent(row: unknown): ConsentEvent | undefined {
  const payload = rowPayload(row);
  return payload && typeof payload === 'object' ? (payload as ConsentEvent) : undefined;
}

export async function mirrorSaveEvent(ev: ConsentEvent): Promise<void> {
  if (!mirrorEnabled()) return;
  try {
    await req('/consent-events', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          eventId: ev.id,
          actor: ev.actor,
          action: ev.action,
          subjectType: ev.subject.type,
          subjectId: ev.subject.id,
          ts: String(ev.ts),
          stateRoot: ev.stateRoot ?? null,
          payload: ev
        }
      })
    });
  } catch (e) {
    // A 400 on the unique eventId column = already mirrored; anything else is
    // a degraded mirror. Both are tolerable.
    warnOnce('saveEvent', e);
  }
}

export async function mirrorLoadEvent(id: string): Promise<ConsentEvent | undefined> {
  if (!mirrorEnabled()) return undefined;
  try {
    const json = await req(
      `/consent-events?filters[eventId][$eq]=${encodeURIComponent(id)}&pagination[limit]=1`
    );
    return rowToEvent(responseRows(json)[0]);
  } catch (e) {
    warnOnce('loadEvent', e);
    return undefined;
  }
}

export async function mirrorEventsForSubject(
  subjectType: string,
  subjectId: string
): Promise<ConsentEvent[]> {
  if (!mirrorEnabled()) return [];
  try {
    const json = await req(
      `/consent-events?filters[subjectType][$eq]=${encodeURIComponent(subjectType)}` +
      `&filters[subjectId][$eq]=${encodeURIComponent(subjectId)}&pagination[limit]=-1`
    );
    return responseRows(json)
      .map(rowToEvent)
      .filter((e): e is ConsentEvent => e !== undefined);
  } catch (e) {
    warnOnce('eventsForSubject', e);
    return [];
  }
}

// ── keys ─────────────────────────────────────────────────────────────────────

function rowToKey(row: unknown): StoredPubKey | undefined {
  const payload = rowPayload(row);
  return payload && typeof payload === 'object' ? (payload as StoredPubKey) : undefined;
}

export async function mirrorSaveKey(k: StoredPubKey): Promise<void> {
  if (!mirrorEnabled()) return;
  try {
    await req('/user-keys', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          userId: k.userId,
          devicePubB64: k.devicePubB64,
          algo: k.algo,
          label: k.label,
          revokedAt: k.revokedAt !== undefined ? String(k.revokedAt) : null,
          addedAt: String(k.addedAt),
          payload: k
        }
      })
    });
  } catch (e) {
    warnOnce('saveKey', e);
  }
}

export async function mirrorLoadKey(
  userId: string,
  devicePubB64: string
): Promise<StoredPubKey | undefined> {
  if (!mirrorEnabled()) return undefined;
  try {
    const json = await req(
      `/user-keys?filters[userId][$eq]=${encodeURIComponent(userId)}` +
      `&filters[devicePubB64][$eq]=${encodeURIComponent(devicePubB64)}&pagination[limit]=1`
    );
    return rowToKey(responseRows(json)[0]);
  } catch (e) {
    warnOnce('loadKey', e);
    return undefined;
  }
}

export async function mirrorKeysForUser(userId: string): Promise<StoredPubKey[]> {
  if (!mirrorEnabled()) return [];
  try {
    const json = await req(
      `/user-keys?filters[userId][$eq]=${encodeURIComponent(userId)}&pagination[limit]=-1`
    );
    return responseRows(json)
      .map(rowToKey)
      .filter((k): k is StoredPubKey => k !== undefined);
  } catch (e) {
    warnOnce('keysForUser', e);
    return [];
  }
}
