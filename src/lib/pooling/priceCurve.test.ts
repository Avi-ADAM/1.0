import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
	costAt,
	curve,
	envelope,
	hasGroupCurve,
	lineUnitsAt,
	missionLineCost,
	nextDrop,
	priceAt,
	resourceLineCost,
	risingPoints,
	toBomLines,
	workAt,
	type BomLine
} from './priceCurve';

// PLAN_POOL_PRODUCT §3.3 — the South America trip.
const TRIP: BomLine[] = [
	{ cost: 4000, costShape: 'perUnit' }, // flight
	{ cost: 1500, costShape: null }, // meals — legacy null = perUnit
	{ cost: 3000, costShape: 'stepped', stepCapacity: 2 }, // a room for two
	{ cost: 15000, costShape: 'stepped', stepCapacity: 20 }, // a bus for 20
	{ cost: 12000, costShape: 'shared' } // the guide
];

describe('priceCurve — the saving reaches the participants (§9א)', () => {
	it('A1: shared-only — the price never rises with n, and n × price is the shared cost', () => {
		const bom: BomLine[] = [
			{ cost: 12000, costShape: 'shared' },
			{ cost: 900, costShape: 'shared' }
		];
		let prev = Infinity;
		for (let n = 1; n <= 60; n++) {
			const p = priceAt(bom, n, 10);
			expect(p).toBeLessThanOrEqual(prev);
			prev = p;
			expect(Math.abs(p * n - 12900 * 1.1)).toBeLessThan(n * 0.01);
		}
	});

	it('A2: the §3.3 fixture at margin 0', () => {
		expect(priceAt(TRIP, 8)).toBe(10375);
		expect(priceAt(TRIP, 12)).toBe(9250);
		expect(priceAt(TRIP, 16)).toBe(8687.5);
		expect(priceAt(TRIP, 18)).toBe(8500);
		expect(priceAt(TRIP, 20)).toBe(8350);
		expect(priceAt(TRIP, 21)).toBe(9071.43);
		// §3.3 / W1, W2: the 9th joins at a lower price; 32 is the first n back under 8,350
		expect(priceAt(TRIP, 9)).toBe(10166.67);
		expect(priceAt(TRIP, 32)).toBe(8312.5);
		expect(priceAt(TRIP, 40)).toBe(8050);
	});

	it('A3: at 15% the rikma keeps exactly its margin over cost, at every n', () => {
		for (let n = 8; n <= 24; n++) {
			const profit = n * priceAt(TRIP, n, 15) - costAt(TRIP, n);
			expect(Math.abs(profit - 0.15 * costAt(TRIP, n))).toBeLessThan(n * 0.01);
		}
	});

	it('A5: work for 8 and for 16 — shared stays one, perUnit scales, stepped adds instances', () => {
		const bom = [
			{ cost: 100, costShape: 'shared' as const, id: 'guide' },
			{ cost: 100, costShape: 'perUnit' as const, id: 'photo' },
			{ cost: 100, costShape: 'stepped' as const, stepCapacity: 15, id: 'escort' }
		];
		const at = (n: number) => Object.fromEntries(workAt(bom, n).map((w) => [w.line.id, w]));
		expect(at(8).guide).toMatchObject({ instances: 1, scale: 1 });
		expect(at(16).guide).toMatchObject({ instances: 1, scale: 1 });
		expect(at(8).photo).toMatchObject({ instances: 1, scale: 8 });
		expect(at(16).photo).toMatchObject({ instances: 1, scale: 16 });
		expect(at(8).escort).toMatchObject({ instances: 1, scale: 1 });
		expect(at(16).escort).toMatchObject({ instances: 2, scale: 1 });
	});

	it('A7: rounding — the participants together cover cost × margin, with less than n cents over', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						cost: fc.double({ min: 0, max: 50000, noNaN: true }),
						costShape: fc.constantFrom('perUnit', 'shared', 'stepped', null),
						stepCapacity: fc.integer({ min: 1, max: 30 })
					}),
					{ minLength: 1, maxLength: 6 }
				),
				fc.integer({ min: 1, max: 80 }),
				fc.double({ min: 0, max: 60, noNaN: true }),
				(bom, n, m) => {
					const owed = costAt(bom, n) * (1 + m / 100);
					const paid = priceAt(bom, n, m) * n;
					expect(paid).toBeGreaterThanOrEqual(owed - 1e-6);
					expect(paid - owed).toBeLessThan(n * 0.01 + 1e-6);
				}
			)
		);
	});
});

