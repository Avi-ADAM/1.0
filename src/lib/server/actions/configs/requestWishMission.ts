/**
 * Request Wish Mission — PLAN_CONCIERGE §5.3 (customer authors the contract)
 *
 * Corrected model: the **customer** (wisher) authors the mission spec when
 * reaching out to a provider — the mission *is* the offer/contract. It is
 * created weave-less (an `isglobal` pendm), linked to the wish's **draft**
 * complex matanot as a BOM recipe line with NO assignee yet. The invited
 * provider later just approves their placement (`acceptWishOffer`). A real
 * weave is materialised only at the end, once all slots are filled.
 *
 * Owner-only (the wisher authoring an offer on her own wish).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    targetUserId,
    name,
    hours = null,
    ratePerHour = null,
    descrip = '',
    label = ''
  } = params as {
    ratsonId: string;
    targetUserId?: string | null;
    name: string;
    hours?: number | null;
    ratePerHour?: number | null;
    descrip?: string;
    label?: string;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!name) throw new Error('mission name is required');
  // targetUserId is optional: when present we send an invitation proposal to that
  // provider; when absent the customer is just building out the plan — we create
  // an unassigned BOM slot (for cost estimate / later assignment).

  const now = new Date().toISOString();

  // ── Load wish (owner check + process + existing product) ───────────────────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);
  const ratAttrs = ratNode.attributes ?? {};

  const owners = ratAttrs.users_permissions_users?.data ?? [];
  const isOwner = owners.some((o: any) => String(o.id) === String(context.userId));
  if (!isOwner) throw new Error('Only the wish owner may author an offer');

  const processId = ratAttrs.process?.data?.id ? String(ratAttrs.process.data.id) : null;
  const wishName = ratAttrs.name || 'משאלה';

  // ── 1. Ensure the wish's DRAFT aggregator complex matanot ──────────────────
  let matanotId: string | null = ratAttrs.derivedComplexMatanot?.data?.id
    ? String(ratAttrs.derivedComplexMatanot.data.id)
    : null;
  if (!matanotId) {
    const mRes = await strapi.execute(
      '139createWishMatanot',
      {
        name: `${wishName} — חבילה`,
        desc: '',
        pricingMode: 'quote',
        estimatedPrice: 0,
        status_of_voting: 'draft',
        process: processId,
        publishedAt: now
      },
      context.jwt,
      context.fetch
    );
    matanotId = mRes?.data?.createMatanot?.data?.id
      ? String(mRes.data.createMatanot.data.id)
      : null;
    if (!matanotId) throw new Error('Failed to create the wish product');
    try {
      await strapi.execute(
        '100updateRatson',
        { id: ratsonId, derivedComplexMatanot: matanotId, status_ratson: 'negotiating' },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[requestWishMission] ratson link failed (non-fatal):', err);
    }
  }

  // ── 2. Create the weave-less mission spec (isglobal pendm) ──────────────────
  const pendmRes = await strapi.execute(
    '137createPendmForRecipe',
    {
      name,
      // NOTE: project intentionally omitted → isglobal/weave-less spec.
      perhour: typeof ratePerHour === 'number' ? ratePerHour : 0,
      noofhours: typeof hours === 'number' ? hours : 0,
      descrip: descrip || '',
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const pendmId = pendmRes?.data?.createPendm?.data?.id
    ? String(pendmRes.data.createPendm.data.id)
    : null;
  if (!pendmId) throw new Error('Failed to create the mission spec');

  // ── 3. Add it as an unassigned BOM recipe line ─────────────────────────────
  const recipeVars: Record<string, unknown> = {
    matanot: matanotId,
    pendm: pendmId,
    hoursPerUnit: typeof hours === 'number' ? hours : 0,
    unitsPerProduct: 1,
    ratePerHour: typeof ratePerHour === 'number' ? ratePerHour : 0,
    mode: 'createNew',
    notes: label || name,
    publishedAt: now
  };
  if (processId) recipeVars.partof = processId;
  const recipeRes = await strapi.execute(
    '125createMatanotRecipeMission',
    recipeVars,
    context.jwt,
    context.fetch
  );
  const recipeMissionId = recipeRes?.data?.createMatanotRecipeMission?.data?.id
    ? String(recipeRes.data.createMatanotRecipeMission.data.id)
    : null;
  if (!recipeMissionId) throw new Error('Failed to create the recipe line');

  // ── 4. Create the invitation proposal, linked to the slot ──────────────────
  // The slot reference rides in covered_missions[].extracted_mission_idx — the
  // recipe-mission id the provider will be assigned to on accept.
  // Only when a target provider is given; otherwise the customer just added an
  // unassigned slot to the plan (no invitation, no notification).
  const price =
    (typeof hours === 'number' ? hours : 0) * (typeof ratePerHour === 'number' ? ratePerHour : 0);

  let proposalId: string | null = null;
  if (targetUserId) {
    const propRes = await strapi.execute(
      '101createRatsonProposal',
      {
        ratson: ratsonId,
        kind: 'existing_project',
        status_proposal: 'suggested',
        proposer_users: [targetUserId],
        total_price: price,
        auto_generated: false,
        covered_missions: [
          {
            extracted_mission_idx: recipeMissionId,
            hours: typeof hours === 'number' ? hours : 0,
            price
          }
        ],
        publishedAt: now
      },
      context.jwt,
      context.fetch
    );
    proposalId = propRes?.data?.createRatsonProposal?.data?.id
      ? String(propRes.data.createRatsonProposal.data.id)
      : null;
    if (!proposalId) throw new Error('Failed to create the invitation');
  }

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      matanotId,
      pendmId,
      recipeMissionId,
      proposalId,
      planOnly: !targetUserId
    },
    recipientIds: targetUserId ? [String(targetUserId)] : [],
    updateStrategy: { type: 'none' as const }
  };
};

export const requestWishMissionConfig: ActionConfig = {
  key: 'requestWishMission',
  description:
    "Wisher authors a mission offer for an invited provider: ensures the wish's draft complex matanot, creates a weave-less mission spec (isglobal pendm) as an unassigned BOM line, and sends an invitation proposal linked to that slot.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    targetUserId: { type: 'string', required: false },
    name: { type: 'string', required: true },
    hours: { type: 'number', required: false },
    ratePerHour: { type: 'number', required: false },
    descrip: { type: 'string', required: false },
    label: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to send an offer' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'הצעת משימה ממשאלה',
        en: 'A task offer from a wish',
        ar: 'عرض مهمة من أمنية'
      },
      body: {
        he: 'נשלחה אליך הצעת משימה. יש להיכנס ל־Deals כדי לאשר את ההשמה.',
        en: 'Someone prepared a ready task offer for you. Open Deals to approve your placement.',
        ar: 'أعدّ أحدهم عرض مهمة جاهزًا لك. افتح Deals للموافقة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'ratsonProposal', url: '/deals' }
  },
  updateStrategy: { type: 'none' }
};
