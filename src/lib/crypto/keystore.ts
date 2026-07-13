// Thin IndexedDB wrapper for storing identity, events, and pending sync items.
// CryptoKey objects are structured-cloned into IndexedDB and remain non-extractable.

import { browser } from '$app/environment';

const DB_NAME = 'freemates-crypto';
const DB_VERSION = 3;

export type StoreName =
  | 'identity'
  | 'devices'
  | 'events'
  | 'peerKeys'
  | 'pendingSync'
  // v2 — Space sync layer (S2a): which events belong to which space, and how
  // far each space has been pulled from the relay.
  | 'spaceIndex'
  | 'spaceCursors'
  // v3 — T10 compaction: per-space pruned base state (a matured quorum
  // snapshot's normalized ProjectState replaces the pruned history).
  | 'spaceSnapshots';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('devices')) {
        db.createObjectStore('devices', { keyPath: 'devicePubKey' });
      }
      if (!db.objectStoreNames.contains('events')) {
        const s = db.createObjectStore('events', { keyPath: 'id' });
        s.createIndex('bySubject', ['subject.type', 'subject.id']);
        s.createIndex('byActor', 'actor');
        s.createIndex('byAction', 'action');
      }
      if (!db.objectStoreNames.contains('peerKeys')) {
        db.createObjectStore('peerKeys', { keyPath: 'devicePubKey' });
      }
      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('spaceIndex')) {
        // rows: { key: `${spaceId}|${eventId}`, spaceId, eventId }
        const s = db.createObjectStore('spaceIndex', { keyPath: 'key' });
        s.createIndex('bySpace', 'spaceId');
      }
      if (!db.objectStoreNames.contains('spaceCursors')) {
        // rows: { spaceId, epoch, seq } — relay pull position per space
        db.createObjectStore('spaceCursors', { keyPath: 'spaceId' });
      }
      if (!db.objectStoreNames.contains('spaceSnapshots')) {
        // rows: SpaceSnapshotRow (see below) — one compaction base per space
        db.createObjectStore('spaceSnapshots', { keyPath: 'spaceId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function idbGet<T = unknown>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  if (!browser && typeof indexedDB === 'undefined') return undefined;
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  return req<T>(tx.objectStore(store).get(key));
}

export async function idbPut(store: StoreName, value: unknown): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  await req(tx.objectStore(store).put(value as object));
}

export async function idbAdd(store: StoreName, value: unknown): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  await req(tx.objectStore(store).put(value as object));
}

export async function idbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  await req(tx.objectStore(store).delete(key));
}

export async function idbAll<T = unknown>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  return req<T[]>(tx.objectStore(store).getAll());
}

export async function idbBySubject<T = unknown>(
  subjectType: string,
  subjectId: string
): Promise<T[]> {
  const db = await openDb();
  const tx = db.transaction('events', 'readonly');
  const idx = tx.objectStore('events').index('bySubject');
  return req<T[]>(idx.getAll([subjectType, subjectId]));
}

// --- Space sync helpers (v2 stores) ---

export type SpaceIndexRow = { key: string; spaceId: string; eventId: string };
export type SpaceCursor = { spaceId: string; epoch: string; seq: number };

export async function idbSpaceLink(spaceId: string, eventId: string): Promise<void> {
  await idbPut('spaceIndex', { key: `${spaceId}|${eventId}`, spaceId, eventId } satisfies SpaceIndexRow);
}

export async function idbSpaceEventIds(spaceId: string): Promise<string[]> {
  const db = await openDb();
  const tx = db.transaction('spaceIndex', 'readonly');
  const idx = tx.objectStore('spaceIndex').index('bySpace');
  const rows = await req<SpaceIndexRow[]>(idx.getAll(spaceId));
  return rows.map((r) => r.eventId);
}

export async function idbGetCursor(spaceId: string): Promise<SpaceCursor | undefined> {
  return idbGet<SpaceCursor>('spaceCursors', spaceId);
}

export async function idbPutCursor(cursor: SpaceCursor): Promise<void> {
  await idbPut('spaceCursors', cursor);
}

// --- T10 compaction helpers (v3 store) ---

export type SpaceSnapshotRow = {
  spaceId: string;
  snapshotEventId: string;
  stateRoot: string;
  stateV: number;
  /** normalizeState output — restored via restoreState on hydrate */
  state: unknown;
  prunedAt: number;
};

export async function idbGetSpaceSnapshot(spaceId: string): Promise<SpaceSnapshotRow | undefined> {
  return idbGet<SpaceSnapshotRow>('spaceSnapshots', spaceId);
}

export async function idbPutSpaceSnapshot(row: SpaceSnapshotRow): Promise<void> {
  await idbPut('spaceSnapshots', row);
}

/** Remove one event from a space's index AND the shared events store.
 * (Spaces hold disjoint subjects in practice; if an event ever belongs to
 * two spaces, the other space re-pulls it from the relay on next sync.) */
export async function idbSpaceUnlink(spaceId: string, eventId: string): Promise<void> {
  await idbDelete('spaceIndex', `${spaceId}|${eventId}`);
  await idbDelete('events', eventId);
}

export async function resetDb(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    r.onblocked = () => resolve();
  });
}
