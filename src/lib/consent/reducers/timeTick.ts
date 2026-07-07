import type { ConsentEvent } from '../event';
import type { ProjectState, TimerView } from '../projection';

/**
 * time.tick — work-timer segments on a mission/stage subject (S2b, T4).
 *
 * predicate shape: { op: 'start' | 'stop', sessionMs?, order }
 *   - start: opens a running segment at ev.ts (ignored if already running —
 *     first start wins; deterministic because topoSort orders by ts/id).
 *   - stop:  closes the open segment. The credited duration is the DECLARED
 *     `sessionMs` when present (the signed self-report), else ev.ts −
 *     runningSince. A stop with `sessionMs` but no open segment still credits
 *     — legacy timers predate the chain.
 *
 * Every tick must carry a unique `order` (e.g. ev.ts) — dedupeKey folds
 * events by (actor, subject, action, order), so a constant order would
 * swallow all but the last tick.
 */
export function timeTick(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { op?: unknown; sessionMs?: unknown } | undefined;
  const op = p?.op === 'stop' ? 'stop' : p?.op === 'start' ? 'start' : null;
  if (!op) return state;

  const prev = state.timers.get(ev.subject.id);
  const base: TimerView = prev ?? { id: ev.subject.id, totalMs: 0 };

  let next: TimerView;
  if (op === 'start') {
    if (base.runningSince !== undefined) return state; // already running
    next = { ...base, runningSince: ev.ts, runningBy: ev.actor };
  } else {
    const declared = typeof p?.sessionMs === 'number' && p.sessionMs >= 0 ? p.sessionMs : undefined;
    if (base.runningSince === undefined && declared === undefined) return state;
    const elapsed =
      declared ?? Math.max(0, ev.ts - (base.runningSince as number));
    next = { id: base.id, totalMs: base.totalMs + elapsed };
  }

  const timers = new Map(state.timers);
  timers.set(next.id, next);
  return { ...state, timers };
}
