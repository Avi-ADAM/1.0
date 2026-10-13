/**
 * The price settlement of one departure — PLAN_POOL_PRODUCT §4.2 (P3).
 *
 * Run after every join or exit, and by the maagad cron for every live
 * departure. In order:
 *   1. (cron) re-derive the curve from the product's BOM — a BOM update moves
 *      the price and may lift the ceiling (B7);
 *   2. the price at the current size → `price_current`;
 *   3. whoever was asked for a yes above her ceiling and let the window run
 *      out leaves: back to `interested`, not charged (silence above the
 *      ceiling is not consent, §1ב);
 *   4. tell the participants what moved since they were last told, merging
 *      moves inside an open window into one notice (§4.2).
 *
 * Until the lock nothing is closed: anyone may leave at any moment with a
 * full refund, so the notices only say what silence means.
 *
 * Every write here is the service token's: these qids are serviceAdmin-only.
 */

import { departureTerms, linesFromMatanot, tierPriceAt, type PriceTier } from '$lib/pooling/departure';
import { lapsedConsents, planAnnouncement, type Notice, type Participant } from '$lib/pooling/repricing';
import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils';
import type { NotificationConfig } from '$lib/server/actions/types';

const SIGNED = new Set(['signed', 'active']);

type Util = { strapi: any; notifier?: { notify: (...a: any[]) => Promise<any> } };

export type SettleResult = {
	offerId: string;
	maagadId: string | null;
	priceCurrent: number | null;
	lapsed: string[];
	announcement: string;
	notified: number;
	/** Live deals re-priced (an activated departure). */
	repriced: number;
	partyIds: string[];
};

const ms = (iso: unknown): number | null => {
	if (!iso) return null;
	const t = new Date(String(iso)).getTime();
	return Number.isFinite(t) ? t : null;
};

/** The lock: price_lock_at, or the sign deadline for an offer that predates it. */
export function lockMs(oa: any): number | null {
	return ms(oa?.price_lock_at) ?? ms(oa?.sign_deadline);
}

function signedParticipants(oa: any): Array<Participant & { node: any }> {
	return (oa?.signed_members?.data ?? [])
		.filter((m: any) => SIGNED.has(m?.attributes?.status_member))
		.map((m: any) => ({
			node: m,
			memberId: String(m.id),
			userId: m?.attributes?.user?.data?.id ? String(m.attributes.user.data.id) : null,
			envelopeAtSign: m?.attributes?.envelope_at_sign ?? null,
			windowUntilMs: ms(m?.attributes?.price_window_until)
		}));
}

export async function loadDeparture(strapi: any, context: any, offerId: string) {
	const res = await strapi.execute('448queryDeparture', { id: offerId }, undefined, context.fetch);
	return res?.data?.maagadOffer?.data ?? null;
}

