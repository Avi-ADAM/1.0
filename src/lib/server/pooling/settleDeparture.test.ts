/**
 * The price settlement of a departure — PLAN_POOL_PRODUCT §4.2 (P3).
 * A fake Strapi records the writes; a fake notifier records who was told what.
 */

import { describe, it, expect, vi } from 'vitest';
import { settleDeparture } from './settleDeparture';
import { departureTerms, linesFromMatanot } from '$lib/pooling/departure';

const H = 3600_000;
const now = Date.parse('2026-10-14T10:00:00Z');
const iso = (t: number) => new Date(t).toISOString();

// §3.3 trip, min 8 / max 24.
const product = {
	name: 'דרום אמריקה',
	marginPct: 0,
	matanot_recipe_missions: { data: [{ id: '1', attributes: { hoursPerUnit: 80, unitsPerProduct: 1, ratePerHour: 150, costShape: 'shared' } }] },
	matanot_recipe_resources: {
		data: [
			{ id: '2', attributes: { quantityPerUnit: 1, pricePerUnit: 4000 } },
			{ id: '3', attributes: { quantityPerUnit: 1, pricePerUnit: 1500 } },
			{ id: '4', attributes: { quantityPerUnit: 1, pricePerUnit: 3000, costShape: 'stepped', stepCapacity: 2 } },
			{ id: '5', attributes: { quantityPerUnit: 1, pricePerUnit: 15000, costShape: 'stepped', stepCapacity: 20 } }
		]
	}
};
const terms = departureTerms(linesFromMatanot(product), 0, 8, 24);

function member(i: number, extra: Record<string, unknown> = {}) {
	return {
		id: `m${i}`,
		attributes: { status_member: 'signed', envelope_at_sign: 10375, price_window_until: null, user: { data: { id: `u${i}` } }, ...extra }
	};
}

function offer(signed: any[], extra: Record<string, unknown> = {}) {
	return {
		id: '300',
		attributes: {
			title: 'דרום אמריקה · מרץ',
			status_offer: 'quorum_reached',
			signed_count: signed.length,
			min_participants: 8,
			max_participants: 24,
			sign_deadline: iso(now + 30 * 24 * H),
			price_lock_at: iso(now + 30 * 24 * H),
			unit_price: terms.priceCurrent,
			price_tiers: terms.tiers,
			price_envelope: terms.envelope,
			price_current: null,
			price_announced: null,
			price_notice_until: null,
			maagad: { data: { id: '7' } },
			matanot: { data: { id: '40' } },
			proposer_user: { data: { id: '9' } },
			proposer_project: { data: { id: '90', attributes: { restime: 'feh', currencyCode: 'ILS' } } },
			signed_members: { data: signed },
			...extra
		}
	};
}

function harness(bom = product) {
	const execute = vi.fn(async (qid: string, _vars: Record<string, any>, _jwt?: string) => {
		if (qid === '443matanotForPoolOffer') return { data: { matanot: { data: { id: '40', attributes: bom } } } };
		return {};
	});
	const notify = vi.fn(async () => {});
	const writes = (qid: string) => execute.mock.calls.filter(([q]) => q === qid).map(([, v]) => v);
	const told = () =>
		(notify.mock.calls as any[]).map(([cfg, , res]) => ({ intent: cfg.intent, to: res.recipientIds, title: cfg.templates.title.he }));
	return { util: { strapi: { execute }, notifier: { notify } }, execute, writes, told };
}

const ctx = { userId: 'system', fetch: (() => {}) as any };
const members = (n: number) => Array.from({ length: n }, (_, i) => member(i));

