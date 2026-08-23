/**
 * clock — one ticking source for every countdown in the app.
 *
 * Every lev card that shows a timegrama used to own its own `setInterval`, and
 * two of the most common ones (`cards/hachlata.svelte`, `cards/pending.svelte`)
 * ran at a **1ms** period and never cleared the handle. A heart with forty
 * cards therefore ran forty leaking timers, each forcing a reactive flush a
 * thousand times a second — and because nothing cleared them, the
 * `{#key swiperKey}` rebuild in `cards/cards.svelte` *added* a fresh set on
 * every card add/remove/filter instead of replacing them.
 *
 * This module replaces all of that with a single interval:
 *
 * - {@link clock.tenths} advances every 100ms — the finest granularity
 *   `formatTime` can actually render (it prints one tenths digit), so a card
 *   that wants an animating countdown gets the same picture for 1/10th of the
 *   wake-ups it used to cost, shared across every card instead of per-card.
 * - {@link clock.seconds} only changes when the wall-clock second changes, so a
 *   card showing `hh:mm:ss` is not woken ten times a second for a digit that
 *   cannot move.
 *
 * Both are plain `$state`, so a consumer is a one-line `$derived` and Svelte
 * skips the ones whose value did not change. The interval is suspended while
 * the tab is hidden — a phone in a pocket should not be counting.
 */

import { browser } from '$app/environment';

/** Tick period. 100ms is the resolution of `formatTime`'s tenths digit. */
const TICK_MS = 100;

let tenthsNow = $state(Date.now());
let secondsNow = $state(Math.floor(Date.now() / 1000) * 1000);

let handle: ReturnType<typeof setInterval> | null = null;

function tick() {
  const now = Date.now();
  tenthsNow = now;
  // Only write `secondsNow` when the second actually rolls over: an unchanged
  // write would still be a no-op for Svelte, but this keeps the intent explicit.
  const second = Math.floor(now / 1000) * 1000;
  if (second !== secondsNow) secondsNow = second;
}

function start() {
  // Resync first, unconditionally. Browsers throttle or suspend timers in a
  // background tab on their own, so a tab that was hidden for an hour can come
  // back with a live `handle` and an hour-old value; ticking here means the
  // first frame after the user returns already shows the right countdown
  // instead of the one from before they left.
  tick();
  if (handle !== null) return;
  handle = setInterval(tick, TICK_MS);
}

function stop() {
  if (handle === null) return;
  clearInterval(handle);
  handle = null;
}

if (browser) {
  start();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}

export const clock = {
  /** `Date.now()` as of the last 100ms tick. For countdowns showing tenths. */
  get tenths() {
    return tenthsNow;
  },
  /** `Date.now()` floored to the second. For countdowns showing `hh:mm:ss`. */
  get seconds() {
    return secondsNow;
  }
};

/** Milliseconds since the epoch for anything a `Date` constructor accepts. */
function toTime(dateish: string | number | Date | null | undefined): number | null {
  if (dateish === null || dateish === undefined || dateish === '') return null;
  const ms = dateish instanceof Date ? dateish.getTime() : new Date(dateish).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Milliseconds left until `target`, negative once it has passed — the shape
 * `formatTime` expects. Reactive: call it inside a `$derived`.
 *
 * @param precise when true the value moves every 100ms (an animating tenths
 * digit); otherwise it moves once a second, which is all a `hh:mm:ss` display
 * can show.
 */
export function msLeft(
  target: string | number | Date | null | undefined,
  { precise = false }: { precise?: boolean } = {}
): number {
  const ms = toTime(target);
  const now = precise ? clock.tenths : clock.seconds;
  if (ms === null) return 0;
  return ms - now;
}

/**
 * Whole seconds left until `target`, clamped at zero — the shape
 * `calculateTimeLeft` returned. Reactive.
 */
export function secondsLeft(target: string | number | Date | null | undefined): number {
  const ms = toTime(target);
  if (ms === null) return 0;
  return Math.max(0, Math.floor((ms - clock.seconds) / 1000));
}
