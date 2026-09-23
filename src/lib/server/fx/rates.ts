/**
 * Today's reference rates, server-side (docs/PLAN_MULTI_CURRENCY.md D-C5/D-C6).
 *
 *   memory (6h)  →  Strapi `fx-rate` row for today  →  providers  →  last known row
 *
 * A warm process never leaves memory. A cold one (a new serverless instance,
 * a deploy) reads the day's row that another instance already paid for. Only
 * the first request of a UTC day anywhere reaches a provider, and it writes
 * the row for everyone else. If every provider is down the last stored day is
 * served — a yesterday rate is a perfectly good representative rate; no rate
 * at all would turn every converted amount back into "₪?".
 *
 * Nothing here is reachable from the browser directly: the root layout and
 * `/api/fx` hand out the table this module returns.
 */

import type { FxTable } from '$lib/money/convert.js';
import { PROVIDERS, type FxProvider } from './providers.js';

export type FxRow = { date: string; base: string; rates: Record<string, number>; source?: string | null };

/** Persistence for one table per UTC day. The Strapi adapter lives in `strapiStore.ts`. */
export type FxStore = {
  getDay: (date: string) => Promise<FxRow | null>;
  getLatest: () => Promise<FxRow | null>;
  putDay: (row: FxRow) => Promise<void>;
};

export type FxDeps = {
  fetchFn: typeof fetch;
  store: FxStore | null;
  providers?: FxProvider[];
  now?: () => number;
  log?: (msg: string) => void;
};

const FRESH_MS = 6 * 60 * 60 * 1000;
/** After everything failed, don't retry the providers on every request. */
const FAIL_BACKOFF_MS = 10 * 60 * 1000;

let memo: { table: FxTable; at: number } | null = null;
let failedAt = 0;
let inflight: Promise<FxTable | null> | null = null;

export const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function rowToTable(row: FxRow): FxTable | null {
  if (!row?.rates || typeof row.rates !== 'object') return null;
  return { base: row.base || 'USD', date: row.date, rates: row.rates, source: row.source ?? undefined };
}

async function load(deps: FxDeps): Promise<FxTable | null> {
  const now = (deps.now ?? Date.now)();
  const today = utcDay(now);
  const log = deps.log ?? ((m: string) => console.warn('[fx] ' + m));

  // 1. Another instance already fetched today.
  if (deps.store) {
    try {
      const row = await deps.store.getDay(today);
      const t = row && rowToTable(row);
      if (t) return t;
    } catch (e) {
      log('store read failed: ' + (e instanceof Error ? e.message : e));
    }
  }

  // 2. First request of the day: ask the providers, in order.
  if (now - failedAt > FAIL_BACKOFF_MS) {
    for (const p of deps.providers ?? PROVIDERS) {
      try {
        const fetched = await p.fetchTable(deps.fetchFn);
        // Keyed by the day we fetched, not the day the provider published: a
        // provider that publishes at 00:30 UTC would otherwise be re-asked on
        // every cold start until then.
        const table: FxTable = { ...fetched, date: today, source: `${p.id} ${fetched.date}` };
        if (deps.store) {
          deps.store
            .putDay({ date: today, base: table.base, rates: table.rates, source: table.source })
            .catch((e) => log('store write failed: ' + (e instanceof Error ? e.message : e)));
        }
        return table;
      } catch (e) {
        log(`${p.id} failed: ${e instanceof Error ? e.message : e}`);
      }
    }
    failedAt = now;
  }

  // 3. Everything is down: the last day anyone stored.
  if (deps.store) {
    try {
      const row = await deps.store.getLatest();
      const t = row && rowToTable(row);
      if (t) return t;
    } catch {
      // fall through
    }
  }
  return null;
}

/**
 * The current table, or null when no rate has ever been obtained (then every
 * amount renders in its own currency, unconverted — never a made-up number).
 */
export async function getRates(deps: FxDeps): Promise<FxTable | null> {
  const now = (deps.now ?? Date.now)();
  if (memo && now - memo.at < FRESH_MS && memo.table.date === utcDay(now)) return memo.table;
  if (!inflight) {
    inflight = load(deps)
      .then((t) => {
        if (t) memo = { table: t, at: now };
        return t ?? memo?.table ?? null;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Test seam: forget the process cache. */
export function _resetFxMemo() {
  memo = null;
  failedAt = 0;
  inflight = null;
}

/**
 * The subset of a table the browser needs. The full provider table is ~160
 * codes; a page only ever converts between the rikma's currency, the reader's,
 * and what someone wrote in — all of which are in the supported list or were
 * asked for explicitly.
 */
export function slimTable(table: FxTable | null, codes: Iterable<string>): FxTable | null {
  if (!table) return null;
  const rates: Record<string, number> = {};
  for (const c of codes) {
    const r = c === table.base ? 1 : table.rates[c];
    if (r > 0) rates[c] = r;
  }
  return { base: table.base, date: table.date, rates, source: table.source };
}
