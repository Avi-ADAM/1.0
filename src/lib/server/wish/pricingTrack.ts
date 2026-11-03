/**
 * Reading and writing a wish's pricing tracks (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md
 * P1–P2). The rule itself is pure, in `$lib/sheirut/pricingTrack`.
 *
 * Every read is best-effort and every write is skipped while the switch is off
 * (`$lib/sheirut/pricingTracksFlag`): a failed read is "nobody chose", which is how
 * every deal behaves anyway (`atCost`).
 */
import { parsePricingTrack, type PricingTrack } from '$lib/sheirut/pricingTrack';
import { pricingTracksEnabled } from '$lib/sheirut/pricingTracksFlag';

type Run = { execute: (qid: string, vars: Record<string, unknown>, jwt?: string, fetch?: any) => Promise<any> };
type Ctx = { jwt?: string; fetch?: any };

export interface WishPricing {
  wish: PricingTrack | null;
  /** By proposal id: its own track (null = on the wish's terms) and its status. */
  proposals: Record<string, { track: PricingTrack | null; status: string | null }>;
}

/** The tracks of a wish and of each of its proposals; null when they could not be read. */
export async function readWishPricing(strapi: Run, context: Ctx, ratsonId: string): Promise<WishPricing | null> {
  try {
    const res = await strapi.execute('469ratsonPricingTrack', { id: ratsonId }, context.jwt, context.fetch);
    if (!res || res.errors) return null;
    const proposals: WishPricing['proposals'] = {};
    for (const p of res?.data?.ratsonProposals?.data ?? []) {
      proposals[String(p.id)] = {
        track: parsePricingTrack(p?.attributes?.pricingTrack),
        status: p?.attributes?.status_proposal ?? null
      };
    }
    return { wish: parsePricingTrack(res?.data?.ratson?.data?.attributes?.pricingTrack), proposals };
  } catch (e) {
    console.warn('[pricingTrack] reading the tracks failed (read as none):', e);
    return null;
  }
}

/**
 * The wish's own track, as the form chose it. `undefined` leaves it as it is; `null`
 * is "not sure — let them offer". Skipped while the switch is off.
 */
export async function writeWishTrack(strapi: Run, context: Ctx, ratsonId: string, track: unknown): Promise<void> {
  if (!pricingTracksEnabled() || track === undefined) return;
  await strapi.execute('470setRatsonPricingTrack', { id: ratsonId, track: parsePricingTrack(track) }, context.jwt, context.fetch);
}

/** A proposal's track — the version on the table once a counter changed it. */
export async function writeProposalTrack(strapi: Run, context: Ctx, proposalId: string, track: PricingTrack | null): Promise<void> {
  if (!pricingTracksEnabled()) return;
  await strapi.execute('471setProposalPricingTrack', { id: proposalId, track }, context.jwt, context.fetch);
}
