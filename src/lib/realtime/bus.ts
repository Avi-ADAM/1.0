/**
 * The client side of realtime — the one listener on `rt:changed`
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.4).
 *
 * 1. Drops the echo of the tab that ran the action (`originClientId`): it
 *    already has the result. The user's other tabs and devices keep it.
 * 2. Collects changes for a short window, so a burst (a round of votes) is
 *    one refresh, not ten.
 * 3. On flush: re-runs every SvelteKit load that declared a matching
 *    `depends(rtKey(...))`, and hands each subscriber the changes whose
 *    scopes its patterns cover — one by one, never merged, since a batch can
 *    hold changes of different rikmas.
 * 4. After a reconnect (not the first connect), whatever was sent while the
 *    socket was down is gone: every rt: dependency runs again and every
 *    subscriber is told to resync, once (B7).
 *
 * The factory has no SvelteKit or socket import — `bus.svelte.ts` wires it.
 */

import { RT_EVENT, isKnownScope, type RealtimeChange } from './scopes';
import { anyMatch, rtDependencyMatches } from './routing';

export interface RealtimeBatch {
  /** The changes this subscriber's patterns cover, in arrival order. Empty on a resync. */
  changes: RealtimeChange[];
  /** Every scope among them. */
  scopes: string[];
  /** The socket came back after a gap: refresh everything you show. */
  resync: boolean;
}

export type RealtimeHandler = (batch: RealtimeBatch) => void | Promise<void>;

export interface RealtimeBusDeps {
  on: (event: string, handler: (data: any) => void) => () => void;
  onReady: (listener: () => void) => () => void;
  /** This tab's id, as sent in `x-client-id`. */
  clientId: () => string | undefined;
  /** SvelteKit's `invalidate` (predicate form). */
  invalidate: (predicate: (url: URL) => boolean) => Promise<void>;
  windowMs?: number;
  log?: (message: string, err?: unknown) => void;
}

export interface RealtimeBus {
  /** Attach to the socket; idempotent. */
  start(): void;
  stop(): void;
  /** Listen to changes under these patterns (`mission:*`, `project:12`, …). */
  subscribe(patterns: readonly string[], handler: RealtimeHandler): () => void;
  /** For tests and tools: feed a change as if the socket had delivered it. */
  receive(raw: unknown): void;
  /** Flush now instead of at the end of the window. */
  flush(): Promise<void>;
}

/** A change as it arrives — kept only if it is one, with only known scopes. */
export function parseChange(raw: unknown): RealtimeChange | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.scopes)) return null;
  const scopes = r.scopes.filter(isKnownScope);
  if (scopes.length === 0) return null;
  return {
    scopes,
    actionKey: typeof r.actionKey === 'string' ? r.actionKey : '',
    ...(typeof r.originClientId === 'string' ? { originClientId: r.originClientId } : {}),
    at: typeof r.at === 'string' ? r.at : new Date().toISOString()
  };
}

export function createRealtimeBus(deps: RealtimeBusDeps): RealtimeBus {
  const windowMs = deps.windowMs ?? 250;
  const log = deps.log ?? ((m: string, e?: unknown) => console.warn(m, e ?? ''));
  const subscribers = new Set<{ patterns: readonly string[]; handler: RealtimeHandler }>();

  let pending: RealtimeChange[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let detach: Array<() => void> = [];
  let wasReady = false;

  async function run(handler: RealtimeHandler, batch: RealtimeBatch) {
    try {
      await handler(batch);
    } catch (err) {
      log('[realtime] subscriber failed', err);
    }
  }

  async function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const changes = pending;
    pending = [];
    if (changes.length === 0) return;

    const all = [...new Set(changes.flatMap((c) => c.scopes))];
    const jobs: Promise<unknown>[] = [
      deps.invalidate((url) => rtDependencyMatches(url.href, all)).catch((err) => log('[realtime] invalidate failed', err))
    ];
    for (const sub of subscribers) {
      const mine = changes.filter((c) => anyMatch(sub.patterns, c.scopes));
      if (mine.length === 0) continue;
      jobs.push(run(sub.handler, { changes: mine, scopes: [...new Set(mine.flatMap((c) => c.scopes))], resync: false }));
    }
    await Promise.all(jobs);
  }

  function receive(raw: unknown) {
    const change = parseChange(raw);
    if (!change) return;
    const me = deps.clientId();
    if (me && change.originClientId === me) return;
    pending.push(change);
    if (!timer) timer = setTimeout(() => void flush(), windowMs);
  }

  async function resync() {
    pending = [];
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const jobs: Promise<unknown>[] = [
      deps.invalidate((url) => url.href.startsWith('rt:')).catch((err) => log('[realtime] resync invalidate failed', err))
    ];
    for (const sub of subscribers) jobs.push(run(sub.handler, { changes: [], scopes: [], resync: true }));
    await Promise.all(jobs);
  }

  return {
    start() {
      if (detach.length) return;
      detach = [
        deps.on(RT_EVENT, receive),
        deps.onReady(() => {
          // The first ready is the first connect — nothing was missed yet.
          if (wasReady) void resync();
          wasReady = true;
        })
      ];
    },
    stop() {
      for (const d of detach) d();
      detach = [];
      wasReady = false;
    },
    subscribe(patterns, handler) {
      const sub = { patterns: [...patterns], handler };
      subscribers.add(sub);
      return () => {
        subscribers.delete(sub);
      };
    },
    receive,
    flush
  };
}
