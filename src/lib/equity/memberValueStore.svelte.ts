/**
 * memberValueStore — the numerator of "my share of this rikma", cached and
 * deduped exactly like {@link ../equity/projectValueStore.svelte.ts} caches the
 * denominator.
 *
 * A stipend program's whole question is "what does this budget do to *my*
 * percentage" (PLAN_STIPEND §4), and that needs two numbers: the rikma's
 * current value and mine inside it. The qid deliberately sums the same two
 * collections `getProjectValueSummary` sums — Σ finnished_missions.total +
 * Σ rikmashes.total — so the percentage on the card matches the split page.
 */

import { sendToSer } from '$lib/send/sendToSer.js';

/** How long a resolved total stays fresh before we refetch. */
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  total?: number;
  resolvedAt?: number;
  inflight?: Promise<number>;
}

const cache = new Map<string, CacheEntry>();

const keyOf = (projectId: string, userId: string) => `${projectId}::${userId}`;

function sumTotals(collection: unknown): number {
  const rows =
    (collection as { data?: Array<{ attributes?: { total?: number | null } }> } | null)?.data ?? [];
  return rows.reduce((sum, row) => {
    const n = Number(row?.attributes?.total);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

export interface GetMemberValueOptions {
  fetchFn?: typeof globalThis.fetch;
  force?: boolean;
}

/**
 * Resolve one member's contribution total in one rikma. Rejects on a network
 * failure (the caller hides the widget); a failed attempt is not cached.
 */
export function getMemberValueTotal(
  projectId: string,
  userId: string,
  options: GetMemberValueOptions = {}
): Promise<number> {
  const { fetchFn = fetch, force = false } = options;
  const key = keyOf(projectId, userId);
  const entry = cache.get(key) ?? {};

  if (!force) {
    if (entry.inflight) return entry.inflight;
    if (entry.total != null && entry.resolvedAt && Date.now() - entry.resolvedAt < TTL_MS) {
      return Promise.resolve(entry.total);
    }
  }

  const inflight = (async () => {
    const res = await sendToSer(
      { pid: projectId, uid: userId },
      'getMemberValueTotal',
      0,
      0,
      false,
      fetchFn
    );
    const attrs = (
      res as {
        data?: { project?: { data?: { attributes?: Record<string, unknown> } } };
      }
    )?.data?.project?.data?.attributes;
    const total = sumTotals(attrs?.finnished_missions) + sumTotals(attrs?.rikmashes);
    cache.set(key, { total, resolvedAt: Date.now() });
    return total;
  })();

  cache.set(key, { ...entry, inflight });
  inflight.catch(() => {
    const cur = cache.get(key);
    if (cur?.inflight === inflight) cache.set(key, { total: cur.total, resolvedAt: cur.resolvedAt });
  });

  return inflight;
}

/** Drop one member's cached total — call after their hours are approved. */
export function invalidateMemberValue(projectId: string, userId: string): void {
  cache.delete(keyOf(projectId, userId));
}

/** Test-only: wipe the whole cache. */
export function __clearMemberValueCache(): void {
  cache.clear();
}
