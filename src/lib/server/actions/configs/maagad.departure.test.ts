/**
 * A maagad offer made out of a rikma's product — PLAN_POOL_PRODUCT §4, P2.
 *
 * The price is derived from the BOM and written only through the service-only
 * qids (445 / 446): the client's unitPrice / priceTiers are ignored (A4), a
 * signer gets the ceiling she saw and no price (B1), and an offer without a
 * product behaves exactly as before (B10).
 */

import { describe, it, expect, vi } from 'vitest';
import { maagadActions } from './maagad.js';

const handlerOf = (key: string) =>
	maagadActions.find((a) => a.key === key)!.graphqlOperation as (
		params: Record<string, any>,
		context: any,
		util: any
	) => Promise<any>;

const createOffer = handlerOf('createMaagadOffer');
const signOffer = handlerOf('signMaagadOffer');
const unsignOffer = handlerOf('unsignMaagadOffer');

const context = { userId: '5', jwt: 'jwt', fetch: (() => {}) as any };
const future = new Date(Date.now() + 7 * 86400_000).toISOString();

// §3.3, min 8 / max 24 ⇒ floor 10,375, ceiling 10,375 (at 8).
const trip = {
	name: 'דרום אמריקה',
	pricingMode: 'estimated',
	marginPct: 0,
	status_of_voting: 'active',
	projectcreates: { data: [{ id: '90', attributes: { user_1s: { data: [{ id: '5' }, { id: '6' }] } } }] },
	matanot_recipe_missions: {
		data: [{ id: '1', attributes: { hoursPerUnit: 80, unitsPerProduct: 1, ratePerHour: 150, costShape: 'shared' } }]
	},
	matanot_recipe_resources: {
		data: [
			{ id: '2', attributes: { quantityPerUnit: 1, pricePerUnit: 4000 } },
			{ id: '3', attributes: { quantityPerUnit: 1, pricePerUnit: 1500 } },
			{ id: '4', attributes: { quantityPerUnit: 1, pricePerUnit: 3000, costShape: 'stepped', stepCapacity: 2 } },
			{ id: '5', attributes: { quantityPerUnit: 1, pricePerUnit: 15000, costShape: 'stepped', stepCapacity: 20 } }
		]
	}
};

function fakeStrapi({
	product = trip as any,
	offer = null as any,
	member = null as any,
	memberOfProjects = [] as string[]
} = {}) {
	const execute = vi.fn(async (qid: string, vars: Record<string, any>, _jwt?: string) => {
		switch (qid) {
			case '65checkProjectMembership':
				return {
					data: {
						usersPermissionsUser: {
							data: {
								attributes: {
									projects_1s: { data: memberOfProjects.includes(vars.projectId) ? [{ id: vars.projectId }] : [] }
								}
							}
						}
					}
				};
			case '443matanotForPoolOffer':
				return { data: { matanot: { data: product ? { id: vars.id, attributes: product } : null } } };
			case '229queryMaagadFull':
				return {
					data: {
						maagad: {
							data: {
								id: '7',
								attributes: {
									status_maagad: 'visible',
									members: { data: [] },
									offers: { data: offer ? [offer] : [] }
								}
							}
						}
					}
				};
			case '231queryMyMaagadMember':
				return { data: { maagadMembers: { data: member ? [member] : [] } } };
			case '225crMaagadMember':
				return { data: { createMaagadMember: { data: { id: '70' } } } };
			case '227crMaagadOffer':
				return { data: { createMaagadOffer: { data: { id: '300' } } } };
			case '226updateMaagadMember':
			case '228updateMaagadOffer':
			case '230updateMaagad':
			case '445setMaagadOfferPricing':
			case '446setMaagadMemberEnvelope':
				return {};
			default:
				throw new Error(`unexpected qid ${qid}`);
		}
	});
	const callsOf = (qid: string) => execute.mock.calls.filter(([q]) => q === qid);
	return { strapi: { execute }, callsOf, varsOf: (qid: string) => callsOf(qid).map(([, v]) => v) };
}

const base = { maagadId: '7', minParticipants: 8, maxParticipants: 24, signDeadline: future };

