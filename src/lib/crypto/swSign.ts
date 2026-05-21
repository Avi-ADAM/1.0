// Service-worker-compatible signing path. Uses only globally-available APIs
// (crypto.subtle, indexedDB) — no `browser` import or DOM-only helpers.
//
// The SW is intentionally the single owner of the user's non-extractable
// private CryptoKey: only the SW reads it from IDB and only the SW signs.

import { signCanonical } from './sign';
import { canonicalize } from './canonical';
import type { ConsentEvent } from '$lib/consent/event';

type IdentityRow = {
  id: 'self';
  userId: string;
  algo: 'Ed25519' | 'ECDSA-P256';
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  pubSpki: ArrayBuffer;
  devicePubB64: string;
  createdAt: number;
};

const DB_NAME = 'freemates-crypto';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function getIdentity(): Promise<IdentityRow | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('identity', 'readonly');
    const req = tx.objectStore('identity').get('self');
    req.onsuccess = () => resolve(req.result as IdentityRow | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function addPending(ev: ConsentEvent): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pendingSync', 'readwrite');
    const req = tx.objectStore('pendingSync').put(ev);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function listPending(): Promise<ConsentEvent[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSync', 'readonly');
    const req = tx.objectStore('pendingSync').getAll();
    req.onsuccess = () => resolve(req.result as ConsentEvent[]);
    req.onerror = () => reject(req.error);
  });
}

async function removePending(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pendingSync', 'readwrite');
    const req = tx.objectStore('pendingSync').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function signEventInSw(partial: {
  v: 1;
  actor: string;
  action: string;
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents?: string[];
  ts?: number;
  nonce?: string;
}): Promise<{ ok: false; reason: string } | { ok: true; event: ConsentEvent }> {
  const identity = await getIdentity();
  if (!identity) return { ok: false, reason: 'no_identity' };
  if (identity.userId !== partial.actor) {
    return { ok: false, reason: 'actor_mismatch' };
  }

  const body = {
    v: 1 as const,
    actor: partial.actor,
    device: identity.devicePubB64,
    action: partial.action,
    subject: partial.subject,
    predicate: partial.predicate,
    parents: partial.parents ?? [],
    ts: partial.ts ?? Date.now(),
    nonce: partial.nonce ?? (() => {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      return btoa(String.fromCharCode(...buf))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    })()
  };
  const { sig, id } = await signCanonical(
    body as unknown as import('./canonical').JsonValue,
    identity.privateKey,
    identity.algo
  );
  const event = { ...body, sig, id } as ConsentEvent;
  await addPending(event);
  return { ok: true, event };
}

export async function flushPending(endpoint = '/api/consent/events'): Promise<{ sent: number; failed: number }> {
  const pending = await listPending();
  let sent = 0;
  let failed = 0;
  for (const ev of pending) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: ev })
      });
      if (res.ok) {
        await removePending(ev.id);
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

// Re-export so SW can ergonomically import a single module.
export { canonicalize };
