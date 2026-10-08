/**
 * Action: setWishRestime — the advanced, per-wish setting of the wish's pace
 * (QA_CONCIERGE_E2E C-9).
 *
 * A wish has no rikma, so it carries its own `restime`: how long the other side of a
 * proposal has to answer before silence answers for them. 48 hours unless the owner
 * chose another of the four a rikma offers. Owner-only.
 *
 * Clocks already running follow the new pace — a proposal whose version was signed
 * yesterday is due at "signature + new pace", not at the date it happened to be armed
 * for. (The timegrama run re-arms one that fires early anyway; this only makes a
 * shortened pace take effect on time.) A first-contact proposal has no clock to move:
 * silence starts with the first counter.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { proposalPath } from '$lib/wish/proposalRounds.js';
import { WISH_RESTIME_VALUES, lastSignedAt, proposalDeadline, silenceApplies } from '$lib/wish/restime.js';
import { armProposalClock, writeWishRestime } from '$lib/server/wish/clock.js';
import { negotiationView } from '$lib/server/wish/negotiationView.js';

const OPEN = new Set(['suggested', 'viewed']);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { ratsonId, restime } = params as { ratsonId: string; restime: string };
  if (!(WISH_RESTIME_VALUES as readonly string[]).includes(restime)) {
    throw new Error(`restime must be one of ${WISH_RESTIME_VALUES.join(', ')}`);
  }

  const res = await strapi.execute('105queryRatsonWithProposals', { id: String(ratsonId) }, context.jwt, context.fetch);
  const node = res?.data?.ratson?.data;
  if (!node) throw new Error(`Ratson ${ratsonId} not found`);
  const owners = (node.attributes?.users_permissions_users?.data ?? []).map((u: any) => String(u.id));
  if (!owners.includes(String(context.userId))) throw new Error('Only the wish owner may change its pace');

  const value = await writeWishRestime(strapi, context, String(ratsonId), restime);

  // Clocks already running follow the new pace.
  let rearmed = 0;
  const now = Date.now();
  for (const p of res?.data?.ratsonProposals?.data ?? []) {
    const a = p.attributes ?? {};
    if (!OPEN.has(a.status_proposal ?? 'suggested')) continue;
    const path = proposalPath({
      kind: a.kind,
      hasMatanot: !!a.matanot?.data?.id,
      hasProject: !!a.project?.data?.id,
      hasOpenMission: !!a.open_mission?.data?.id
    });
    if (!path) continue;
    // Only proposals the two sides are already talking about have a clock to move.
    const proposerIds = (a.proposer_users?.data ?? []).map((u: any) => String(u.id));
    const view = negotiationView(a, { wisherIds: owners, proposerIds }, 'wisher', undefined, node.attributes?.terms_digest ?? null);
    if (!view || !silenceApplies(view.round)) continue;
    const due = proposalDeadline(lastSignedAt(a.ratson_willingness_entry, a.createdAt), value);
    if (!due) continue;
    const at = new Date(Math.max(now, Date.parse(due))).toISOString();
    if (await armProposalClock(strapi, context, { proposalId: String(p.id), ratsonId: String(ratsonId), at })) rearmed++;
  }

  return {
    success: true,
    data: { ratsonId: String(ratsonId), restime: value, rearmed },
    updateStrategy: { type: 'none' as const }
  };
};

export const setWishRestimeConfig: ActionConfig = {
  key: 'setWishRestime',
  description:
    "Owner sets the pace of their wish: how long the other side of a proposal has to answer before silence answers for them (48 h by default). Running clocks follow it.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    restime: { type: 'string', required: true, description: 'feh (48 h) | sth (72 h) | nsh (96 h) | sevend (a week)' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to change the pace of a wish' }],
  updateStrategy: { type: 'none' }
};
