/**
 * Request Wish Resource — PLAN_CONCIERGE §5.3 (customer authors the contract)
 *
 * Resource mirror of `requestWishMission`. The **customer** (wisher) authors a
 * resource spec when reaching out to a provider — the spec *is* the offer. It is
 * created weave-less (a project-less pmash), linked to the wish's **draft**
 * complex matanot as a BOM resource recipe line with NO assignee yet. The
 * invited provider later just approves their placement (`acceptWishOffer`,
 * which already handles the `covered_resources` branch). A real weave is
 * materialised only at the end, once all slots are filled.
 *
 * Owner-only (the wisher authoring an offer on her own wish).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    targetUserId,
    name,
    quantity = 1,
    price = null,
    kindOf = 'total',
    descrip = '',
    label = ''
  } = params as {
    ratsonId: string;
    targetUserId?: string | null;
    name: string;
    quantity?: number | null;
    price?: number | null;
    kindOf?: string;
    descrip?: string;
    label?: string;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!name) throw new Error('resource name is required');
  // targetUserId is optional: with it we send an invitation to that provider;
  // without it the customer is just defining a needed resource in the plan
  // (unassigned BOM slot, for cost estimate / later assignment).

  const now = new Date().toISOString();
  const qty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
  const unitPrice = typeof price === 'number' ? price : 0;

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
      console.warn('[requestWishResource] ratson link failed (non-fatal):', err);
    }
  }

  // ── 2. Create the weave-less resource spec (project-less pmash) ────────────
  const pmashRes = await strapi.execute(
    '138createPmashForRecipe',
    {
      name,
      // NOTE: project intentionally omitted → weave-less spec.
      price: unitPrice,
      easy: unitPrice,
      hm: qty,
      kindOf,
      descrip: descrip || '',
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const pmashId = pmashRes?.data?.createPmash?.data?.id
    ? String(pmashRes.data.createPmash.data.id)
    : null;
  if (!pmashId) throw new Error('Failed to create the resource spec');

  // ── 3. Add it as an unassigned BOM recipe line ─────────────────────────────
  const recipeVars: Record<string, unknown> = {
    matanot: matanotId,
    pmash: pmashId,
    quantityPerUnit: qty,
    pricePerUnit: unitPrice,
    mode: 'createNew',
    notes: label || name,
    publishedAt: now
  };
  const recipeRes = await strapi.execute(
    '128createMatanotRecipeResource',
    recipeVars,
    context.jwt,
    context.fetch
  );
  const recipeResourceId = recipeRes?.data?.createMatanotRecipeResource?.data?.id
    ? String(recipeRes.data.createMatanotRecipeResource.data.id)
    : null;
  if (!recipeResourceId) throw new Error('Failed to create the recipe line');

  // ── 4. Create the invitation proposal, linked to the slot ──────────────────
  // The slot reference rides in covered_resources[].extracted_resource_idx —
  // the recipe-resource id the provider will be assigned to on accept.
  const totalPrice = unitPrice * qty;
  let proposalId: string | null = null;
  if (targetUserId) {
    const propRes = await strapi.execute(
      '101createRatsonProposal',
      {
        ratson: ratsonId,
        // 'partial' = a resource/slice invite (vs 'existing_project' = person/mission).
        // The deals IncomingWishCard keys its kind label + offerItem.kind off this.
        kind: 'partial',
        status_proposal: 'suggested',
        proposer_users: [targetUserId],
        total_price: totalPrice,
        auto_generated: false,
        covered_resources: [
          {
            extracted_resource_idx: recipeResourceId,
            quantity: qty,
            price: totalPrice
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
      pmashId,
      recipeResourceId,
      proposalId,
      planOnly: !targetUserId
    },
    recipientIds: targetUserId ? [String(targetUserId)] : [],
    updateStrategy: { type: 'none' as const }
  };
};

export const requestWishResourceConfig: ActionConfig = {
  key: 'requestWishResource',
  description:
    "Wisher authors a resource offer for an invited provider: ensures the wish's draft complex matanot, creates a weave-less resource spec (project-less pmash) as an unassigned BOM line, and sends an invitation proposal linked to that slot.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    targetUserId: { type: 'string', required: false },
    name: { type: 'string', required: true },
    quantity: { type: 'number', required: false },
    price: { type: 'number', required: false },
    kindOf: { type: 'string', required: false },
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
        he: 'הצעת משאב ממשאלה',
        en: 'A resource offer from a wish',
        ar: 'عرض مورد من أمنية'
      },
      body: {
        he: 'נשלחה אליך הצעת משאב. יש להיכנס ל־Deals כדי לאשר את ההשמה.',
        en: 'Someone prepared a ready resource offer for you. Open Deals to approve your placement.',
        ar: 'أعدّ أحدهم عرض مورد جاهزًا لك. افتح Deals للموافقة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'ratsonProposal', url: '/deals' }
  },
  updateStrategy: { type: 'none' }
};
