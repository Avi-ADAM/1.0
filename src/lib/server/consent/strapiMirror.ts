// Strapi persistence for the consent mirror (Phase 1 of the store seam).
//
// Decision D-11: Strapi is a MIRROR, not the authority — the signatures and
// the DAG are. So every call here is best-effort: a down/mis-configured Strapi
// degrades the mirror to memory-only, it never blocks ingest. Rows carry the
// full signed event / key as a JSON payload plus flat columns for querying.
//
// Backend collections (repo 1.0b): api/consent-event, api/user-key.

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
    const res = await fetch(`${BASE}${path}`, {
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

// ── events ───────────────────────────────────────────────────────────────────

type EventRow = { payload?: unknown };

function rowToEvent(row: unknown): ConsentEvent | undefined {
  const payload = (row as EventRow)?.payload;
  return payload && typeof payload === 'object' ? (payload as ConsentEvent) : undefined;
}

export async function mirrorSaveEvent(ev: ConsentEvent): Promise<void> {
  if (!mirrorEnabled()) return;
  try {
    await req('/consent-events', {
      method: 'POST',
      body: JSON.stringify({
        eventId: ev.id,
        actor: ev.actor,
        action: ev.action,
        subjectType: ev.subject.type,
        subjectId: ev.subject.id,
        ts: ev.ts,
        stateRoot: ev.stateRoot ?? null,
        payload: ev
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
    const rows = (await req(`/consent-events?eventId=${encodeURIComponent(id)}&_limit=1`)) as unknown[];
    return Array.isArray(rows) ? rowToEvent(rows[0]) : undefined;
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
    const rows = (await req(
      `/consent-events?subjectType=${encodeURIComponent(subjectType)}` +
      `&subjectId=${encodeURIComponent(subjectId)}&_limit=-1`
    )) as unknown[];
    if (!Array.isArray(rows)) return [];
    return rows.map(rowToEvent).filter((e): e is ConsentEvent => e !== undefined);
  } catch (e) {
    warnOnce('eventsForSubject', e);
    return [];
  }
}

// ── keys ─────────────────────────────────────────────────────────────────────

type KeyRow = { payload?: unknown };

function rowToKey(row: unknown): StoredPubKey | undefined {
  const payload = (row as KeyRow)?.payload;
  return payload && typeof payload === 'object' ? (payload as StoredPubKey) : undefined;
}

export async function mirrorSaveKey(k: StoredPubKey): Promise<void> {
  if (!mirrorEnabled()) return;
  try {
    await req('/user-keys', {
      method: 'POST',
      body: JSON.stringify({
        userId: k.userId,
        devicePubB64: k.devicePubB64,
        algo: k.algo,
        label: k.label,
        revokedAt: k.revokedAt ?? null,
        addedAt: k.addedAt,
        payload: k
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
    const rows = (await req(
      `/user-keys?userId=${encodeURIComponent(userId)}` +
      `&devicePubB64=${encodeURIComponent(devicePubB64)}&_limit=1`
    )) as unknown[];
    return Array.isArray(rows) ? rowToKey(rows[0]) : undefined;
  } catch (e) {
    warnOnce('loadKey', e);
    return undefined;
  }
}

export async function mirrorKeysForUser(userId: string): Promise<StoredPubKey[]> {
  if (!mirrorEnabled()) return [];
  try {
    const rows = (await req(
      `/user-keys?userId=${encodeURIComponent(userId)}&_limit=-1`
    )) as unknown[];
    if (!Array.isArray(rows)) return [];
    return rows.map(rowToKey).filter((k): k is StoredPubKey => k !== undefined);
  } catch (e) {
    warnOnce('keysForUser', e);
    return [];
  }
}
