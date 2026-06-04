/**
 * Accept Wish Offer — PLAN_CONCIERGE §5.3 (provider response → complex matanot)
 *
 * An invited provider (`requestSuggestion` Track B) has just created a real
 * contribution in *their own* weave via the existing creators:
 *   • a task  → `mission.svelte` / `createMission` → a `pendm` (or `mesimabetahalich`)
 *   • a resource → `ResourceCreator.svelte` / `createResource` → a `pmash`
 *
 * This action binds that contribution into the wish's **aggregator complex
 * matanot** as a BOM recipe line, records the provider's willingness on the
 * proposal, and notifies the wisher. It does NOT create a weave — the
 * aggregator is anchored only to the wish's process (assembly phase). A real
 * partner-weave is materialised later, once everyone commits and the wisher
 * approves (production phase — separate action).
 *
 * Caller must be one of the proposal's `proposer_users` (the invited provider).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type ItemKind = 'mission' | 'resource';
type CreatedType = 'pendm' | 'mesimabetahalich' | 'openMission' | 'pmash';

const VALID_RESOURCE_KINDOF = new Set(['monthly', 'perUnit', 'rent', 'total', 'yearly']);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    proposalId,
    ratsonId,
    itemKind,
    itemIdx = 0,
    createdEntityId = null,
    createdEntityType = null,
    projectId = null,
    hours = null,
    ratePerHour = null,
    quantity = null,
    pricePerUnit = null,
    kindOf = null,
    label = ''
  } = params as {
    proposalId: string;
    ratsonId: string;
    itemKind: ItemKind;
    itemIdx?: number;
    createdEntityId?: string | null;
    createdEntityType?: CreatedType | null;
    projectId?: string | null;
    hours?: number | null;
    ratePerHour?: number | null;
    quantity?: number | null;
    pricePerUnit?: number | null;
    kindOf?: string | null;
    label?: string;
  };

  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');
  if (itemKind !== 'mission' && itemKind !== 'resource')
    throw new Error("itemKind must be 'mission' or 'resource'");

  const now = new Date().toISOString();

  // ── Load the wish + its proposals (authorization + process + product) ──────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);
  const ratAttrs = ratNode.attributes ?? {};

  const proposals = ratRes?.data?.ratsonProposals?.data ?? [];
  const proposal = proposals.find((p: any) => String(p.id) === String(proposalId));
  if (!proposal) throw new Error(`Proposal ${proposalId} not found on this wish`);

  // Only the invited provider may respond to their own invitation.
  const proposers = proposal.attributes?.proposer_users?.data ?? [];
  const isProposer = proposers.some((u: any) => String(u.id) === String(context.userId));
  if (!isProposer) throw new Error('Only an invited provider may accept this offer');

  const processId = ratAttrs.process?.data?.id ? String(ratAttrs.process.data.id) : null;
  const wishName = ratAttrs.name || 'משאלה';
  const owners = ratAttrs.users_permissions_users?.data ?? [];

  // ── 1. Ensure the wish's aggregator complex matanot (lazy, no weave) ───────
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
        status_of_voting: 'voting',
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

    // Link the wish → its product (and advance status to negotiating).
    try {
      await strapi.execute(
        '100updateRatson',
        { id: ratsonId, derivedComplexMatanot: matanotId, status_ratson: 'negotiating' },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[acceptWishOffer] ratson link/status update failed (non-fatal):', err);
    }
  }

  // ── 2. Add the provider's contribution as a BOM recipe line ────────────────
  const noteParts = [label].filter(Boolean);
  if (createdEntityType === 'openMission') {
    // Recipe lines can only typed-link a pendm/mesimabetahalich; keep the
    // open_mission id traceable in notes until a typed relation is added.
    noteParts.push(`open_mission:${createdEntityId}`);
  }
  if (projectId) noteParts.push(`weave:${projectId}`);
  const notes = noteParts.join(' · ');

  let recipeId: string | null = null;

  if (itemKind === 'mission') {
    const vars: Record<string, unknown> = {
      matanot: matanotId,
      hoursPerUnit: typeof hours === 'number' ? hours : 0,
      unitsPerProduct: 1,
      ratePerHour: typeof ratePerHour === 'number' ? ratePerHour : 0,
      mode: 'createNew',
      notes,
      assignedMember: String(context.userId),
      publishedAt: now
    };
    if (createdEntityType === 'pendm') vars.pendm = createdEntityId;
    else if (createdEntityType === 'mesimabetahalich') vars.mesimabetahalich = createdEntityId;
    if (processId) vars.partof = processId;

    const r = await strapi.execute('125createMatanotRecipeMission', vars, context.jwt, context.fetch);
    recipeId = r?.data?.createMatanotRecipeMission?.data?.id
      ? String(r.data.createMatanotRecipeMission.data.id)
      : null;
  } else {
    const resKind =
      kindOf && VALID_RESOURCE_KINDOF.has(kindOf) ? kindOf : 'total';
    const vars: Record<string, unknown> = {
      matanot: matanotId,
      quantityPerUnit: typeof quantity === 'number' ? quantity : 1,
      pricePerUnit: typeof pricePerUnit === 'number' ? pricePerUnit : 0,
      kindOf: resKind,
      mode: 'createNew',
      notes,
      assignedMember: String(context.userId),
      publishedAt: now
    };
    if (createdEntityType === 'pmash') vars.pmash = createdEntityId;

    const r = await strapi.execute('128createMatanotRecipeResource', vars, context.jwt, context.fetch);
    recipeId = r?.data?.createMatanotRecipeResource?.data?.id
      ? String(r.data.createMatanotRecipeResource.data.id)
      : null;
  }

  // ── 3. Record the provider's commitment on the proposal ────────────────────
  // One Track-B proposal == one invited provider, so a single SET entry is the
  // provider's willingness for this need (no merge needed).
  const willingAmount =
    typeof pricePerUnit === 'number'
      ? pricePerUnit * (typeof quantity === 'number' ? quantity : 1)
      : null;
  try {
    await strapi.execute(
      '112commitWishWillingness',
      {
        id: proposalId,
        status_proposal: 'accepted',
        total_price: willingAmount ?? undefined,
        ratson_willingness_entry: [
          {
            user: String(context.userId),
            item_kind: itemKind === 'mission' ? 'covered_mission' : 'covered_resource',
            item_idx: typeof itemIdx === 'number' ? itemIdx : 0,
            agree: true,
            willingHours: typeof hours === 'number' ? hours : undefined,
            willingAmount: willingAmount ?? undefined,
            note: label || undefined,
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

  // ── 4. Seed the wish chat + notify the wisher ──────────────────────────────
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
          mes: `התחייבתי לספק: "${label || (itemKind === 'mission' ? 'משימה' : 'משאב')}".`
        },
        context.jwt,
        context.fetch
      );
    } catch {
      /* chat seed is best-effort */
    }
  }

  const recipientIds = owners
    .map((o: any) => String(o.id))
    .filter((id: string) => id && id !== String(context.userId));

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      proposalId: String(proposalId),
      matanotId,
      recipeId
    },
    recipientIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const acceptWishOfferConfig: ActionConfig = {
  key: 'acceptWishOffer',
  description:
    "An invited provider commits a contribution (a created pendm/mesimabetahalich/pmash) to a wish: binds it as a BOM line of the wish's aggregator complex matanot, records willingness, and notifies the wisher.",
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true },
    itemKind: { type: 'string', required: true },
    itemIdx: { type: 'number', required: false },
    createdEntityId: { type: 'string', required: false },
    createdEntityType: { type: 'string', required: false },
    projectId: { type: 'string', required: false },
    hours: { type: 'number', required: false },
    ratePerHour: { type: 'number', required: false },
    quantity: { type: 'number', required: false },
    pricePerUnit: { type: 'number', required: false },
    kindOf: { type: 'string', required: false },
    label: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to accept a wish offer' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'ספק התחייב למשאלה שלך',
        en: 'A provider committed to your wish',
        ar: 'التزم مزوّد بأمنيتك'
      },
      body: {
        he: 'מישהו הוסיף תרומה למשאלה שלך. כנסי לראות את החבילה המתהווה.',
        en: 'Someone added a contribution to your wish. Open it to see the forming package.',
        ar: 'أضاف أحدهم مساهمة في أمنيتك. افتحها لرؤية الحزمة المتكوّنة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'ratsonProposal', url: '/concierge/{{ratsonId}}' }
  },
  updateStrategy: { type: 'none' }
};
