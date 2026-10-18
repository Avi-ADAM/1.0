/**
 * A small overlay cache in front of Strapi for the public read API (§4.5).
 *
 * Two facts make it necessary, and one makes it cheap:
 *
 *   - Today every public page is a fresh set of queries, so a shop with real
 *     traffic would flatten the backend the moment its site asks for the
 *     catalog on every request.
 *   - The catalog of one rikma changes rarely (a member edits a product), so a
 *     response that is a minute old is a response that is correct for a shop.
 *
 * It is deliberately tiny and process-local: no keys, no pub/sub, no
 * invalidation graph. `s-maxage` on the response carries the same idea to the
 * CDN, and a client that needs certainty uses `?updatedSince=` or an `ETag`.
 * A multi-instance deployment therefore has *at most* one stale minute per
 * instance — which is the contract, not a bug.
 *
 * In-flight requests for the same key share one query: a shop's build that
 * fires 20 parallel product fetches asks Strapi once.
 */

const DEFAULT_TTL_MS = 45 * 1000;

/** Bound the map: a public API must not be a memory leak with a nice name. */
const MAX_ENTRIES = 200;

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
  // Still full: drop the oldest insertions (Map preserves insertion order).
  while (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/** The cache key of a query: the qid plus its variables, verbatim. */
export function queryCacheKey(
  qid: string,
  vars: Record<string, unknown>
): string {
  return `${qid}:${JSON.stringify(vars ?? {})}`;
}

/**
 * Run `load` unless a fresh answer exists. Errors are never cached — a Strapi
 * outage must not be remembered for a minute.
 */
export async function cachedQuery<T>(
  key: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      evictIfNeeded();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Test seam — the cache is process state that tests must not inherit. */
export function clearQueryCache(): void {
  store.clear();
  inflight.clear();
}

/** Exposed for the "how big is it" question in tests and logs. */
export function queryCacheSize(): number {
  return store.size;
}
