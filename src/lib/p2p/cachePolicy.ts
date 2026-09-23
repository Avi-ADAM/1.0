/**
 * Which cached files to drop to make room (docs/PLAN_P2P_PILOT.md §4).
 *
 * The cache is what a device seeds from, and it lives in the member's own
 * browser storage — so it has a hard cap the member can see, and it evicts
 * least-recently-used first. Pure, so the arithmetic is tested apart from
 * IndexedDB.
 */

export const DEFAULT_CACHE_CAP_BYTES = 200 * 1024 * 1024;

export interface CacheEntryMeta {
  hash: string;
  size: number;
  /** epoch ms of the last open or seed */
  lastUsed: number;
}

export type EvictionPlan = { fits: false } | { fits: true; evict: string[] };

/**
 * @param entries   what is cached now
 * @param cap       total bytes allowed
 * @param incoming  size of the file about to be stored (0 = just trim)
 * @param keep      a hash that must survive (the one being re-stored)
 */
export function planEviction(
  entries: CacheEntryMeta[],
  cap: number,
  incoming: number,
  keep?: string
): EvictionPlan {
  if (incoming > cap) return { fits: false };

  let total = entries.reduce((sum, e) => sum + Math.max(0, e.size), 0) + incoming;
  const evict: string[] = [];
  const oldestFirst = [...entries]
    .filter((e) => e.hash !== keep)
    .sort((a, b) => a.lastUsed - b.lastUsed || a.hash.localeCompare(b.hash));

  for (const entry of oldestFirst) {
    if (total <= cap) break;
    evict.push(entry.hash);
    total -= Math.max(0, entry.size);
  }
  return total <= cap ? { fits: true, evict } : { fits: false };
}
