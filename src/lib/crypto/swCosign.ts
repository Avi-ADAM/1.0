// Service-worker half of device co-signing ($lib/consent/cosign). Runs inside
// the `push` handler, so it works with no tab open: judge the request, sign it
// with this device's key into the rikma's Space the way replica.publish does
// (parents = local heads, applied locally first), then offer it to the relay.
//
// A push the relay does not take is not lost: the event is already in the
// space index, and the next sync() of any tab re-offers it (computeDiff).

import { judgeCosignRequest } from '$lib/consent/cosign';
import { buildAndSignEvent } from '$lib/consent/signEvent';
import { computeHeads } from '$lib/space/protocol';
import { isKeyDistributionEvent } from '$lib/space/e2e/epoch';
import type { ConsentEvent, ActionName } from '$lib/consent/event';
import type { IdentityRecord } from './identity';
import { openDb, getIdentity } from './swSign';

export type SwCosignResult =
  | { ok: true; event: ConsentEvent; pushed: boolean; reason?: undefined }
  | { ok: false; reason: string };

// The relay lives on the API instance only (A0b) and a worker has no
// installApiBasePatch — name the base explicitly. Empty in dev = same origin.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

function done<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function spaceEvents(db: IDBDatabase, spaceId: string): Promise<ConsentEvent[]> {
  const tx = db.transaction(['spaceIndex', 'events'], 'readonly');
  const rows = await done(
    tx.objectStore('spaceIndex').index('bySpace').getAll(spaceId) as IDBRequest<{ eventId: string }[]>
  );
  const events = tx.objectStore('events');
  const got = await Promise.all(rows.map((r) => done(events.get(r.eventId) as IDBRequest<ConsentEvent>)));
  return got.filter(Boolean);
}

async function storeLinked(db: IDBDatabase, spaceId: string, ev: ConsentEvent): Promise<void> {
  const tx = db.transaction(['events', 'spaceIndex'], 'readwrite');
  tx.objectStore('events').put(ev);
  tx.objectStore('spaceIndex').put({ key: `${spaceId}|${ev.id}`, spaceId, eventId: ev.id });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function offerToRelay(spaceId: string, ev: ConsentEvent): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/relay/${encodeURIComponent(spaceId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [ev] })
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { results?: Array<{ id: string; ok: boolean }> };
    return !!body.results?.find((r) => r.id === ev.id)?.ok;
  } catch {
    return false;
  }
}

export async function cosignInSw(request: unknown, now = Date.now()): Promise<SwCosignResult> {
  const identity = await getIdentity().catch(() => undefined);
  if (!identity) return { ok: false, reason: 'no_identity' };

  const judged = judgeCosignRequest(request, { deviceUserId: identity.userId, now });
  if (!judged.ok) return { ok: false, reason: judged.reason };

  const db = await openDb();
  try {
    const local = await spaceEvents(db, judged.spaceId);
    // An E2E space refuses plaintext (HANDOFF invariant 5), and sealing needs
    // the replica's epoch keys — leave it to a tab rather than leak it.
    if (local.some(isKeyDistributionEvent)) return { ok: false, reason: 'space_e2e' };

    const event = await buildAndSignEvent(identity as IdentityRecord, {
      actor: identity.userId,
      action: judged.partial.action as ActionName,
      subject: judged.partial.subject,
      predicate: judged.partial.predicate,
      parents: computeHeads(local)
    });
    await storeLinked(db, judged.spaceId, event);
    return { ok: true, event, pushed: await offerToRelay(judged.spaceId, event) };
  } finally {
    db.close();
  }
}