export async function settleDeparture(
	offer: any,
	context: any,
	util: Util,
	opts: { nowMs?: number; fromBom?: boolean } = {}
): Promise<SettleResult | null> {
	const { strapi } = util;
	const nowMs = opts.nowMs ?? Date.now();
	const offerId = String(offer?.id ?? '');
	const oa = offer?.attributes ?? {};
	if (!offerId || !oa.matanot?.data?.id) return null;
	const lock = lockMs(oa);
	// After the lock the price no longer moves, and nobody is asked anything (§4.1).
	if (lock != null && lock <= nowMs) return null;

	const min = Number(oa.min_participants) || 1;
	const max = oa.max_participants != null ? Number(oa.max_participants) : null;
	let tiers: PriceTier[] | null = Array.isArray(oa.price_tiers) ? oa.price_tiers : null;
	let envelope: number | null = oa.price_envelope != null ? Number(oa.price_envelope) : null;
	const write: Record<string, unknown> = {};

	// 1. The BOM may have changed since the curve was stored (B7).
	if (opts.fromBom) {
		const res = await strapi.execute('443matanotForPoolOffer', { id: oa.matanot.data.id }, undefined, context.fetch);
		const attrs = res?.data?.matanot?.data?.attributes;
		if (attrs) {
			const terms = departureTerms(linesFromMatanot(attrs), Number(attrs.marginPct) || 0, min, max);
			if (terms.envelope !== envelope || JSON.stringify(terms.tiers) !== JSON.stringify(tiers)) {
				tiers = terms.tiers;
				envelope = terms.envelope;
				Object.assign(write, { price_tiers: tiers, price_envelope: envelope, unit_price: terms.priceCurrent });
			}
		}
	}

	// 3. Silence above her own ceiling ran out ⇒ she leaves, not charged.
	let participants = signedParticipants(oa);
	const priceAt = (n: number) => tierPriceAt(tiers, Math.max(n, min)) ?? (Number(oa.unit_price) || 0);
	const lapsed = lapsedConsents(participants, priceAt(participants.length), envelope, nowMs);
	for (const p of lapsed) {
		await strapi.execute(
			'226updateMaagadMember',
			{ id: p.memberId, status_member: 'interested', signed_offer: null, signedAt: null },
			undefined,
			context.fetch
		);
		await strapi.execute(
			'446setMaagadMemberEnvelope',
			{ id: p.memberId, envelope_at_sign: null, price_window_until: null },
			undefined,
			context.fetch
		);
		// Already activated: her deal goes too — nothing was closed before the lock.
		const pend = p.node?.attributes?.sheirutpend?.data;
		if (pend?.id && !pend.attributes?.archived) {
			await strapi.execute('450archiveDeparturePend', { id: String(pend.id) }, undefined, context.fetch);
		}
	}
	if (lapsed.length) {
		const gone = new Set(lapsed.map((p) => p.memberId));
		participants = participants.filter((p) => !gone.has(p.memberId));
		const count = participants.length;
		const backToOpen = oa.status_offer === 'quorum_reached' && count < min;
		await strapi.execute(
			'228updateMaagadOffer',
			{ id: offerId, signed_count: count, ...(backToOpen ? { status_offer: 'open' } : {}) },
			undefined,
			context.fetch
		);
	}

	// 2. The price at the size it is now — and, once activated, on every live
	// deal too: until the lock the deal follows the departure (§4.1).
	const priceNow = priceAt(participants.length);
	if (priceNow !== (oa.price_current != null ? Number(oa.price_current) : null)) write.price_current = priceNow;
	let repriced = 0;
	if (oa.status_offer === 'activated') {
		for (const p of participants) {
			const pend = p.node?.attributes?.sheirutpend?.data;
			if (!pend?.id || pend.attributes?.archived) continue;
			if (Number(pend.attributes?.price) === priceNow) continue;
			await strapi.execute(
				'449repriceDeparturePend',
				{ id: String(pend.id), price: priceNow, total: priceNow },
				undefined,
				context.fetch
			);
			repriced++;
		}
	}

	// 4. What moved since they were last told.
	const restime = oa.proposer_project?.data?.attributes?.restime ?? 'feh';
	const plan = planAnnouncement({
		priceNow,
		envelopeNow: envelope,
		announced: oa.price_announced != null ? Number(oa.price_announced) : null,
		noticeUntilMs: ms(oa.price_notice_until),
		nowMs,
		windowMs: calcDeadlineMs(restime),
		participants
	});
	let notified = 0;
	if (plan.action === 'baseline') write.price_announced = plan.price;
	if (plan.action === 'announce') {
		const until = new Date(plan.windowUntilMs).toISOString();
		write.price_announced = plan.price;
		write.price_notice_until = until;
		for (const n of plan.notices.filter((x) => x.move === 'aboveEnvelope')) {
			await strapi.execute(
				'446setMaagadMemberEnvelope',
				{ id: n.memberId, price_window_until: until },
				undefined,
				context.fetch
			);
		}
		notified = await sendNotices(util, context, oa, plan.notices, {
			from: plan.from,
			price: plan.price,
			until,
			offerId
		});
	}

	if (Object.keys(write).length) {
		await strapi.execute('445setMaagadOfferPricing', { id: offerId, ...write }, undefined, context.fetch);
	}

	const partyIds = [
		...new Set(
			[oa.proposer_user?.data?.id, ...participants.map((p) => p.userId), ...lapsed.map((p) => p.userId)]
				.filter(Boolean)
				.map(String)
		)
	];
	return {
		offerId,
		maagadId: oa.maagad?.data?.id ? String(oa.maagad.data.id) : null,
		priceCurrent: priceNow,
		lapsed: lapsed.map((p) => p.memberId),
		announcement: plan.action,
		notified,
		repriced,
		partyIds
	};
}

