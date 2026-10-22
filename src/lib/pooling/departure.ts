/**
 * A maagad offer made out of a rikma's product is a *departure* of that
 * product — PLAN_POOL_PRODUCT §4. Pure: the server wires it to Strapi, the
 * pages read the stored result.
 *
 * The price is never typed. The server derives the whole curve from the BOM
 * and stores it as `price_tiers` (`[{min: n, price}]`, one row per n in range),
 * so the existing `resolveTierPrice` reads the exact `priceAt(n)` without the
 * BOM, and a hand-sent tier table is ignored (§2).
 */

import { isEssenceOnly } from './bomPrice';
import {
	curve,
	effectiveShape,
	envelope,
	missionLineCost,
	priceAt,
	resourceLineCost,
	risingPoints,
	type BomLine,
	type CostShape
} from './priceCurve';

export type PriceTier = { min: number; price: number };

export type DepartureLine = BomLine & {
	kind: 'mission' | 'resource';
	name: string;
};

export type DepartureTerms = {
	/** The price at the departure's floor — what everyone pays until it grows. */
	priceCurrent: number;
	/** The highest the curve reaches in [min, max] — the ceiling one agrees to. */
	envelope: number;
	envelopeAt: number;
	tiers: PriceTier[];
	/** Group sizes at which one more makes it dearer for everyone (the form warns). */
	rising: number[];
};

/** A product the rikma has not finished agreeing on cannot open a departure. */
const UNSELLABLE_STATES = new Set(['draft', 'voting', 'archived']);

/** Can this matanot open a departure? A composed product, open for sale. */
export function isPoolableProduct(attrs: any): boolean {
	return (
		attrs?.pricingMode === 'estimated' &&
		!attrs?.archived &&
		attrs?.lifecycle !== 'archived' &&
		!UNSELLABLE_STATES.has(attrs?.status_of_voting)
	);
}

export type PoolableProduct = {
	id: string;
	name: string;
	marginPct: number;
	projectId: string;
	projectName: string;
	currencyCode: string | null;
	lines: DepartureLine[];
};

/** The offer form's product list, out of 444myPoolableProducts' user node. */
export function poolableProductsFrom(userAttrs: any): PoolableProduct[] {
	const out: PoolableProduct[] = [];
	const seen = new Set<string>();
	for (const p of userAttrs?.projects_1s?.data ?? []) {
		for (const m of p?.attributes?.matanotofs?.data ?? []) {
			const a = m?.attributes ?? {};
			if (seen.has(String(m.id)) || !isPoolableProduct({ ...a, pricingMode: 'estimated' })) continue;
			seen.add(String(m.id));
			out.push({
				id: String(m.id),
				name: String(a.name ?? ''),
				marginPct: Number(a.marginPct) || 0,
				projectId: String(p.id),
				projectName: String(p.attributes?.projectName ?? ''),
				currencyCode: p.attributes?.currencyCode ?? null,
				lines: linesFromMatanot(a)
			});
		}
	}
	return out;
}

const nameOf = (rel: any): string =>
	rel?.data?.attributes?.name ? String(rel.data.attributes.name) : '';

/** A matanot node's recipe (as 443matanotForPoolOffer returns it) as departure lines. */
export function linesFromMatanot(attrs: any): DepartureLine[] {
	const missions = (attrs?.matanot_recipe_missions?.data ?? []).map((n: any) => {
		const a = n?.attributes ?? {};
		return {
			kind: 'mission' as const,
			name: nameOf(a.mesimabetahalich) || nameOf(a.pendm),
			cost: missionLineCost(a),
			costShape: a.costShape ?? null,
			stepCapacity: a.stepCapacity ?? null
		};
	});
	// An essence-only row says what the product consumes, not what it costs (bomPrice.ts).
	const resources = (attrs?.matanot_recipe_resources?.data ?? []).filter((n: any) => !isEssenceOnly(n?.attributes)).map((n: any) => {
		const a = n?.attributes ?? {};
		return {
			kind: 'resource' as const,
			name: nameOf(a.mashabetahalich) || nameOf(a.pmash),
			cost: resourceLineCost(a),
			costShape: a.costShape ?? null,
			stepCapacity: a.stepCapacity ?? null,
			priceMode: a.priceMode ?? null
		};
	});
	return [...missions, ...resources];
}

export function departureTerms(
	bom: BomLine[],
	marginPct: number,
	min: number,
	max: number | null | undefined
): DepartureTerms {
	const env = envelope(bom, min, max, marginPct);
	return {
		priceCurrent: priceAt(bom, min, marginPct),
		envelope: env.price,
		envelopeAt: env.n,
		tiers: curve(bom, min, max, marginPct).map((p) => ({ min: p.n, price: p.price })),
		rising: risingPoints(bom, min, max, marginPct).map((p) => p.n)
	};
}

/**
 * The price everyone pays with n signed. Below the floor the departure does
 * not happen at that size, so the price shown is the floor's (§4.1); a
 * supplier activating below it is P4's `below_min_mode`.
 */
export function tierPriceAt(tiers: PriceTier[] | null | undefined, n: number): number | null {
	if (!Array.isArray(tiers) || tiers.length === 0) return null;
	let best: PriceTier | null = null;
	for (const t of tiers) {
		if (t.min <= n && (!best || t.min > best.min)) best = t;
	}
	return (best ?? tiers.reduce((a, b) => (b.min < a.min ? b : a))).price;
}

/** The next group size, above n, at which the price is lower than now. */
export function nextDropFromTiers(
	tiers: PriceTier[] | null | undefined,
	n: number
): PriceTier | null {
	const now = tierPriceAt(tiers, n);
	if (now == null || !tiers) return null;
	const ahead = [...tiers].filter((t) => t.min > n).sort((a, b) => a.min - b.min);
	return ahead.find((t) => t.price < now) ?? null;
}

/** What a page shows for a departure: now · at most · next drop (§4, B9). */
export function departureReadout(
	tiers: PriceTier[] | null | undefined,
	envelopeValue: number | null | undefined,
	signedCount: number,
	min: number
): { now: number | null; ceiling: number | null; nextDrop: PriceTier | null } {
	const n = Math.max(Number(signedCount) || 0, Number(min) || 1);
	return {
		now: tierPriceAt(tiers, n),
		ceiling: envelopeValue != null && Number.isFinite(Number(envelopeValue)) ? Number(envelopeValue) : null,
		nextDrop: nextDropFromTiers(tiers, n)
	};
}

/** The tag a line carries on the departure page (§4): its shape and step. */
export function lineTag(line: Pick<BomLine, 'costShape' | 'stepCapacity'>): {
	shape: CostShape;
	capacity: number;
} {
	const { shape, k } = effectiveShape(line);
	return { shape, capacity: k };
}