describe('createMaagadOffer — a departure of a product', () => {
	it('A4: ignores a hand-typed price and tiers; derives current + ceiling from the BOM', async () => {
		const { strapi, varsOf, callsOf } = fakeStrapi();
		const out = await createOffer(
			{ ...base, matanotId: '40', unitPrice: 1, priceTiers: [{ min: 2, price: 1 }] },
			context,
			{ strapi }
		);
		expect(varsOf('227crMaagadOffer')[0]).toMatchObject({
			title: 'דרום אמריקה', // the product's name when no title is typed
			unit_price: 10375,
			price_tiers: null,
			proposer_project: '90'
		});
		const pricing = varsOf('445setMaagadOfferPricing')[0];
		expect(pricing).toMatchObject({
			id: '300',
			matanot: '40',
			price_current: 10375,
			price_envelope: 10375,
			price_lock_at: future
		});
		expect(pricing.price_tiers).toHaveLength(24 - 8 + 1);
		expect(pricing.price_tiers.find((t: any) => t.min === 21).price).toBe(9071.43);
		// the pricing write is the service token's, never the caller's
		expect(callsOf('445setMaagadOfferPricing')[0][2]).toBeUndefined();
		expect(out.data).toMatchObject({ offerId: '300', priceCurrent: 10375, priceEnvelope: 10375 });
	});

	it("refuses a product of a rikma the caller is not in, before anything is written", async () => {
		const { strapi, callsOf } = fakeStrapi({ product: { ...trip, projectcreates: { data: [{ id: '91', attributes: { user_1s: { data: [{ id: '6' }] } } }] } } });
		await expect(createOffer({ ...base, matanotId: '40' }, context, { strapi })).rejects.toThrow(/member of the rikma/);
		expect(callsOf('227crMaagadOffer')).toHaveLength(0);
		expect(callsOf('445setMaagadOfferPricing')).toHaveLength(0);
	});

	it('refuses a product still in its vote, and a simple product', async () => {
		const voting = fakeStrapi({ product: { ...trip, status_of_voting: 'voting' } });
		await expect(createOffer({ ...base, matanotId: '40' }, context, { strapi: voting.strapi })).rejects.toThrow(/not open for sale/);
		const simple = fakeStrapi({ product: { ...trip, pricingMode: 'fixed' } });
		await expect(createOffer({ ...base, matanotId: '40' }, context, { strapi: simple.strapi })).rejects.toThrow(/composed product/);
	});

	it('B10: an offer without a product works exactly as before', async () => {
		const { strapi, varsOf, callsOf } = fakeStrapi();
		await createOffer(
			{ ...base, title: 'סל ירקות', unitPrice: 120, priceTiers: [{ min: 10, price: 100 }] },
			context,
			{ strapi }
		);
		expect(varsOf('227crMaagadOffer')[0]).toMatchObject({
			title: 'סל ירקות',
			unit_price: 120,
			price_tiers: [{ min: 10, price: 100 }],
			proposer_project: null
		});
		expect(callsOf('443matanotForPoolOffer')).toHaveLength(0);
		expect(callsOf('445setMaagadOfferPricing')).toHaveLength(0);
	});

	it('B10: a plain offer still needs its price', async () => {
		const { strapi } = fakeStrapi();
		await expect(createOffer({ ...base, title: 'x' }, context, { strapi })).rejects.toThrow(/unitPrice/);
	});
});

describe('createMaagadOffer — a plain offer in a rikma\'s name', () => {
	const plain = { ...base, title: 'סל ירקות', unitPrice: 120, proposerProjectId: '90' };

	it('refuses a rikma the caller is not a member of, before anything is written', async () => {
		const { strapi, callsOf, varsOf } = fakeStrapi({ memberOfProjects: ['91'] });
		await expect(createOffer(plain, context, { strapi })).rejects.toThrow(/member of the rikma/);
		expect(varsOf('65checkProjectMembership')).toEqual([{ uid: '5', projectId: '90' }]);
		expect(callsOf('227crMaagadOffer')).toHaveLength(0);
		expect(callsOf('224crMaagad')).toHaveLength(0);
	});

	it('refuses before creating a wrapper pool, too (Track C)', async () => {
		const { strapi, callsOf } = fakeStrapi();
		const { maagadId: _omit, ...noPool } = plain;
		await expect(
			createOffer({ ...noPool, newMaagad: { name: 'x', scope: 'global' } }, context, { strapi })
		).rejects.toThrow(/member of the rikma/);
		expect(callsOf('224crMaagad')).toHaveLength(0);
	});

	it("a member's offer carries the rikma", async () => {
		const { strapi, varsOf } = fakeStrapi({ memberOfProjects: ['90'] });
		await createOffer(plain, context, { strapi });
		expect(varsOf('227crMaagadOffer')[0]).toMatchObject({ proposer_project: '90', proposer_user: '5' });
	});

	it('an offer with no rikma asks nothing', async () => {
		const { strapi, callsOf } = fakeStrapi();
		const { proposerProjectId: _omit, ...solo } = plain;
		await createOffer(solo, context, { strapi });
		expect(callsOf('65checkProjectMembership')).toHaveLength(0);
	});
});

