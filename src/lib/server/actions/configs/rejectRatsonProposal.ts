/**
 * Reject Ratson Proposal — PLAN_CONCIERGE §5.1
 *
 * The wisher dismisses a proposal. Silent — no Sheirutpend, no high-priority
 * notification. The provider can still see the rejection in their /moach
 * incoming feed.
 *
 * Valid transitions: suggested|viewed → rejected.
 * Already-accepted proposals can't be rejected here; use `cancelRatsonProposal`
 * (out of scope for M5).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const REJECTABLE_FROM_STATUSES = new Set(['suggested', 'viewed']);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { proposalId, ratsonId, note } = params as {
    proposalId: string;
    ratsonId: string;
    note?: string;
  };
  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');

  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const owners = ratRes?.data?.ratson?.data?.attributes?.users_permissions_users?.data ?? [];
  const wisherUserId = owners[0]?.id ? String(owners[0].id) : null;
  if (wisherUserId && String(context.userId) !== wisherUserId) {
    throw new Error('Only the ratson owner may reject its proposals');
  }

  const propsNodes = ratRes?.data?.ratsonProposals?.data ?? [];
  const proposal = propsNodes.find((p: any) => String(p.id) === String(proposalId));
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found under ratson ${ratsonId}`);
  }
  const currentStatus = proposal.attributes?.status_proposal ?? 'suggested';
  if (!REJECTABLE_FROM_STATUSES.has(currentStatus)) {
    throw new Error(`Proposal status '${currentStatus}' cannot transition to 'rejected'`);
  }

  await strapi.execute(
    '102updateRatsonProposal',
    { id: proposalId, status_proposal: 'rejected' },
    context.jwt,
    context.fetch
  );

  return {
    success: true,
    proposalId: String(proposalId),
    ratsonId: String(ratsonId),
    statusProposal: 'rejected',
    note: note || null
  };
};

export const rejectRatsonProposalConfig: ActionConfig = {
  key: 'rejectRatsonProposal',
  description:
    'Wisher dismisses a ratson_proposal. Silent — no Sheirutpend opened, low-priority notification only.',
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true },
    note: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to reject a proposal' }]
};
