// Thin IndexedDB wrapper for storing identity, events, and pending sync items.
// CryptoKey objects are structured-cloned into IndexedDB and remain non-extractable.

import { browser } from '$app/environment';

const DB_NAME = 'freemates-crypto';
const DB_VERSION = 1;

export type StoreName =
  | 'identity'
  | 'devices'
  | 'events'
  | 'peerKeys'
  | 'pendingSync';

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
