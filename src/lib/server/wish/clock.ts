/**
 * The silence clock of a wish proposal (QA_CONCIERGE_E2E C-9).
 *
 * Every time a version is put on the table — a proposal opened, a counter made, a
 * counter approved by the side that still needs the other to close it — the other
 * side has the wish's pace (`restime`, 48 h unless its owner chose otherwise) to
 * answer. A timegrama with `whatami: 'ratson_proposal'` carries it; the timegrama
 * cron matures it (`matureProposal.ts`) by approving the version for whoever stayed
 * silent. A new clock re-points the proposal's one-to-one `timegrama` relation, so
 * the old one is left orphaned and the dispatcher closes it as "target deleted".
 *
 * Both calls are best-effort and say so: the schema they rely on
 * (Timegrama.ratson_proposal, Ratson.restime) only exists once 1.0b is deployed, and
 * a proposal without a clock is exactly what wishes had until now — it must never be
 * the reason a counter or an offer fails.
 */

import { normalizeRestime, restimeMs, type WishRestime } from '$lib/wish/restime.js';

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
type Ctx = { jwt: string; fetch: any };

/** The wish's pace; the default (48 h) when the field is not there yet or unreadable. */
export async function readWishRestime(strapi: Strapi, context: Ctx, ratsonId: string): Promise<WishRestime> {
  try {
    const res = await strapi.execute('388getRatsonRestime', { id: String(ratsonId) }, context.jwt, context.fetch);
    return normalizeRestime(res?.data?.ratson?.data?.attributes?.restime);
  } catch {
    return normalizeRestime(undefined);
  }
}

/**
 * Write the wish's pace. Throws when it cannot (the owner asked for something that did
 * not happen — unlike the clock, this must be said out loud).
 */
export async function writeWishRestime(strapi: Strapi, context: Ctx, ratsonId: string, restime: unknown): Promise<WishRestime> {
  const value = normalizeRestime(restime);
  const res = await strapi.execute('389setRatsonRestime', { id: String(ratsonId), restime: value }, context.jwt, context.fetch);
  if (!res || res.errors) {
    throw new Error(`Could not set the pace of the wish: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  }
  return value;
}

/**
 * Start (or restart) the clock of a proposal: the other side's time to answer begins
 * at `from` (default now). Returns whether a clock was armed.
 */
export async function armProposalClock(
  strapi: Strapi,
  context: Ctx,
  args: { proposalId: string; ratsonId: string; from?: Date; at?: string }
): Promise<boolean> {
  try {
    const date =
      args.at ??
      new Date((args.from ?? new Date()).getTime() + restimeMs(await readWishRestime(strapi, context, args.ratsonId))).toISOString();
    const res = await strapi.execute(
      '390createTimegramaForRatsonProposal',
      { date, ratson_proposal: String(args.proposalId) },
      context.jwt,
      context.fetch
    );
    if (!res || res.errors) {
      console.warn('[wish clock] could not arm the clock (is 1.0b deployed?):', JSON.stringify(res?.errors ?? 'no answer'));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[wish clock] could not arm the clock:', err);
    return false;
  }
}