describe('maagad writes go out under the service token', () => {
	// The write qids are serviceAdmin-only in qidsAccess.js; a write under the
	// caller's jwt would fail in production, and a direct /api/send call is refused.
	const WRITES = /^(22[4-8]|230|235|267|44[56])/;
	const jwtWrites = (calls: any[][]) => calls.filter(([q, , jwt]) => WRITES.test(q) && jwt !== undefined).map(([q]) => q);

	it('createMaagadOffer, signMaagadOffer and unsignMaagadOffer', async () => {
		const create = fakeStrapi({ memberOfProjects: ['90'] });
		await createOffer({ ...base, matanotId: '40' }, context, { strapi: create.strapi });
		await createOffer({ ...base, title: 'x', unitPrice: 1, proposerProjectId: '90' }, context, { strapi: create.strapi });

		const offer = {
			id: '300',
			attributes: { status_offer: 'open', signed_count: 1, min_participants: 2, sign_deadline: future, proposer_user: { data: { id: '9' } } }
		};
		const sign = fakeStrapi({ offer });
		await signOffer({ maagadId: '7', offerId: '300' }, context, { strapi: sign.strapi });
		const unsign = fakeStrapi({ offer, member: { id: '70', attributes: { signed_offer: { data: { id: '300' } } } } });
		await unsignOffer({ maagadId: '7', offerId: '300' }, context, { strapi: unsign.strapi });

		for (const f of [create, sign, unsign]) {
			expect(f.strapi.execute.mock.calls.some(([q]) => WRITES.test(q))).toBe(true);
			expect(jwtWrites(f.strapi.execute.mock.calls)).toEqual([]);
		}
	});
});

describe('signing a departure (B1)', () => {
	const tiers = Array.from({ length: 17 }, (_, i) => ({ min: 8 + i, price: 10000 - i * 100 }));
	const departure = {
		id: '300',
		attributes: {
			status_offer: 'open',
			signed_count: 11,
			min_participants: 8,
			max_participants: 24,
			sign_deadline: future,
			unit_price: 10000,
			price_tiers: tiers,
			price_envelope: 10375,
			matanot: { data: { id: '40' } },
			proposer_user: { data: { id: '9' } }
		}
	};

	it("records the ceiling she saw — not a price — and re-reads the offer's price at 12", async () => {
		const { strapi, varsOf, callsOf } = fakeStrapi({ offer: departure });
		await signOffer({ maagadId: '7', offerId: '300' }, context, { strapi });
		expect(varsOf('446setMaagadMemberEnvelope')).toEqual([{ id: '70', envelope_at_sign: 10375 }]);
		expect(callsOf('446setMaagadMemberEnvelope')[0][2]).toBeUndefined();
		// no fixed price on her, and no deal before activation
		expect(varsOf('226updateMaagadMember')[0]).not.toHaveProperty('price');
		expect(callsOf('235crMaagadSheirutpend')).toHaveLength(0);
		expect(varsOf('445setMaagadOfferPricing')).toEqual([{ id: '300', price_current: 9600 }]);
	});

	it('leaving re-reads the price at the smaller size', async () => {
		const { strapi, varsOf } = fakeStrapi({
			offer: departure,
			member: { id: '70', attributes: { signed_offer: { data: { id: '300' } } } }
		});
		await unsignOffer({ maagadId: '7', offerId: '300' }, context, { strapi });
		expect(varsOf('445setMaagadOfferPricing')).toEqual([{ id: '300', price_current: 9800 }]);
	});

	it('B10: signing a plain offer writes no ceiling and no price', async () => {
		const plain = { id: '300', attributes: { ...departure.attributes, matanot: { data: null }, price_envelope: null } };
		const { strapi, callsOf } = fakeStrapi({ offer: plain });
		await signOffer({ maagadId: '7', offerId: '300' }, context, { strapi });
		expect(callsOf('446setMaagadMemberEnvelope')).toHaveLength(0);
		expect(callsOf('445setMaagadOfferPricing')).toHaveLength(0);
	});
});
