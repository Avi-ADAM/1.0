/**
 * This device's cache of library files, by sha256 (docs/PLAN_P2P_PILOT.md §1).
 *
 * Two jobs: open a file instantly (and offline) the second time, and be what
 * this device seeds to other members. Only bytes that passed hash verification
 * are ever stored, so seeding never passes on something unverified.
 *
 * Two object stores: `meta` (small, read in full for eviction) and `blobs`
 * (the bytes, touched one at a time). Everything fails soft — no IndexedDB
 * (private mode, old browser) simply means an always-empty cache.
 */

import { browser } from '$app/environment';
import { DEFAULT_CACHE_CAP_BYTES, planEviction, type CacheEntryMeta } from './cachePolicy.js';
import { isSha256Hex } from './hash.js';

const DB = 'lev-p2p-cache';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (!browser || typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'hash' });
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const done = (tx: IDBTransaction) =>
  new Promise<boolean>((resolve) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);
  });

const result = <T>(req: IDBRequest<T>) =>
  new Promise<T | null>((resolve) => {
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });

async function allMeta(db: IDBDatabase): Promise<CacheEntryMeta[]> {
  return ((await result(db.transaction('meta').objectStore('meta').getAll())) as CacheEntryMeta[]) ?? [];
}

/** The cached bytes, or null. Marks the entry recently used. */
export async function getCached(hash: string): Promise<Blob | null> {
  if (!isSha256Hex(hash)) return null;
  const db = await open();
  if (!db) return null;
  try {
    const tx = db.transaction(['meta', 'blobs'], 'readwrite');
    const blob = (await result(tx.objectStore('blobs').get(hash))) as Blob | null;
    const meta = (await result(tx.objectStore('meta').get(hash))) as CacheEntryMeta | null;
    if (blob && meta) tx.objectStore('meta').put({ ...meta, lastUsed: Date.now() });
    await done(tx);
    return blob;
  } catch {
    return null;
  }
}

export async function hasCached(hash: string): Promise<boolean> {
  if (!isSha256Hex(hash)) return false;
  const db = await open();
  if (!db) return false;
  try {
    return (await result(db.transaction('meta').objectStore('meta').getKey(hash))) != null;
  } catch {
    return false;
  }
}

/**
 * Store verified bytes. The caller must already have checked the hash — this
 * module trusts its argument, which is why every writer lives in `pilot`.
 * Returns false when the file cannot fit under the cap.
 */
export async function putVerified(hash: string, blob: Blob, cap = DEFAULT_CACHE_CAP_BYTES): Promise<boolean> {
  if (!isSha256Hex(hash)) return false;
  const db = await open();
  if (!db) return false;
  try {
    const plan = planEviction(await allMeta(db), cap, blob.size, hash);
    if (!plan.fits) return false;
    const tx = db.transaction(['meta', 'blobs'], 'readwrite');
    for (const old of plan.evict) {
      tx.objectStore('meta').delete(old);
      tx.objectStore('blobs').delete(old);
    }
    tx.objectStore('blobs').put(blob, hash);
    tx.objectStore('meta').put({ hash, size: blob.size, lastUsed: Date.now() } satisfies CacheEntryMeta);
    return await done(tx);
  } catch {
    return false;
  }
}

export async function cacheUsage(): Promise<{ count: number; bytes: number }> {
  const db = await open();
  if (!db) return { count: 0, bytes: 0 };
  try {
    const meta = await allMeta(db);
    return { count: meta.length, bytes: meta.reduce((s, m) => s + m.size, 0) };
  } catch {
    return { count: 0, bytes: 0 };
  }
}

export async function clearCache(): Promise<void> {
  const db = await open();
  if (!db) return;
  try {
    const tx = db.transaction(['meta', 'blobs'], 'readwrite');
    tx.objectStore('meta').clear();
    tx.objectStore('blobs').clear();
    await done(tx);
  } catch {
    /* nothing to clear */
  }
}
