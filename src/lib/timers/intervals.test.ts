import { describe, it, expect } from 'vitest';
import {
	closeOpenIntervals,
	formatDuration,
	intervalMs,
	isRunning,
	openIntervals,
	sortIntervals,
	suggestNewInterval,
	toPersistable,
	totalHours,
	validateInterval
} from './intervals';

const iso = (h: number, m = 0) =>
	new Date(Date.UTC(2026, 0, 10, h, m)).toISOString();

/** A fixed "now" well after the fixtures, so nothing reads as future. */
const NOW = new Date(Date.UTC(2026, 0, 11, 0, 0)).getTime();

describe('totalHours', () => {
	it('sums closed intervals', () => {
		expect(
			totalHours([
				{ start: iso(9), stop: iso(10) },
				{ start: iso(12), stop: iso(13, 30) }
			])
		).toBeCloseTo(2.5);
	});

	it('ignores a running interval — the figure is what can be claimed', () => {
		expect(totalHours([{ start: iso(9), stop: iso(10) }, { start: iso(23) }])).toBeCloseTo(1);
	});

	it('survives junk without producing NaN', () => {
		// This is the shape that used to write NaN over a member's hours.
		expect(totalHours([{ start: 'nonsense', stop: null }])).toBe(0);
		expect(totalHours(null)).toBe(0);
	});
});

describe('intervalMs', () => {
	it('measures a running interval up to now', () => {
		const start = new Date(NOW - 90 * 60_000).toISOString();
		expect(intervalMs({ start }, NOW)).toBe(90 * 60_000);
	});

	it('is zero when the interval runs backwards', () => {
		expect(intervalMs({ start: iso(12), stop: iso(11) })).toBe(0);
	});
});

describe('validateInterval', () => {
	const list = [
		{ start: iso(9), stop: iso(10) },
		{ start: iso(12), stop: iso(13) }
	];

	it('accepts a clean interval in a free slot', () => {
		expect(validateInterval({ start: iso(15), stop: iso(16) }, [...list, { start: iso(15), stop: iso(16) }], 2, NOW)).toBeNull();
	});

	it('rejects an end before its start', () => {
		expect(validateInterval({ start: iso(16), stop: iso(15) }, list, -1, NOW)).toBe('editorEndBeforeStart');
	});

	it('rejects time that has not happened yet', () => {
		const later = new Date(NOW + 3 * 3_600_000).toISOString();
		const evenLater = new Date(NOW + 4 * 3_600_000).toISOString();
		expect(validateInterval({ start: later, stop: evenLater }, list, -1, NOW)).toBe('editorFuture');
	});

	it('rejects an overlap with another interval', () => {
		expect(validateInterval({ start: iso(9, 30), stop: iso(11) }, list, -1, NOW)).toBe('editorOverlap');
	});

	it('lets a row overlap its own old self', () => {
		expect(validateInterval({ start: iso(9), stop: iso(11) }, list, 0, NOW)).toBeNull();
	});

	it('allows intervals that touch at the endpoint', () => {
		expect(validateInterval({ start: iso(10), stop: iso(12) }, list, -1, NOW)).toBeNull();
	});

	it('flags a suspiciously long interval', () => {
		const start = new Date(Date.UTC(2026, 0, 8, 0)).toISOString();
		const stop = new Date(Date.UTC(2026, 0, 9, 6)).toISOString();
		expect(validateInterval({ start, stop }, [], -1, NOW)).toBe('editorTooLong');
	});

	it('has nothing to check on a running interval', () => {
		expect(validateInterval({ start: iso(9), stop: null }, list, -1, NOW)).toBeNull();
	});
});