describe('settleDeparture', () => {
	it('first sight: stores the price and its baseline, tells nobody', async () => {
		const h = harness();
		const r = await settleDeparture(offer(members(12)), ctx, h.util, { nowMs: now });
		expect(r?.announcement).toBe('baseline');
		expect(h.writes('445setMaagadOfferPricing')).toEqual([{ id: '300', price_current: 9250, price_announced: 9250 }]);
		expect(h.told()).toEqual([]);
	});

	it('A6: the 13th joined — everyone hears the price dropped, nobody is asked', async () => {
		const h = harness();
		await settleDeparture(offer(members(13), { price_current: 9250, price_announced: 9250 }), ctx, h.util, { nowMs: now });
		const w = h.writes('445setMaagadOfferPricing')[0];
		expect(w).toMatchObject({ price_current: 9192.31, price_announced: 9192.31, price_notice_until: iso(now + 48 * H) });
		expect(h.told()).toEqual([{ intent: 'personal', to: members(13).map((m) => m.attributes.user.data.id), title: 'המחיר ביציאה ירד' }]);
		expect(h.writes('446setMaagadMemberEnvelope')).toEqual([]);
	});

	it('B2: one left — the rest hear of a rise inside their ceiling; nobody needs to answer', async () => {
		const h = harness();
		await settleDeparture(offer(members(11), { price_current: 9250, price_announced: 9250 }), ctx, h.util, { nowMs: now });
		expect(h.told()).toEqual([expect.objectContaining({ intent: 'personal', title: 'המחיר ביציאה עלה' })]);
		expect(h.writes('446setMaagadMemberEnvelope')).toEqual([]);
	});

	it('B2b: moves inside an open window wait — the price is stored, nothing is said', async () => {
		const h = harness();
		await settleDeparture(
			offer(members(10), { price_current: 9250, price_announced: 9250, price_notice_until: iso(now + 5 * H) }),
			ctx,
			h.util,
			{ nowMs: now }
		);
		expect(h.writes('445setMaagadOfferPricing')).toEqual([{ id: '300', price_current: priceAt(10) }]);
		expect(h.told()).toEqual([]);
	});

	it("B4/B7: a BOM update lifts the ceiling — each is asked for her yes, with her own window", async () => {
		const dearer = structuredClone(product);
		dearer.matanot_recipe_resources.data[0].attributes.pricePerUnit = 4500; // flights +500
		const h = harness(dearer);
		await settleDeparture(offer(members(12), { price_current: 9250, price_announced: 9250 }), ctx, h.util, {
			nowMs: now,
			fromBom: true
		});
		const w = h.writes('445setMaagadOfferPricing')[0];
		expect(w).toMatchObject({ price_envelope: 10875, price_current: 9750 });
		expect(h.told()).toEqual([expect.objectContaining({ intent: 'consent', title: 'נדרש אישור: המחיר עבר את התקרה' })]);
		expect(h.writes('446setMaagadMemberEnvelope')).toHaveLength(12);
		expect(h.writes('446setMaagadMemberEnvelope')[0]).toEqual({ id: 'm0', price_window_until: iso(now + 48 * H) });
	});

	it('B4: silence above her ceiling until the window closes ⇒ she is out, not charged; the rest hear the move', async () => {
		const h = harness();
		const signed = members(12).map((m, i) =>
			i === 0 ? member(0, { envelope_at_sign: 9000, price_window_until: iso(now - 1) }) : m
		);
		const r = await settleDeparture(offer(signed, { price_current: 9250, price_announced: 9250 }), ctx, h.util, { nowMs: now });
		expect(r?.lapsed).toEqual(['m0']);
		expect(h.writes('226updateMaagadMember')).toEqual([
			{ id: 'm0', status_member: 'interested', signed_offer: null, signedAt: null }
		]);
		expect(h.writes('228updateMaagadOffer')).toEqual([{ id: '300', signed_count: 11 }]);
		// 11 left: the price rose inside everyone else's ceiling
		expect(h.writes('445setMaagadOfferPricing')[0]).toMatchObject({ price_current: priceAt(11) });
		expect(h.told()[0].to).not.toContain('u0');
	});

	it('A6 (activated): every live deal follows the drop; an archived one is left alone', async () => {
		const h = harness();
		const signed = members(13).map((m, i) => ({
			...m,
			attributes: {
				...m.attributes,
				status_member: 'active',
				sheirutpend: { data: { id: `p${i}`, attributes: { price: 9250, archived: i === 12 } } }
			}
		}));
		const r = await settleDeparture(
			offer(signed, { status_offer: 'activated', price_current: 9250, price_announced: 9250 }),
			ctx,
			h.util,
			{ nowMs: now }
		);
		expect(r?.repriced).toBe(12);
		expect(h.writes('449repriceDeparturePend')[0]).toEqual({ id: 'p0', price: 9192.31, total: 9192.31 });
	});

	it('B6a: a lapsed consent after activation archives her deal too', async () => {
		const h = harness();
		const signed = members(12).map((m, i) => ({
			...m,
			attributes: {
				...m.attributes,
				status_member: 'active',
				...(i === 0 ? { envelope_at_sign: 9000, price_window_until: iso(now - 1) } : {}),
				sheirutpend: { data: { id: `p${i}`, attributes: { price: 9250, archived: false } } }
			}
		}));
		await settleDeparture(
			offer(signed, { status_offer: 'activated', price_current: 9250, price_announced: 9250 }),
			ctx,
			h.util,
			{ nowMs: now }
		);
		expect(h.writes('450archiveDeparturePend')).toEqual([{ id: 'p0' }]);
		expect(h.writes('449repriceDeparturePend').map((v) => v.id)).not.toContain('p0');
	});

	it('B6: after the lock the price no longer moves', async () => {
		const h = harness();
		const r = await settleDeparture(offer(members(12), { price_lock_at: iso(now - 1) }), ctx, h.util, { nowMs: now });
		expect(r).toBeNull();
		expect(h.execute).not.toHaveBeenCalled();
	});

	it('a plain offer (no product) is not a departure', async () => {
		const h = harness();
		expect(await settleDeparture(offer(members(3), { matanot: { data: null } }), ctx, h.util, { nowMs: now })).toBeNull();
	});
});

function priceAt(n: number) {
	return terms.tiers.find((t) => t.min === n)!.price;
}
