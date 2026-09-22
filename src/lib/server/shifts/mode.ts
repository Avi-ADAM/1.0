/**
 * The shift system's rollout switch (docs/PLAN_SHIFTS.md §11).
 *
 *   off     (default) — nothing is read or written; the shifts page says the
 *                       feature is not on yet. Today's behaviour, exactly.
 *   shadow            — plans and declarations are written and the draft is
 *                       computed and stored on the roster-period, but no
 *                       shift-assignment row is written and nobody is
 *                       notified. This is where a pilot rikma's first cycles
 *                       are checked by eye before anyone relies on them.
 *   on                — the full flow.
 *
 * Read through `$env/dynamic/private` — under `vite dev`, `process.env` is
 * empty and the flag would read as off in development only.
 */

import { env } from '$env/dynamic/private';

export type ShiftsMode = 'off' | 'shadow' | 'on';

/** Anything unrecognised is `off` — the safe direction. */
export function shiftsMode(): ShiftsMode {
  const raw = String(env.SHIFTS ?? '').toLowerCase();
  return raw === 'shadow' || raw === 'on' ? raw : 'off';
}

export function shiftsEnabled(): boolean {
  return shiftsMode() !== 'off';
}

/** May the draft be written as real assignments and announced? */
export function shiftsLive(): boolean {
  return shiftsMode() === 'on';
}
