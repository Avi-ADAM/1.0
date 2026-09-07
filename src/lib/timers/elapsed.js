/**
 * How much time a timer row is showing, derived from the store record alone.
 *
 * The dial view reads these numbers off its own local interval; the list view
 * needs the same numbers for every row *and* for the page's totals, so the
 * derivation is pulled out here as pure functions of (record, now) instead of
 * being written a third time inside a summary.
 *
 * `totalHours` is what it says: hours, summed by `calculateTotalHours` from the
 * CLOSED intervals only. The segment currently in flight is not in it, which is
 * why the live value is that base plus `now - start`.
 */

/**
 * The start of the segment currently running, or null when the timer is stopped.
 * @param {any} timer a row from the `timers` store
 * @returns {number | null}
 */
export function runningStartMs(timer) {
  if (!timer?.running) return null;
  const segments = timer?.attributes?.activeTimer?.data?.attributes?.timers;
  if (!Array.isArray(segments) || segments.length === 0) return null;
  const ms = new Date(segments[segments.length - 1].start).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Milliseconds on the timer right now: what is banked plus the segment in
 * flight.
 * @param {any} timer
 * @param {number} now
 * @returns {number}
 */
export function elapsedMs(timer, now) {
  const base = (timer?.attributes?.activeTimer?.data?.attributes?.totalHours || 0) * 3600000;
  const start = runningStartMs(timer);
  if (start == null) return base;
  return Math.max(0, now - start) + base;
}

/**
 * Hours credited to the mission: the live timer plus everything already
 * approved on it. This is the number the progress bar measures against
 * `hoursAssigned`.
 * @param {any} timer
 * @param {number} now
 * @returns {number}
 */
export function hoursDone(timer, now) {
  return elapsedMs(timer, now) / 3600000 + (timer?.attributes?.howmanyhoursalready || 0);
}

/**
 * `hh:mm:ss`, zero-padded and never negative.
 * @param {number} ms
 * @returns {string}
 */
export function formatClock(ms) {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}