describe('suggestNewInterval', () => {
	it('offers the hour that just ended when it is free', () => {
		const slot = suggestNewInterval([], NOW);
		expect(new Date(slot.stop).getTime()).toBe(NOW);
		expect(new Date(slot.start).getTime()).toBe(NOW - 3_600_000);
		expect(validateInterval(slot, [], -1, NOW)).toBeNull();
	});

	it('slides back past a running interval instead of colliding with it', () => {
		// A timer running since 30 minutes ago owns the last half hour.
		const running = [{ start: new Date(NOW - 30 * 60_000).toISOString(), stop: null }];
		const slot = suggestNewInterval(running, NOW);
		expect(new Date(slot.stop).getTime()).toBe(NOW - 30 * 60_000);
		expect(validateInterval(slot, [...running, slot], 1, NOW)).toBeNull();
	});

	it('keeps sliding past several back-to-back intervals', () => {
		const busy = [
			{ start: new Date(NOW - 30 * 60_000).toISOString(), stop: null },
			{
				start: new Date(NOW - 90 * 60_000).toISOString(),
				stop: new Date(NOW - 30 * 60_000).toISOString()
			}
		];
		const slot = suggestNewInterval(busy, NOW);
		expect(new Date(slot.stop).getTime()).toBe(NOW - 90 * 60_000);
		expect(validateInterval(slot, [...busy, slot], 2, NOW)).toBeNull();
	});
});

describe('helpers', () => {
	it('knows a running interval', () => {
		expect(isRunning({ start: iso(9) })).toBe(true);
		expect(isRunning({ start: iso(9), stop: iso(10) })).toBe(false);
	});

	it('sorts oldest first', () => {
		const sorted = sortIntervals([
			{ start: iso(12), stop: iso(13) },
			{ start: iso(9), stop: iso(10) }
		]);
		expect(sorted[0].start).toBe(iso(9));
	});

	it('strips UI-only fields before persisting', () => {
		expect(toPersistable([{ start: iso(9), stop: iso(10), isNew: true }])).toEqual([
			{ start: iso(9), stop: iso(10) }
		]);
	});

	it('formats durations', () => {
		expect(formatDuration(45 * 60_000)).toBe('45m');
		expect(formatDuration(2 * 3_600_000 + 5 * 60_000)).toBe('2h 5m');
	});
});

describe('closeOpenIntervals', () => {
	const AT = iso(20);

	it('closes every open interval, not just the last one', () => {
		// The shape that produced a 390-hour month: two intervals were opened and
		// only the newest was ever stopped, so the older one kept counting to now.
		const { intervals, closed } = closeOpenIntervals(
			[{ start: iso(9) }, { start: iso(12), stop: iso(13) }, { start: iso(18) }],
			AT
		);
		expect(closed).toBe(2);
		expect(intervals.every((iv) => Boolean(iv.stop))).toBe(true);
		expect(intervals[0].stop).toBe(AT);
		expect(intervals[1].stop).toBe(iso(13));
		expect(intervals[2].stop).toBe(AT);
	});

	it('is a no-op when nothing is open, so repeating a stop is safe', () => {
		const rows = [{ start: iso(9), stop: iso(10) }];
		const { intervals, closed } = closeOpenIntervals(rows, AT);
		expect(closed).toBe(0);
		expect(intervals).toEqual(rows);
	});

	it('never produces a negative interval when the clock disagrees', () => {
		// A start in the future of `at` would otherwise subtract from the total.
		const { intervals } = closeOpenIntervals([{ start: iso(22) }], AT);
		expect(intervals[0].stop).toBe(iso(22));
		expect(totalHours(intervals)).toBe(0);
	});

	it('makes the closed hours claimable — an open interval counts as zero', () => {
		const rows = [{ start: iso(9) }];
		expect(totalHours(rows)).toBe(0);
		expect(totalHours(closeOpenIntervals(rows, iso(11)).intervals)).toBeCloseTo(2);
	});

	it('tolerates junk and empties', () => {
		expect(closeOpenIntervals(null, AT)).toEqual({ intervals: [], closed: 0 });
		expect(closeOpenIntervals([], AT)).toEqual({ intervals: [], closed: 0 });
	});
});

describe('openIntervals', () => {
	it('names the intervals that were started and never stopped', () => {
		expect(
			openIntervals([{ start: iso(9), stop: iso(10) }, { start: iso(12) }]).map((iv) => iv.start)
		).toEqual([iso(12)]);
	});
});