// ── notices ──────────────────────────────────────────────────────────────────
// Recipient-language texts (CLAUDE.md, i18n): $t() renders in the sender's locale.
// he/en/ar only — that is what the orchestrator renders (LanguageStrings).

const fmt = (n: number, code: string | null) =>
	`${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}${code ? ` ${code}` : ''}`;

const fmtDate = (iso: string) => iso.slice(0, 10);

function templatesFor(
	move: Notice['move'],
	v: { title: string; from: string; price: string; until: string }
): NotificationConfig['templates'] {
	if (move === 'down') {
		return {
			title: { he: 'המחיר ביציאה ירד', en: 'The departure got cheaper', ar: 'انخفض سعر الرحلة' },
			body: {
				he: `${v.title}: עכשיו ${v.price} למשתתפת (היה ${v.from}). הצטרפו עוד, וההוזלה מגיעה לכולן.`,
				en: `${v.title}: now ${v.price} per participant (was ${v.from}). More joined, and the saving reaches everyone.`,
				ar: `${v.title}: الآن ${v.price} لكل مشارِكة (كان ${v.from}). انضمّ المزيد، والتوفير يصل إلى الجميع.`
			}
		};
	}
	if (move === 'upWithin') {
		return {
			title: { he: 'המחיר ביציאה עלה', en: 'The departure price went up', ar: 'ارتفع سعر الرحلة' },
			body: {
				he: `${v.title}: עכשיו ${v.price} למשתתפת (היה ${v.from}), עדיין בתוך התקרה שראית. אם זה לא מתאים, אפשר לצאת עד הנעילה עם החזר מלא. בלי תגובה, נשארים.`,
				en: `${v.title}: now ${v.price} per participant (was ${v.from}), still within the ceiling you saw. If it doesn't suit you, you can leave until the lock with a full refund. With no answer, you stay.`,
				ar: `${v.title}: الآن ${v.price} لكل مشارِكة (كان ${v.from})، وما زال ضمن السقف الذي رأيتِه. إن لم يناسبك، يمكن الخروج حتى التثبيت مع استرداد كامل. بلا رد، تبقين.`
			}
		};
	}
	return {
		title: { he: 'נדרש אישור: המחיר עבר את התקרה', en: 'Your yes is needed: the price passed the ceiling', ar: 'مطلوب موافقتك: السعر تجاوز السقف' },
		body: {
			he: `${v.title}: המחיר עכשיו ${v.price}, מעל התקרה שראית כשהצטרפת. כדי להישאר צריך לאשר עד ${v.until}. בלי אישור יוצאים — בלי חיוב ועם החזר מלא.`,
			en: `${v.title}: the price is now ${v.price}, above the ceiling you saw when you joined. To stay, confirm by ${v.until}. Without a yes you leave — not charged, with a full refund.`,
			ar: `${v.title}: السعر الآن ${v.price}، أعلى من السقف الذي رأيتِه عند الانضمام. للبقاء يجب التأكيد حتى ${v.until}. بدون موافقة تخرجين — بلا خصم ومع استرداد كامل.`
		}
	};
}

async function sendNotices(
	util: Util,
	context: any,
	oa: any,
	notices: Notice[],
	v: { from: number; price: number; until: string; offerId: string }
): Promise<number> {
	if (!util.notifier) return 0;
	const code = oa.proposer_project?.data?.attributes?.currencyCode ?? null;
	const words = {
		title: String(oa.title ?? ''),
		from: fmt(v.from, code),
		price: fmt(v.price, code),
		until: fmtDate(v.until)
	};
	const url = oa.maagad?.data?.id ? `/maagad/${oa.maagad.data.id}` : '/demand';
	let sent = 0;
	for (const move of ['down', 'upWithin', 'aboveEnvelope'] as const) {
		const recipientIds = notices.filter((n) => n.move === move && n.userId).map((n) => n.userId as string);
		if (!recipientIds.length) continue;
		sent += recipientIds.length;
		util.notifier
			.notify(
				{
					recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
					templates: templatesFor(move, words),
					// Above her ceiling only her yes keeps her in; the rest is news about her own deal.
					intent: move === 'aboveEnvelope' ? 'consent' : 'personal',
					metadata: { type: 'maagad', url }
				},
				{},
				{ recipientIds, data: { offerId: v.offerId, move } },
				context
			)
			.catch((e: unknown) => console.warn('[settleDeparture] notice failed (non-fatal):', e));
	}
	return sent;
}
