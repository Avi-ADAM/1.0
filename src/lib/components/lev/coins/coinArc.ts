/**
 * coinArc — how much of a coin's response window is still on the clock, 0…1.
 *
 * A coin is a circle, so the one thing it can say without spending any of its
 * very small text budget is *how far round the ring the time has gone*. The
 * card and the row both show the countdown as words; the coin shows it as an
 * arc and keeps the words for the title.
 *
 * The honest denominator is the rikma's own response time — the `restime` every
 * consent flow runs on (see the project's "silence is consent, at the rikma's
 * pace" principle). `restime` is an enum on `Project`, and the same four values
 * are turned into hours in half a dozen server actions; the table is repeated
 * here because this module is pure and client-side and must not import a server
 * config.
 *
 * When an item carries no `restime` (a good third of the kinds do not — a sale
 * to acknowledge, a welcome, a transfer) the window falls back to the **longest**
 * restime rather than the shortest. Guessing long means the arc starts near full
 * and only narrows once the deadline is genuinely close, which is the direction
 * that cannot mislead: an arc that reads "plenty of time" when there is little
 * would be a lie, one that reads "plenty" when there is plenty is merely vague.
 *
 * Nothing here is reactive — the caller passes the milliseconds left, which it
 * gets from the shared clock (`$lib/stores/clock.svelte`).
 */

/** `Enum_Project_Restime` → hours. Mirrors RESTIME_HOURS in actionUtils.ts. */
export const RESTIME_HOURS: Record<string, number> = {
  feh: 48,
  sth: 72,
  nsh: 96,
  sevend: 168
};

/** The window used when the item does not say — the longest restime. */
export const FALLBACK_WINDOW_HOURS = 168;

const HOUR_MS = 3_600_000;

/**
 * The length of this item's response window, in milliseconds.
 *
 * `restime` arrives as the enum key on most items and, on a few older
 * processors, already as a number of hours; accept both.
 */
export function coinWindowMs(item: any): number {
  const raw = item?.restime;
  if (typeof raw === 'string' && raw in RESTIME_HOURS) {
    return RESTIME_HOURS[raw] * HOUR_MS;
  }
  const hours = Number(raw);
  if (Number.isFinite(hours) && hours > 0) return hours * HOUR_MS;
  return FALLBACK_WINDOW_HOURS * HOUR_MS;
}

/**
 * The fraction of the ring still to run: 1 = the whole window is left, 0 = the
 * deadline has passed. `null` when the item has no clock at all, which the coin
 * draws as a quiet, unfilled ring rather than as an empty one — "no deadline"
 * and "out of time" must not look the same.
 *
 * @param item the DisplayItem
 * @param leftMs milliseconds until its timegrama, or null when it has none
 */
export function coinArc(item: any, leftMs: number | null): number | null {
  if (leftMs === null || !Number.isFinite(leftMs)) return null;
  const window = coinWindowMs(item);
  if (!(window > 0)) return null;
  return Math.min(1, Math.max(0, leftMs / window));
}
