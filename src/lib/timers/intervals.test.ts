import { describe, it, expect } from 'vitest';
import {
	formatDuration,
	intervalMs,
	isRunning,
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