describe('envelope — the ceiling a participant joins under (B8)', () => {
	it('min 8 / max 24 — the ceiling is at 8', () => {
		expect(envelope(TRIP, 8, 24)).toEqual({ n: 8, price: 10375 });
	});

	it('min 18 / max 24 — the second bus at 21, not the price at min', () => {
		expect(envelope(TRIP, 18, 24)).toEqual({ n: 21, price: 9071.43 });
		expect(priceAt(TRIP, 18)).toBeLessThan(9071.43);
	});

	it('is ≥ the price at every n in range', () => {
		const env = envelope(TRIP, 3, 50).price;
		for (const p of curve(TRIP, 3, 50)) expect(env).toBeGreaterThanOrEqual(p.price);
	});

	it('with no max, searches up to min × 10 (capped at 500)', () => {
		expect(curve(TRIP, 8, null).at(-1)?.n).toBe(80);
		expect(curve(TRIP, 100, undefined).at(-1)?.n).toBe(500);
		// a bus is added past 80 too — the envelope still sees the full horizon
		const env = envelope(TRIP, 18, null);
		expect(env.price).toBeGreaterThanOrEqual(9071.43);
	});
});

describe('the shape of the curve', () => {
	it('risingPoints marks every n where one more makes it dearer for everyone', () => {
		const rising = risingPoints(TRIP, 8, 24).map((p) => p.n);
		expect(rising).toContain(21);
		// the 9th needs a room, but the shared part spreads further — not a rise (W1)
		expect(rising).not.toContain(9);
	});

	it('nextDrop finds the next lower price within max', () => {
		expect(nextDrop(TRIP, 12, 24)).toEqual({ n: 13, price: priceAt(TRIP, 13) });
		expect(nextDrop(TRIP, 20, 24)).toBeNull();
		expect(nextDrop(TRIP, 20, 40)?.n).toBe(32);
	});

	it('a stepped line without a capacity behaves as perUnit', () => {
		const l = { cost: 10, costShape: 'stepped', stepCapacity: null };
		expect(lineUnitsAt(l, 7)).toBe(7);
		expect(hasGroupCurve([l])).toBe(false);
	});

	it('atCost lines never enter the group curve (§6.2)', () => {
		const bom: BomLine[] = [
			{ cost: 400, priceMode: 'atCost' },
			{ cost: 60, costShape: 'stepped', stepCapacity: 5 }
		];
		expect(costAt(bom, 7)).toBe(120);
		expect(priceAt(bom, 1)).toBe(60);
	});

	it('an empty BOM is 0, not -0', () => {
		expect(Object.is(priceAt([], 1), 0)).toBe(true);
		expect(Object.is(priceAt([{ cost: 0, costShape: 'shared' }], 5, 20), 0)).toBe(true);
	});

	it('at n=1 every shape costs its line — a direct purchase pays the whole shared part', () => {
		expect(priceAt(TRIP, 1)).toBe(4000 + 1500 + 3000 + 15000 + 12000);
	});
});

describe('line costs from recipe rows', () => {
	it('matches the ComposeProduct arithmetic', () => {
		expect(missionLineCost({ hoursPerUnit: 3, unitsPerProduct: 2, ratePerHour: 100 })).toBe(600);
		expect(missionLineCost({ hoursPerUnit: 3, unitsPerProduct: null, ratePerHour: 100 })).toBe(300);
		expect(resourceLineCost({ quantityPerUnit: 4, pricePerUnit: 25 })).toBe(100);
		const bom = toBomLines(
			[{ hoursPerUnit: 10, ratePerHour: 120, costShape: 'shared' }],
			[{ quantityPerUnit: 1, pricePerUnit: 4000 }]
		);
		expect(bom).toEqual([
			{ cost: 1200, costShape: 'shared', stepCapacity: null },
			{ cost: 4000, costShape: null, stepCapacity: null, priceMode: null }
		]);
		expect(priceAt(bom, 4)).toBe(4300);
	});
});
