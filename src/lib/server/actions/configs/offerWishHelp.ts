/**
 * Offer Wish Help — provider self-offer on a wish (PLAN_CONCIERGE M4)
 *
 * Any logged-in user who is NOT the wish owner can proactively offer to help
 * with one or more extracted missions/resources. Creates a `ratson_proposal`
 * with the provider as `proposer_users` and notifies the wisher.
 *
 * The wisher then sees this in /concierge/[id] under "הצעות נכנסות" and can
 * decide whether to formally invite them via `requestWishMission`.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    missionIds = [],
    resourceIds = [],
    note = ''
  } = params as {
    ratsonId: string;
    missionIds?: string[];
    resourceIds?: string[];
    note?: string;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!missionIds.length && !resourceIds.length) {
    throw new Error('at least one mission or resource must be selected');
  }

  const now = new Date().toISOString();

  // ── Load the wish (existence check + owner guard) ──────────────────────────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);

  const ratAttrs = ratNode.attributes ?? {};
  const owners: any[] = ratAttrs.users_permissions_users?.data ?? [];
  const isOwner = owners.some((o: any) => String(o.id) === String(context.userId));
  if (isOwner) throw new Error('The wish owner cannot self-offer on their own wish');

  // Guard: don't create a duplicate active offer from this user.
  const existing = (ratRes?.data?.ratsonProposals?.data ?? []).find((p: any) =>
    (p.attributes?.proposer_users?.data ?? []).some(
      (u: any) => String(u.id) === String(context.userId)
    ) && ['suggested', 'viewed'].includes(p.attributes?.status_proposal ?? '')
  );
  if (existing) throw new Error('You already have an active offer on this wish');

  // ── Build covered_missions and covered_resources arrays ───────────────────
  const coveredMissions = missionIds.map((idx) => ({
    extracted_mission_idx: idx,
    hours: null,
    price: null
  }));
  const coveredResources = resourceIds.map((idx) => ({
    extracted_resource_idx: idx,
    quantity: null,
    price: null
  }));

  // ── Create the proposal ───────────────────────────────────────────────────
  const propRes = await strapi.execute(
    '101createRatsonProposal',
    {
      ratson: ratsonId,
      kind: 'custom_offer',
      status_proposal: 'suggested',
      proposer_users: [String(context.userId)],
      auto_generated: false,
      covered_missions: coveredMissions,
      covered_resources: coveredResources,
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const proposalId = propRes?.data?.createRatsonProposal?.data?.id
    ? String(propRes.data.createRatsonProposal.data.id)
    : null;
  if (!proposalId) throw new Error('Failed to create the offer');

  const wisherIds = owners.map((o: any) => String(o.id));

  return {
    data: { success: true, proposalId, ratsonId: String(ratsonId) },
    recipientIds: wisherIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const offerWishHelpConfig: ActionConfig = {
  key: 'offerWishHelp',
  description:
    'Provider self-offer on a public wish: creates a ratson_proposal (kind=custom_offer) with the provider as proposer_user and notifies the wisher.',
  graphqlOperation: handler,
  paramSchema: {
    ratsonId:    { type: 'string',  required: true },
    missionIds:  { type: 'array',   required: false },
    resourceIds: { type: 'array',   required: false },
    note:        { type: 'string',  required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to offer help' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'הצעת עזרה חדשה למשאלה',
        en: 'New help offer on your wish',
        ar: 'عرض مساعدة جديد لأمنيتك'
      },
      body: {
        he: 'מישהי הציעה לעזור במשאלה שלך. כנסי ל־Concierge כדי לראות.',
        en: 'Someone offered to help with your wish. Open Concierge to review.',
        ar: 'قدّم أحدهم عرضًا للمساعدة في أمنيتك. افتح Concierge للمراجعة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', type: 'ratsonProposal', url: '/concierge' }
  },
  updateStrategy: { type: 'none' }
};
