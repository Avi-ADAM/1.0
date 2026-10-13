/**
 * A departure's moving price — PLAN_POOL_PRODUCT §4.2 (P3).
 *
 *   settleDeparturePrices — the cron: every live departure re-reads its BOM,
 *     re-prices, lets lapsed consents go, and tells what moved (merged per
 *     window). The same settlement runs right after a join or an exit.
 *   confirmDeparturePrice — "yes, I stay": the participant asked for a yes
 *     above the ceiling she joined under takes the new ceiling as hers.
 *
 * "The price doesn't suit me" is the ordinary unsignMaagadOffer: until the lock
 * nothing is closed, so leaving needs no reason and costs nothing (§1ב).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { loadDeparture, lockMs, settleDeparture, type SettleResult } from '$lib/server/pooling/settleDeparture';

const jwtRule = { type: 'jwt' as const, errorMessage: 'you must be logged in' };

const settleDeparturePricesHandler: ActionExecutionHandler = async (_params, context, util) => {
	const res = await util.strapi.execute('447listLiveDepartures', {}, undefined, context.fetch);
	const offers = res?.data?.maagadOffers?.data ?? [];
	const settled: SettleResult[] = [];
	for (const offer of offers) {
		try {
			const r = await settleDeparture(offer, context, util as any, { fromBom: true });
			if (r) settled.push(r);
		} catch (err) {
			// One broken departure must not stop the others from settling.
			console.error('[settleDeparturePrices] offer failed', offer?.id, err);
		}
	}
	return {
		data: {
			settled: settled.length,
			announced: settled.filter((r) => r.announcement === 'announce').map((r) => r.offerId),
			lapsed: settled.flatMap((r) => r.lapsed),
			maagadIds: [...new Set(settled.map((r) => r.maagadId).filter(Boolean))],
			partyIds: [...new Set(settled.flatMap((r) => r.partyIds))]
		}
	};
};

const confirmDeparturePriceHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
	const { offerId } = params as Record<string, any>;
	if (!offerId) throw new Error('offerId is required');
	const offer = await loadDeparture(strapi, context, String(offerId));
	const oa = offer?.attributes;
	if (!oa?.matanot?.data?.id) throw new Error('this offer has no moving price to confirm');
	const lock = lockMs(oa);
	if (lock != null && lock <= Date.now()) throw new Error('the price is already locked');

	const mine = (oa.signed_members?.data ?? []).find(
		(m: any) =>
			String(m?.attributes?.user?.data?.id) === String(context.userId) &&
			['signed', 'active'].includes(m?.attributes?.status_member)
	);
	if (!mine) throw new Error('you are not a participant of this departure');
	if (!mine.attributes?.price_window_until) return { data: { offerId, already: true } };

	// Her yes covers the ceiling as it stands now — not just today's price.
	const ceiling = Math.max(Number(oa.price_envelope) || 0, Number(oa.price_current) || 0);
	await strapi.execute(
		'446setMaagadMemberEnvelope',
		{ id: mine.id, envelope_at_sign: ceiling, price_window_until: null },
		undefined,
		context.fetch
	);
	return {
		data: {
			offerId: String(offerId),
			maagadId: oa.maagad?.data?.id ? String(oa.maagad.data.id) : null,
			envelopeAtSign: ceiling
		}
	};
};

export const departurePricingActions: ActionConfig[] = [
	{
		key: 'settleDeparturePrices',
		description: 'Batch (cron): re-price every live departure from its BOM, let lapsed consents go, tell what moved',
		graphqlOperation: settleDeparturePricesHandler,
		paramSchema: {},
		// The cron's service call only; a user has nothing to settle.
		access: ['serviceAdmin'],
		authRules: [jwtRule],
		realtime: {
			scopes: (_p, r) => scopeList((r?.data?.maagadIds ?? []).map((id: string) => scope('maagad', id))),
			audience: 'parties',
			partiesFrom: (_p, r) => r?.data?.partyIds ?? []
		}
	},
	{
		key: 'confirmDeparturePrice',
		description: 'A participant asked for a yes above her ceiling stays in, under the ceiling as it stands now',
		graphqlOperation: confirmDeparturePriceHandler,
		paramSchema: {
			offerId: { type: 'string', required: true, description: 'The departure (maagad offer)' }
		},
		authRules: [jwtRule],
		realtime: {
			scopes: (_p, r) => scopeList(r?.data?.maagadId ? [scope('maagad', r.data.maagadId)] : []),
			audience: 'self'
		}
	}
];
