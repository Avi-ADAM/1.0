import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normId } from '../../nego/negoGate.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';

/**
 * Record ONE rikma member's vote on a resource-share candidacy (Askm) without
 * resolving it.
 *
 * The two neighbours only cover the ends of the flow: `finalizeAskmAcceptance`
 * (a yes — `partial` records it, `solo`/`allVoted` materialize) and
 * `declineAskmRequest` (a no in a one-member rikma, which archives the Askm on
 * the spot). A no in a rikma with more than one member had nowhere to go, so
 * reqtom.svelte's decline() ran `alert('soon')` and the click was lost.
 *
 * A recorded no is NOT a veto. `computeNegoGate` only counts votes at
 * `order >= L` (L = the latest negotiation round), so the objection holds
 * against *these terms* and evaporates the moment either side opens a new
 * round — which is precisely the "no absolute no" principle: the answer to a
 * standing claim is a counter-proposal, not a door slammed shut.
 *
 * TODO (consent redesign — see AGENTS.md "Consent & decisions" and
 * docs/PLAN_NEGOTIATION_CANDIDATES.md): this action is a stepping stone. A bare
 * `what:false` still only says "not these terms" without saying which terms
 * would do, so it stalls the candidacy until somebody else moves. The intended
 * end state has NO plain negative vote at all on a candidacy:
 *   - "not like this" becomes a NEGO round (counterOnAskm) carrying the terms
 *     the objector *would* sign — the ping-pong that PLAN_NEGOTIATION_CANDIDATES
 *     already describes, so every objection is answerable;
 *   - the only way to reject a candidate outright is to accept a *different*
 *     offer for the same resource — the rival Askm's acceptance archives the
 *     siblings (runResourceAskmAcceptance already does this), so rejection is a
 *     positive choice about who provides the resource, never a veto on a person.
 * When that lands, reqtom's "not in favor" button should open the negotiation
 * panel instead of calling this, and this action stays only for legacy rows.
 */
const voteOnAskmHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askmId, what, order = 0, existingVotes = [] } = params;

  const me = String(context.userId);
  const voteOrder = Number(order) || 0;
  const voteWhat = what === true;

  // Merge over the votes the card already has, dropping my own row at this
  // round so changing my mind (yes → no) replaces it instead of double-counting.
  const kept = (existingVotes as any[])
    .map((v: any) => ({
      what: v?.what ?? true,
      order: Number(v?.order ?? 0),
      users_permissions_user: normId(v?.users_permissions_user),
    }))
    .filter((v) => v.users_permissions_user !== '')
    .filter((v) => !(v.users_permissions_user === me && v.order === voteOrder));

  const allVots = [...kept, { what: voteWhat, order: voteOrder, users_permissions_user: me }].map(
    (v) => ({
      what: v.what,
      order: v.order,
      users_permissions_user: v.users_permissions_user,
      ide: Number.isNaN(parseInt(v.users_permissions_user, 10))
        ? null
        : parseInt(v.users_permissions_user, 10),
    })
  );

  await strapi.execute('133addVoteToAskm', { id: askmId, vots: allVots }, context.jwt, context.fetch);

  // A yes keeps the auto-approval clock running (same as the `partial` branch of
  // finalizeAskmAcceptance). A no deliberately does not start one: silence must
  // not mature terms somebody objected to — and while the objection stands the
  // gate refuses to approve anyway, so an existing clock closes harmlessly.
  if (voteWhat) {
    await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId) });
  }

  return {
    data: { askmId, what: voteWhat, order: voteOrder },
    updateStrategy: { type: 'none' },
  };
};

export const voteOnAskmConfig: ActionConfig = {
  key: 'voteOnAskm',
  description:
    'Record a rikma member vote (yes/no) on a resource-share request (Askm) without resolving it. A no blocks the current terms only — a new negotiation round clears it.',
  graphqlOperation: voteOnAskmHandler,

  paramSchema: {
    askmId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    what: { type: 'boolean', required: true },
    order: { type: 'number', required: false },
    existingVotes: { type: 'array', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to vote on a resource request',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'הצבעה חדשה', en: 'New vote', ar: 'تصويت جديد' },
      body: {
        he: 'חבר/ה בריקמה הצביע/ה על בקשת שיתוף משאב',
        en: 'A member voted on a resource sharing request',
        ar: 'صوت أحد الأعضاء على طلب مشاركة مورد',
      },
    },
    channels: ['socket'],
    metadata: { type: 'voteUpdate', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
