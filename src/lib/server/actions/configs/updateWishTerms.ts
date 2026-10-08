/**
 * Action: updateWishTerms — the owner changes what a published wish asks for: its
 * title, description, dates, online or not, and place.
 * docs/inprogress/PLAN_DIRECT_OFFER.md §4.3 (decision 4).
 *
 * Until now a published wish could not be changed at all (the composer edits drafts
 * only). It can now, and a change is part of the negotiation, not a side channel:
 * hours and a price someone signed were for the wish as it stood. So the wish keeps
 * a digest of its terms (`terms_digest`, `$lib/wish/termsDigest`), every signature
 * records the digest it was made under, and after a change every proposal whose last
 * signature stands behind other terms is the provider's move again — exactly as
 * after a counter (`standing` → `termsChanged`).
 *
 * Silence still answers, at the wish's pace, where the two sides are already talking
 * (a counter was made): the new terms are a new version, so the clock restarts for
 * the provider. At first contact nothing runs (`silenceApplies`).
 *
 * An edit that changes nothing the digest sees (a re-typed space, the same day in
 * another time zone) writes the fields and reopens nothing.
 *
 * Owner-only. A draft is edited in the composer (`updateRatsonDraft`), and a wish
 * that is closed has nothing left to change.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { silenceApplies } from '$lib/wish/restime.js';
import { armProposalClock } from '$lib/server/wish/clock.js';
import { negotiationView } from '$lib/server/wish/negotiationView.js';
import { signDigestOf } from '$lib/server/wish/proposal.js';
import { termsDigest } from '$lib/server/wish/termsDigest.js';

const OPEN = new Set(['suggested', 'viewed']);
const CLOSED = new Set(['draft', 'fulfilled', 'cancelled', 'expired']);

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The fields the caller sent, normalised as the composer does; an omitted one keeps its value. */
export function termsPatch(p: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof p.name === 'string') {
    const name = p.name.trim();
    if (!name) throw new Error('A wish needs a name');
    out.name = name;
    out.desc = typeof p.desc === 'string' ? p.desc : name;
  }
  if (typeof p.longDes === 'string') out.longDes = p.longDes;
  for (const key of ['startDate', 'finnishDate'] as const) {
    if (key in p) out[key] = p[key] || null;
  }
  if (typeof p.isOnline === 'boolean') out.isOnline = p.isOnline;
  for (const key of ['lat', 'lng', 'radius'] as const) {
    if (key in p) out[key] = num(p[key]);
  }
  if ('location_hint' in p) out.location_hint = p.location_hint || null;
  return out;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const p = params as Record<string, any>;
  const ratsonId = String(p.ratsonId ?? '');
  if (!ratsonId) throw new Error('ratsonId is required');

  const res = await strapi.execute('105queryRatsonWithProposals', { id: ratsonId }, context.jwt, context.fetch);
  const node = res?.data?.ratson?.data;
  if (!node) throw new Error(`Ratson ${ratsonId} not found`);
  const attrs = node.attributes ?? {};
  const owners: string[] = (attrs.users_permissions_users?.data ?? []).map((u: any) => String(u.id));
  if (!owners.includes(String(context.userId))) throw new Error('Only the wish owner may change its terms');
  const status = attrs.status_ratson ?? 'open';
  if (status === 'draft') throw new Error('A draft is edited in the composer');
  if (CLOSED.has(status) || attrs.fulfilled === true) throw new Error('This wish is closed — there is nothing left to change');

  const patch = termsPatch(p);
  if (Object.keys(patch).length === 0) throw new Error('Nothing to change');

  const before = signDigestOf(attrs);
  const after = termsDigest({ ...attrs, ...patch });

  // Written as the owner, like the composer's 100: a qid no browser may call (serviceAdmin in
  // qidsAccess), run here after the ownership check above.
  await strapi.execute('431updateWishTerms', { id: ratsonId, data: { ...patch, terms_digest: after } }, context.jwt, context.fetch);

  if (after === before) {
    return { success: true, data: { ratsonId, changed: false, termsDigest: after, reopened: 0 }, updateStrategy: { type: 'none' as const } };
  }

  // Every open proposal whose last signature stands behind the old terms is the
  // provider's move again; where they were already talking, the clock restarts.
  let reopened = 0;
  for (const prop of res?.data?.ratsonProposals?.data ?? []) {
    const a = prop.attributes ?? {};
    if (!OPEN.has(a.status_proposal ?? 'suggested')) continue;
    const view = negotiationView(
      a,
      { wisherIds: owners, proposerIds: (a.proposer_users?.data ?? []).map((u: any) => String(u.id)) },
      'wisher',
      undefined,
      after
    );
    if (!view?.termsChanged) continue;
    reopened++;
    if (silenceApplies(view.round)) {
      await armProposalClock(strapi, context as any, { proposalId: String(prop.id), ratsonId });
    }
  }

  // Said where both sides read it.
  const chatForumId = attrs.chat_forum?.data?.id ?? null;
  if (chatForumId && reopened > 0) {
    try {
      await strapi.execute(
        '1chatsend',
        {
          fid: chatForumId,
          fidn: parseInt(String(chatForumId), 10),
          idL: String(context.userId),
          da: new Date().toISOString(),
          mes: 'עדכנתי את פרטי המשאלה. מי שכבר חתם על חלק מתבקש לעבור על הפרטים החדשים ולאשר או להציע אחרת.'
        },
        context.jwt,
        context.fetch
      );
    } catch {
      /* best-effort: the proposal cards say it too */
    }
  }

  return { success: true, data: { ratsonId, changed: true, termsDigest: after, reopened }, updateStrategy: { type: 'none' as const } };
};

export const updateWishTermsConfig: ActionConfig = {
  key: 'updateWishTerms',
  description:
    "Owner changes a published wish's terms (title, description, dates, online, place). Every proposal signed under the old terms becomes the provider's move again, as after a counter.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    name: { type: 'string', required: false },
    desc: { type: 'string', required: false },
    longDes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finnishDate: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    lat: { type: 'number', required: false },
    lng: { type: 'number', required: false },
    radius: { type: 'number', required: false },
    location_hint: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to change a wish' }],
  updateStrategy: { type: 'none' }
};
