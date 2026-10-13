import { describe, it, expect } from 'vitest';
import { classifyMove, lapsedConsents, planAnnouncement, type Participant } from './repricing';

const H = 3600_000;
const now = Date.parse('2026-10-14T10:00:00Z');

describe('classifyMove (§4.2)', () => {
	it('down / up inside the ceiling / above it / no move', () => {
		expect(classifyMove(9250, 8687.5, 10375)).toBe('down');
		expect(classifyMove(8687.5, 9250, 10375)).toBe('upWithin');
		expect(classifyMove(10375, 11200, 10375)).toBe('aboveEnvelope');
		expect(classifyMove(9250, 9250, 10375)).toBe('none');
	});

	it('B7: a BOM update that lifts the ceiling above hers asks her, even if today is cheaper', () => {
		expect(classifyMove(9250, 9100, 10375, 10875)).toBe('aboveEnvelope');
		expect(classifyMove(9250, 9100, 10375, 10375)).toBe('down');
	});

	it('a participant with no recorded ceiling (a plain offer) is never asked', () => {
		expect(classifyMove(100, 140, null)).toBe('upWithin');
	});
});

const members = (...envelopes: Array<number | null>): Participant[] =>
	envelopes.map((e, i) => ({ memberId: `m${i}`, userId: `u${i}`, envelopeAtSign: e }));

describe('planAnnouncement', () => {
	const base = { envelopeNow: 10375, nowMs: now, windowMs: 48 * H, noticeUntilMs: null };

	it('first sight remembers the price and tells nobody', () => {
		expect(
			planAnnouncement({ ...base, priceNow: 9250, announced: null, participants: members(10375) })
		).toEqual({ action: 'baseline', price: 9250 });
	});

	it('A6: a drop reaches everyone, and nobody is asked anything', () => {
		const a = planAnnouncement({ ...base, priceNow: 9192.31, announced: 9250, participants: members(10375, 10375) });
		expect(a).toMatchObject({ action: 'announce', from: 9250, price: 9192.31, windowUntilMs: now + 48 * H });
		if (a.action !== 'announce') throw new Error();
		expect(a.notices.map((n) => n.move)).toEqual(['down', 'down']);
	});

	it('B2: an exit raises the price inside the ceiling — a notice, no yes needed', () => {
		const a = planAnnouncement({ ...base, priceNow: 9250, announced: 9192.31, participants: members(10375) });
		if (a.action !== 'announce') throw new Error();
		expect(a.notices).toEqual([{ memberId: 'm0', userId: 'u0', move: 'upWithin' }]);
	});

	it('B2b: moves inside an open window wait for its end and merge', () => {
		const a = planAnnouncement({
			...base,
			noticeUntilMs: now + 5 * H,
			priceNow: 9800,
			announced: 9250,
			participants: members(10375)
		});
		expect(a).toEqual({ action: 'defer', untilMs: now + 5 * H });
		// at the window's end: one notice, measured from what they were last told
		const b = planAnnouncement({
			...base,
			nowMs: now + 5 * H,
			noticeUntilMs: now + 5 * H,
			priceNow: 10166.67,
			announced: 9250,
			participants: members(10375)
		});
		expect(b).toMatchObject({ action: 'announce', from: 9250, price: 10166.67 });
	});

	it('each participant is judged against her own ceiling', () => {
		const a = planAnnouncement({ ...base, priceNow: 10200, announced: 9250, participants: members(10375, 10000) });
		if (a.action !== 'announce') throw new Error();
		expect(a.notices.map((n) => n.move)).toEqual(['upWithin', 'aboveEnvelope']);
	});

	it('someone already asked for a yes is not asked again', () => {
		const ps = members(10375, 10000);
		ps[1].windowUntilMs = now + 10 * H;
		const a = planAnnouncement({ ...base, priceNow: 10300, announced: 10200, participants: ps });
		if (a.action !== 'announce') throw new Error();
		expect(a.notices.map((n) => n.memberId)).toEqual(['m0']);
	});

	it('no move ⇒ nothing', () => {
		expect(planAnnouncement({ ...base, priceNow: 9250, announced: 9250, participants: members(10375) })).toEqual({
			action: 'none'
		});
	});
});

describe('lapsedConsents (B4: silence above the ceiling is not a yes)', () => {
	it('her window ran out and the price is still above her ceiling ⇒ out', () => {
		const ps = members(10000, 10000, 10375);
		ps[0].windowUntilMs = now - 1; // asked, silent, window over
		ps[1].windowUntilMs = now + H; // still has time
		// ps[2] was never asked (inside her ceiling)
		expect(lapsedConsents(ps, 10200, 10375, now).map((p) => p.memberId)).toEqual(['m0']);
	});

	it('if the price came back under her ceiling meanwhile, she stays', () => {
		const ps = members(10000);
		ps[0].windowUntilMs = now - 1;
		expect(lapsedConsents(ps, 9900, 9950, now)).toEqual([]);
	});
});
