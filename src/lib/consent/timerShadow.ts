// The timer half of the shadow comparison (A2 batch 2, PLAN_DISTRIBUTED_EXECUTION).
//
// The chain's TimerView.totalMs is the sum of the sessions its stops declared;
// Strapi's record is the timer's interval list. Both leave a running interval
// out, so the two agree at any moment — but only for a timer whose WHOLE
// history is on the chain. A resumed timer that predates the Space has hours
// the chain never saw, so only timers opened by a `fresh` start are compared.
//
// Pure: the browser panel feeds it the replica's events and the server's totals.

import type { ConsentEvent } from './event';
import type { TimerView } from './projection';
import type { ShadowMismatch } from './shadowTelemetry';

/** Timer ids whose first signed start opened a new timer. */
export function freshTimerIds(events: Iterable<ConsentEvent>): Set<string> {
  const out = new Set<string>();
  for (const ev of events) {
    if (ev.action !== 'time.tick' || ev.subject.type !== 'timer') continue;
    const p = ev.predicate as { op?: unknown; fresh?: unknown } | undefined;
    if (p?.op === 'start' && p.fresh === true) out.add(ev.subject.id);
  }
  return out;
}

const msOf = (x: unknown): number => (typeof x === 'string' ? Date.parse(x) : NaN);

/** Closed intervals only, in exact ms — the same unit a stop's `sessionMs` is in. */
export function closedIntervalsMs(intervals: unknown): number {
  if (!Array.isArray(intervals)) return 0;
  let total = 0;
  for (const i of intervals) {
    const start = msOf(i?.start);
    const stop = msOf(i?.stop);
    if (Number.isFinite(start) && Number.isFinite(stop) && stop >= start) total += stop - start;
  }
  return total;
}

/** Compare the fresh timers Strapi answered for; the rest are not counted. */
export function compareTimers(
  timers: Map<string, TimerView>,
  fresh: Set<string>,
  strapiMs: Map<string, number>
): { compared: number; mismatches: ShadowMismatch[] } {
  let compared = 0;
  const mismatches: ShadowMismatch[] = [];
  for (const id of fresh) {
    const strapi = strapiMs.get(id);
    if (strapi === undefined) continue; // not this rikma's timer, or not read yet
    const chain = timers.get(id)?.totalMs ?? 0;
    compared++;
    if (chain !== strapi) {
      mismatches.push({ kind: 'timer', member: id, chain: String(chain), strapi: String(strapi) });
    }
  }
  return { compared, mismatches };
}
