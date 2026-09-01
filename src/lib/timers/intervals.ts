/**
 * Pure rules for a timer's work intervals.
 *
 * A timer (`activeTimer`) carries a `timers` array of `{ start, stop }` pairs —
 * one per stretch of work. Everything the member sees and edits in the time
 * editor is derived here so the in-app dialog, the chat card and any future
 * surface all agree on what a valid interval is; before this module each
 * surface re-implemented (or skipped) the checks on its own.
 *
 * Times are ISO strings on the wire. `stop: null` means the interval is still
 * running — it counts toward nothing until it is stopped.
 */

export interface Interval {
	start: string;
	stop?: string | null;
	/** Present on rows that came back from the UI mid-edit; never persisted. */
	[extra: string]: unknown;
}

/** A validation failure, named by its `timers.editor*` translation key. */
export type IntervalProblem =
	| 'editorEndBeforeStart'
	| 'editorFuture'
	| 'editorOverlap'
	| 'editorTooLong';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Milliseconds an interval covers; a running one is measured up to `now`. */
export function intervalMs(iv: Interval, now: number = Date.now()): number {
	const start = new Date(iv.start).getTime();
	if (Number.isNaN(start)) return 0;
	const stop = iv.stop ? new Date(iv.stop).getTime() : now;
	if (Number.isNaN(stop) || stop <= start) return 0;
	return stop - start;
}

/**
 * Hours across every **closed** interval.
 *
 * Deliberately ignores the running one: `totalHours` on the timer is the figure
 * that later becomes the member's claim for approval, and a number that grows
 * while nobody is looking cannot be claimed.
 */
export function totalHours(intervals: Interval[] | null | undefined): number {
	if (!Array.isArray(intervals)) return 0;
	let ms = 0;
	for (const iv of intervals) {
		if (iv?.start && iv?.stop) ms += intervalMs(iv);
	}
	return ms / HOUR_MS;
}

/** `true` while the interval has a start and no stop. */
export function isRunning(iv: Interval | null | undefined): boolean {
	return !!iv?.start && !iv?.stop;
}

/** Every interval that was started and never stopped. */
export function openIntervals(intervals: Interval[] | null | undefined): Interval[] {
	return (Array.isArray(intervals) ? intervals : []).filter(isRunning);
}

/**
 * Closes **every** open interval at `at`, not just the last one.
 *
 * A timer can only be running once, so a second open interval is always the
 * residue of a lost write — a stop whose response never came back, a save or a
 * clear that turned the timer off without closing what it had started. Nothing
 * ever closed those: `stopTimer` only ever touched `intervals[length - 1]`, and
 * `totalHours` skips an interval with no stop, so the orphan stayed invisible in
 * Strapi while every month-aware view (`hoursByMonth`) measured it up to *now*
 * and grew by 24 hours a day. That is how a 49-hour timer came to read 390.
 *
 * Closing them all is safe in both directions: it is a no-op on a list that has
 * none, so calling it before a start, on a stop, or on a save costs nothing and
 * makes each of those idempotent.
 */
export function closeOpenIntervals(
	intervals: Interval[] | null | undefined,
	at: string = new Date().toISOString()
): { intervals: Interval[]; closed: number } {
	const list = Array.isArray(intervals) ? intervals : [];
	let closed = 0;
	const next = list.map((iv) => {
		if (!isRunning(iv)) return iv;
		closed++;
		// An interval whose start is already past `at` (clock skew, a hand-edited
		// row) would become negative — close it on itself instead, so it counts
		// as zero rather than as a subtraction.
		const start = new Date(iv.start).getTime();
		const stopMs = new Date(at).getTime();
		return { ...iv, stop: Number.isFinite(start) && stopMs < start ? iv.start : at };
	});
	return { intervals: next, closed };
}

/**
 * Checks one candidate interval against the rest of the list.
 *
 * `index` is the row being edited, so it can overlap its own old self.
 * Returns the first problem found, or `null` when the interval is fine.
 */
export function validateInterval(
	candidate: Interval,
	all: Interval[],
	index: number,
	now: number = Date.now()
): IntervalProblem | null {
	const start = new Date(candidate.start).getTime();
	if (Number.isNaN(start)) return 'editorEndBeforeStart';

	// A minute of clock skew between the member's device and the server is
	// normal and should not block an edit made "just now".
	const horizon = now + 60_000;
	if (start > horizon) return 'editorFuture';

	if (!candidate.stop) {
		// Still running — nothing else to check against.
		return null;
	}

	const stop = new Date(candidate.stop).getTime();
	if (Number.isNaN(stop) || stop <= start) return 'editorEndBeforeStart';
	if (stop > horizon) return 'editorFuture';
	if (stop - start > DAY_MS) return 'editorTooLong';

	for (let i = 0; i < all.length; i++) {
		if (i === index) continue;
		const other = all[i];
		if (!other?.start) continue;
		const oStart = new Date(other.start).getTime();
		const oStop = other.stop ? new Date(other.stop).getTime() : now;
		if (Number.isNaN(oStart) || Number.isNaN(oStop)) continue;
		// Touching endpoints are fine (09:00–10:00 then 10:00–11:00); a shared
		// interior instant is not.
		if (start < oStop && stop > oStart) return 'editorOverlap';
	}

	return null;
}

/**
 * A sensible default for an interval the member is adding by hand.
 *
 * Someone adding a row almost always forgot to start the timer for the work
 * they have just finished, so the default is the hour that just ended. When
 * that hour is already taken — most often by a timer still running — the slot
 * slides back to before whatever it collided with, so the row it offers is one
 * `validateInterval` will actually accept.
 */
export function suggestNewInterval(
	intervals: Interval[],
	now: number = Date.now()
): { start: string; stop: string } {
	const HOUR = HOUR_MS;
	let end = now;

	const busy = (intervals ?? [])
		.filter((iv) => iv?.start)
		.map((iv) => ({
			s: new Date(iv.start).getTime(),
			e: iv.stop ? new Date(iv.stop as string).getTime() : now
		}))
		.filter((x) => !Number.isNaN(x.s) && !Number.isNaN(x.e))
		.sort((a, b) => b.s - a.s);

	for (const iv of busy) {
		if (iv.s < end && iv.e > end - HOUR) end = iv.s;
	}

	return {
		start: new Date(end - HOUR).toISOString(),
		stop: new Date(end).toISOString()
	};
}

/** Strips UI-only fields so only `{ start, stop }` reaches Strapi. */
export function toPersistable(intervals: Interval[]): { start: string; stop: string | null }[] {
	return intervals.map((iv) => ({ start: iv.start, stop: iv.stop ?? null }));
}

/** Oldest-first, so the list always reads as a timeline. */
export function sortIntervals<T extends Interval>(intervals: T[]): T[] {
	return [...intervals].sort(
		(a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
	);
}

/** `2h 35m`, or `35m` under the hour — the same shape in every locale. */
export function formatDuration(ms: number): string {
	const total = Math.max(0, Math.round(ms / 60_000));
	const h = Math.floor(total / 60);
	const m = total % 60;
	return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
