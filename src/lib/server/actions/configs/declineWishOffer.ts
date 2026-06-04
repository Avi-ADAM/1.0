/**
 * Decline Wish Offer — PLAN_CONCIERGE §5.3
 *
 * The counterpart to acceptWishOffer: an invited provider declines the
 * invitation. Quiet by design — sets the proposal to 'rejected' and gives the
 * wisher a low-priority heads-up so they can invite someone else. No product or
 * recipe side-effects.
 *
 * Caller must be one of the proposal's `proposer_users`.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { proposalId, ratsonId, reason = '' } = params as {
    proposalId: string;
    ratsonId: string;
    reason?: string;
  };

  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');

  // Load the wish + proposals to authorize the caller as the invited provider.
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);

  const proposals = ratRes?.data?.ratsonProposals?.data ?? [];
  const proposal = proposals.find((p: any) => String(p.id) === String(proposalId));
  if (!proposal) throw new Error(`Proposal ${proposalId} not found on this wish`);

  const proposers = proposal.attributes?.proposer_users?.data ?? [];
  const isProposer = proposers.some((u: any) => String(u.id) === String(context.userId));
  if (!isProposer) throw new Error('Only an invited provider may decline this offer');

  await strapi.execute(
    '102updateRatsonProposal',
    { id: proposalId, status_proposal: 'rejected' },
    context.jwt,
    context.fetch
  );

  const owners = ratNode.attributes?.users_permissions_users?.data ?? [];
  const recipientIds = owners
    .map((o: any) => String(o.id))
    .filter((id: string) => id && id !== String(context.userId));

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      proposalId: String(proposalId),
      reason: reason || null
    },
    recipientIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const declineWishOfferConfig: ActionConfig = {
  key: 'declineWishOffer',
  description:
    'An invited provider declines a wish invitation: sets the proposal to rejected and gives the wisher a low-priority notification.',
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true },
    reason: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to decline a wish offer' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'הזמנה למשאלה נדחתה',
        en: 'A wish invitation was declined',
        ar: 'تم رفض دعوة لأمنية'
      },
      body: {
        he: 'ספק שהוזמן בחר שלא להצטרף. אפשר להזמין מועמד אחר.',
        en: 'An invited provider chose not to join. You can invite someone else.',
        ar: 'اختار مزوّد مدعوّ عدم الانضمام. يمكنك دعوة شخص آخر.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', type: 'ratsonProposal', url: '/concierge/{{ratsonId}}' }
  },
  updateStrategy: { type: 'none' }
};
