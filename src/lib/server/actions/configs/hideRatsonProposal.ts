/**
 * Action: hideRatsonProposal — "hide" instead of "reject" (QA_CONCIERGE_E2E C-10).
 *
 * A first-contact proposal the wisher is not interested in used to get a "דחייה"
 * button: a verdict, handed to a stranger, with nothing to answer. There is no
 * absolute "no" on this platform, so the wisher can only **hide** it — it stops showing
 * on her wish page and in her heart, and nothing is decided: the proposal stays as it
 * was for the provider, who is told nothing. (Nor does it ever turn into an approval:
 * a proposal nobody has countered carries no silence clock.)
 *
 * What may be hidden:
 *  - a proposal nobody has countered yet (first contact — nothing has been negotiated);
 *  - a proposal that is already closed (rejected / expired) — it is only clutter now.
 * What may not:
 *  - one the two sides are negotiating (a counter is on the table): the answer to terms
 *    you cannot take is the terms you could — approve, or counter;
 *  - one that was accepted: a placement stands.
 *
 * Owner-only. The flag is `RatsonProposal.hidden_by_wisher`; it is read, best-effort,
 * through qid 394 (a backend that does not have the field yet hides nothing).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { loadWishProposal } from '$lib/server/wish/proposal.js';

const OPEN = new Set(['suggested', 'viewed']);
const CLOSED = new Set(['rejected', 'expired']);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { proposalId, ratsonId } = params as { proposalId: string; ratsonId: string };
  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');

  const p = await loadWishProposal(strapi, context as any, String(ratsonId), String(proposalId));
  if (!p.wisherIds.includes(String(context.userId))) {
    throw new Error('Only the wish owner may hide its proposals');
  }

  const status = String(p.attrs.status_proposal ?? 'suggested');
  if (OPEN.has(status)) {
    if (p.standing.round > 0) {
      throw new Error(
        'This proposal is being negotiated — approve the terms on the table or put your own; it cannot be hidden'
      );
    }
  } else if (!CLOSED.has(status)) {
    throw new Error(`A proposal that is '${status}' cannot be hidden`);
  }

  const res = await strapi.execute(
    '393hideRatsonProposal',
    { id: String(proposalId), hidden: true },
    context.jwt,
    context.fetch
  );
  if (!res || res.errors) {
    throw new Error(`Could not hide the proposal: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  }

  return {
    success: true,
    data: { proposalId: String(proposalId), ratsonId: String(ratsonId), hidden: true },
    updateStrategy: { type: 'none' as const }
  };
};

export const hideRatsonProposalConfig: ActionConfig = {
  key: 'hideRatsonProposal',
  description:
    'Wisher hides a first-contact (or already closed) proposal from her own views. Nothing is decided and the provider is not told; a proposal that is being negotiated cannot be hidden.',
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to hide a proposal' }],
  updateStrategy: { type: 'none' }
};
