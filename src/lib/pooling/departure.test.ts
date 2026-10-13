import { describe, it, expect } from 'vitest';
import { resolveTierPrice } from '$lib/server/maagad/offerStateMachine';
import {
	departureReadout,
	departureTerms,
	lineTag,
	linesFromMatanot,
	nextDropFromTiers,
	tierPriceAt
} from './departure';
import { priceAt, type BomLine } from './priceCurve';

// PLAN_POOL_PRODUCT §3.3 — the trip, as a matanot node from 443matanotForPoolOffer.
const node = {
	name: 'דרום אמריקה',
	marginPct: 0,
	matanot_recipe_missions: {
		data: [
			{
				id: '1',
				attributes: {
					hoursPerUnit: 80,
					unitsPerProduct: 1,
					ratePerHour: 150,
					costShape: 'shared',
					pendm: { data: { attributes: { name: 'הדרכה' } } }
				}
			}
		]
	},
	matanot_recipe_resources: {
		data: [
			{ id: '2', attributes: { quantityPerUnit: 1, pricePerUnit: 4000, costShape: null, pmash: { data: { attributes: { name: 'טיסה' } } } } },
			{ id: '3', attributes: { quantityPerUnit: 1, pricePerUnit: 1500, costShape: 'perUnit', mashabetahalich: { data: { attributes: { name: 'ארוחות' } } } } },
			{ id: '4', attributes: { quantityPerUnit: 1, pricePerUnit: 3000, costShape: 'stepped', stepCapacity: 2, pmash: { data: { attributes: { name: 'חדר' } } } } },
			{ id: '5', attributes: { quantityPerUnit: 1, pricePerUnit: 15000, costShape: 'stepped', stepCapacity: 20, pmash: { data: { attributes: { name: 'אוטובוס' } } } } }
		]
	}
};

describe('departure terms from a product (§4)', () => {
	const lines = linesFromMatanot(node);

	it('reads the recipe lines with their names and shapes', () => {
		expect(lines.map((l) => [l.kind, l.name, l.cost])).toEqual([
			['mission', 'הדרכה', 12000],
			['resource', 'טיסה', 4000],
			['resource', 'ארוחות', 1500],
			['resource', 'חדר', 3000],
			['resource', 'אוטובוס', 15000]
		]);
		expect(lineTag(lines[4])).toEqual({ shape: 'stepped', capacity: 20 });
		expect(lineTag(lines[1])).toEqual({ shape: 'perUnit', capacity: 1 });
	});

	it('min 8 / max 24 — the floor price, the ceiling at 8, a rise at 21', () => {
		const t = departureTerms(lines, 0, 8, 24);
		expect(t.priceCurrent).toBe(10375);
		expect(t).toMatchObject({ envelope: 10375, envelopeAt: 8 });
		expect(t.rising).toEqual([21]);
		expect(t.tiers[0]).toEqual({ min: 8, price: 10375 });
		expect(t.tiers.at(-1)?.min).toBe(24);
	});

	it('min 18 / max 24 — the ceiling is the second bus, not the floor (B8)', () => {
		expect(departureTerms(lines, 0, 18, 24)).toMatchObject({ envelope: 9071.43, envelopeAt: 21 });
	});

	it('the stored tiers give resolveTierPrice exactly priceAt(n) — no BOM needed', () => {
		const t = departureTerms(lines, 15, 8, 24);
		for (let n = 8; n <= 24; n++) {
			expect(resolveTierPrice(t.priceCurrent, t.tiers, n)).toBe(priceAt(lines as BomLine[], n, 15));
		}
		// below the floor the departure is not at that size — the floor's price
		expect(resolveTierPrice(t.priceCurrent, t.tiers, 3)).toBe(t.priceCurrent);
	});
});

describe('the departure readout (B9)', () => {
	const t = departureTerms(linesFromMatanot(node), 0, 8, 24);

	it('now · at most · the next drop', () => {
		expect(departureReadout(t.tiers, t.envelope, 12, 8)).toEqual({
			now: 9250,
			ceiling: 10375,
			nextDrop: { min: 13, price: priceAt(linesFromMatanot(node), 13) }
		});
	});

	it('before the floor is reached it shows the floor', () => {
		expect(departureReadout(t.tiers, t.envelope, 3, 8).now).toBe(10375);
	});

	it('at 20 nothing ahead is cheaper within max 24', () => {
		expect(nextDropFromTiers(t.tiers, 20)).toBeNull();
	});

	it('no tiers ⇒ nothing to read', () => {
		expect(tierPriceAt(null, 5)).toBeNull();
		expect(departureReadout(null, null, 5, 2)).toEqual({ now: null, ceiling: null, nextDrop: null });
	});
});
