/**
 * Accept Wish Offer — PLAN_CONCIERGE §5.3 (provider approves their placement)
 *
 * Corrected model: the customer already authored the mission/resource spec at
 * request time (`requestWishMission`) as an UNASSIGNED BOM recipe line on the
 * wish's draft complex matanot. The invited provider here simply **approves
 * their placement** — we set `assignedMember` on that existing slot, mark the
 * proposal accepted, and record willingness. No product/recipe creation, no
 * weave selection (the weave is materialised later, once all slots are filled).
 *
 * The slot reference rides in the proposal's
 * `covered_missions[].extracted_mission_idx` (recipe-mission id) — set by
 * requestWishMission.
 *
 * Caller must be one of the proposal's `proposer_users`.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { proposalId, ratsonId } = params as { proposalId: string; ratsonId: string };

  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');

  const now = new Date().toISOString();

  // ── Load wish + proposals (authorization + the slot reference) ─────────────
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
  const pAttrs = proposal.attributes ?? {};

  const proposers = pAttrs.proposer_users?.data ?? [];
  const isProposer = proposers.some((u: any) => String(u.id) === String(context.userId));
  if (!isProposer) throw new Error('Only an invited provider may approve this placement');

  // Resolve the slot the customer created for this provider.
  const coveredMission = (pAttrs.covered_missions ?? [])[0];
  const coveredResource = (pAttrs.covered_resources ?? [])[0];
  const recipeMissionId = coveredMission?.extracted_mission_idx
    ? String(coveredMission.extracted_mission_idx)
    : null;
  const recipeResourceId = coveredResource?.extracted_resource_idx
    ? String(coveredResource.extracted_resource_idx)
    : null;

  const isResource = !!recipeResourceId && !recipeMissionId;
  const hours = coveredMission?.hours ?? null;
  const price = (isResource ? coveredResource?.price : coveredMission?.price) ?? null;

  // ── 1. Assign the provider to the slot ─────────────────────────────────────
  if (recipeMissionId) {
    await strapi.execute(
      '143assignRecipeMissionMember',
      { id: recipeMissionId, assignedMember: String(context.userId) },
      context.jwt,
      context.fetch
    );
  } else if (recipeResourceId) {
    await strapi.execute(
      '144assignRecipeResourceMember',
      { id: recipeResourceId, assignedMember: String(context.userId) },
      context.jwt,
      context.fetch
    );
  } else {
    throw new Error('This invitation has no slot to fill (missing recipe reference)');
  }

  // ── 2. Record the commitment on the proposal ───────────────────────────────
  try {
    await strapi.execute(
      '112commitWishWillingness',
      {
        id: proposalId,
        status_proposal: 'accepted',
        total_price: typeof price === 'number' ? price : undefined,
        ratson_willingness_entry: [
          {
            user: String(context.userId),
            item_kind: isResource ? 'covered_resource' : 'covered_mission',
            item_idx: 0,
            agree: true,
            willingHours: typeof hours === 'number' ? hours : undefined,
            willingAmount: typeof price === 'number' ? price : undefined,
            submittedAt: now
          }
        ]
      },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    console.warn('[acceptWishOffer] willingness/status update failed (non-fatal):', err);
  }

  // ── 3. Seed the wish chat + notify the wisher ──────────────────────────────
  const ratAttrs = ratNode.attributes ?? {};
  const chatForumId = ratAttrs.chat_forum?.data?.id ?? null;
  if (chatForumId) {
    try {
      await strapi.execute(
        '1chatsend',
        {
          fid: chatForumId,
          fidn: parseInt(String(chatForumId), 10),
          idL: context.userId,
          da: now,
          mes: 'אישרתי את ההשמה שלי למשימה במשאלה.'
        },
        context.jwt,
        context.fetch
      );
    } catch {
      /* best-effort */
    }
  }

  const owners = ratAttrs.users_permissions_users?.data ?? [];
  const recipientIds = owners
    .map((o: any) => String(o.id))
    .filter((id: string) => id && id !== String(context.userId));

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      proposalId: String(proposalId),
      recipeMissionId,
      recipeResourceId
    },
    recipientIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const acceptWishOfferConfig: ActionConfig = {
  key: 'acceptWishOffer',
  description:
    "An invited provider approves their placement on a wish: sets assignedMember on the customer-authored BOM slot, marks the proposal accepted, and records willingness. No creation — the slot already exists.",
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to approve a placement' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'ספק אישר השמה במשאלה שלך',
        en: 'A provider approved their placement',
        ar: 'وافق مزوّد على تعيينه'
      },
      body: {
        he: 'מישהו אישר את ההשמה שלו במשימה. עוד צעד לקראת השלמת החבילה.',
        en: 'Someone approved their placement. One step closer to completing the package.',
        ar: 'وافق أحدهم على تعيينه. خطوة أقرب لإكمال الحزمة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'ratsonProposal', url: '/concierge/{{ratsonId}}' }
  },
  updateStrategy: { type: 'none' }
};
