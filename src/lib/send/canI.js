/**
 * canI — client-side permission introspection against /api/permissions.
 *
 * Lets UI enable/disable affordances based on what the current session's
 * token may actually run, instead of guessing and eating a 403.
 *
 *   import { canI } from '$lib/send/canI.js';
 *   const { 'action:createTask': task } = await canI(['action:createTask']);
 *   if (task.result !== 'denied') showCreateTaskButton();
 *
 * Results: 'allowed' | 'denied' | 'conditional' ('conditional' = reachable,
 * but entity-level rules — e.g. project membership — decide at execution).
 * Responses are cached for 60s per op.
 */

const CACHE_TTL_MS = 60 * 1000;

/** @type {Map<string, { value: { result: string, reason?: string }, expiresAt: number }>} */
const cache = new Map();

/**
 * @param {string[]} ops - operation strings, e.g. ['send:12mission', 'action:createTask']
 * @param {typeof globalThis.fetch} [fetchFn] - pass SvelteKit's fetch inside load functions
 * @returns {Promise<Record<string, { result: string, reason?: string }>>}
 */
export async function canI(ops, fetchFn = globalThis.fetch) {
  const now = Date.now();
  /** @type {Record<string, { result: string, reason?: string }>} */
  const results = {};
  const missing = [];

  for (const op of ops) {
    const hit = cache.get(op);
    if (hit && hit.expiresAt > now) results[op] = hit.value;
    else missing.push(op);
  }

  if (missing.length > 0) {
    const res = await fetchFn('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops: missing })
    });
    if (!res.ok) {
      // Fail closed: report unknown ops as denied without caching the failure
      for (const op of missing) results[op] = { result: 'denied', reason: `check failed (${res.status})` };
      return results;
    }
    const data = await res.json();
    for (const op of missing) {
      const value = data.results?.[op] ?? { result: 'denied', reason: 'missing from response' };
      results[op] = value;
      cache.set(op, { value, expiresAt: now + CACHE_TTL_MS });
    }
  }

  return results;
}

/** Clear the cache (e.g. after login/logout). */
export function clearCanICache() {
  cache.clear();
}
