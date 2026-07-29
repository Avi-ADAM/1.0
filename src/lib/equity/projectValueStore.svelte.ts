/**
 * projectValueStore — a tiny module-level cache in front of the
 * `getProjectValueSummary` qid, so that N equity previews from the same rikma
 * (several lev cards rendering together) fire a *single* network call.
 *
 * See docs/PLAN_MISSION_EQUITY_PREVIEW.md §3.2.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { summarize, type ProjectValueSummary, type RawProjectValue } from './computeMissionEquity.js';

/** How long a resolved summary stays fresh before we refetch. */
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  /** Resolved summary, present once the fetch settled successfully. */
  summary?: ProjectValueSummary;
  /** Timestamp (ms) the summary resolved at — drives TTL expiry. */
  resolvedAt?: number;
  /** In-flight promise, so concurrent callers dedup onto one request. */
  inflight?: Promise<ProjectValueSummary>;
}

const cache = new Map<string, CacheEntry>();

/** Pull the raw `project.attributes` payload out of the qid response. */
function extractRaw(res: unknown): RawProjectValue | null {
  const attrs = (res as { data?: { project?: { data?: { attributes?: RawProjectValue } } } })
    ?.data?.project?.data?.attributes;
  return attrs ?? null;
}

export interface GetProjectValueOptions {
  /** Custom fetch (SvelteKit load) — defaults to global fetch. */
  fetchFn?: typeof globalThis.fetch;
  /**
   * Use the service token (public availableMission page has no user session).
   * Defaults to false — logged-in callers use their own cookie/JWT.
   */
  isSer?: boolean;
  /** Bypass the cache and force a refetch. */
  force?: boolean;
}

/**
 * Resolve the value summary for a rikma, deduping concurrent callers and
 * caching the result for {@link TTL_MS}. Never rejects to the caller with a raw
 * network error swallowed silently — it *does* reject so the UI can hide the
 * widget, but a failed attempt is not cached (the next mount retries).
 */
export function getProjectValueSummary(
  projectId: string,
  options: GetProjectValueOptions = {}
): Promise<ProjectValueSummary> {
  const { fetchFn = fetch, isSer = false, force = false } = options;

  const entry = cache.get(projectId) ?? {};

  if (!force) {
    if (entry.inflight) return entry.inflight;
    if (entry.summary && entry.resolvedAt && Date.now() - entry.resolvedAt < TTL_MS) {
      return Promise.resolve(entry.summary);
    }
  }

  const inflight = (async () => {
    const res = await sendToSer({ pid: projectId }, 'getProjectValueSummary', 0, 0, isSer, fetchFn);
    const summary = summarize(extractRaw(res));
    cache.set(projectId, { summary, resolvedAt: Date.now() });
    return summary;
  })();

  // Store the in-flight promise for dedup; clear it on failure so we retry.
  cache.set(projectId, { ...entry, inflight });
  inflight.catch(() => {
    const cur = cache.get(projectId);
    if (cur?.inflight === inflight) {
      // Keep any previously resolved summary, just drop the failed in-flight.
      cache.set(projectId, { summary: cur.summary, resolvedAt: cur.resolvedAt });
    }
  });

  return inflight;
}

/** Drop a rikma's cached summary — call after a mission is approved/changed. */
export function invalidateProjectValue(projectId: string): void {
  cache.delete(projectId);
}

/** Test-only: wipe the whole cache. */
export function __clearProjectValueCache(): void {
  cache.clear();
}
