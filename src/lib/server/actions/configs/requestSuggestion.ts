/**
 * Request Suggestion — PLAN_CONCIERGE §5 (wisher-initiated outreach)
 *
 * On the review page (/concierge/[id]) Lev grounds each open need in real
 * platform matches: people who hold the needed skill, free resource instances
 * (Sp), and ready-made products (matanot) a weave already offers. This action
 * turns the wisher's "reach out" click into a real `ratson_proposal` instead of
 * a dead profile link.
 *
 * Two tracks, mirroring how 1Lev1 already works:
 *
 *   • kind='matanot' — the need maps to a product a weave offers. This is a
 *     **service request**, identical to the built-in product-request flow:
 *     create the proposal (existing_matanot) and open a Sheirutpend so the
 *     provider weave's members vote (same gate as acceptRatsonProposal).
 *
 *   • kind='person' | 'resource' — a soft invitation. There is no product to
 *     buy, so we create a `suggested` proposal naming the invited member
 *     (proposer_users) and notify them. They can then respond from /lev.
 *
 * Owner-only (the wisher reaching out on her own wish).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type SuggestionKind = 'matanot' | 'person' | 'resource';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    kind,
    matanotId = null,
    projectId = null,
    targetUserId = null,
    totalPrice = null,
    label = ''
  } = params as {
    ratsonId: string;
    kind: SuggestionKind;
    matanotId?: string | null;
    projectId?: string | null;
    targetUserId?: string | null;
    totalPrice?: number | null;
    label?: string;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!kind) throw new Error('kind is required');

  // ── Load the wish (authorization + dates + chat forum) ────────────────────
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
  if (!isOwner) throw new Error('Only the ratson owner may reach out on its needs');

  const ratsonStart = ratAttrs.startDate ?? null;
  const ratsonFinish = ratAttrs.finnishDate ?? null;
  const chatForumId = ratAttrs.chat_forum?.data?.id ?? null;
  const now = new Date().toISOString();

  // Don't duplicate: skip if a live proposal already targets this matanot/user.
  const existingProps = ratRes?.data?.ratsonProposals?.data ?? [];
  const TERMINAL = new Set(['rejected', 'expired', 'cancelled']);

  // ── Track A — product (matanot): full service-request via Sheirutpend ─────
  if (kind === 'matanot') {
    if (!matanotId) throw new Error('matanotId is required for a product request');
    if (!projectId) throw new Error('projectId is required for a product request');

    const dupe = existingProps.find(
      (p: any) =>
        String(p?.attributes?.matanot?.data?.id) === String(matanotId) &&
        !TERMINAL.has(p?.attributes?.status_proposal)
    );
    const price = typeof totalPrice === 'number' ? totalPrice : 0;

    let proposalId: string | null = dupe ? String(dupe.id) : null;
    if (!proposalId) {
      const propRes = await strapi.execute(
        '101createRatsonProposal',
        {
          ratson: ratsonId,
          kind: 'existing_matanot',
          status_proposal: 'accepted',
          matanot: matanotId,
          project: projectId,
          total_price: price,
          auto_generated: false,
          publishedAt: now
        },
        context.jwt,
        context.fetch
      );
      proposalId = propRes?.data?.createRatsonProposal?.data?.id
        ? String(propRes.data.createRatsonProposal.data.id)
        : null;
    }
    if (!proposalId) throw new Error('Failed to create product proposal');

    // Open the Sheirutpend so the provider weave's members vote (the built-in
    // product-request consent gate — same mutation acceptRatsonProposal uses).
    const spendRes = await strapi.execute(
      '71createSheirutpend',
      {
        project: projectId,
        userId: String(context.userId),
        matanots: [matanotId],
        price,
        quant: 1,
        total: price,
        startDate: ratsonStart,
        finnishDate: ratsonFinish,
        appruved: false
      },
      context.jwt,
      context.fetch
    );
    const sheirutpendId = spendRes?.data?.createSheirutpend?.data?.id
      ? String(spendRes.data.createSheirutpend.data.id)
      : null;

    if (sheirutpendId) {
      try {
        await strapi.execute(
          '73updateSheirutpend',
          { id: sheirutpendId, data: { ratson_proposal: proposalId } },
          context.jwt,
          context.fetch
        );
      } catch (err) {
        console.warn('[requestSuggestion] sheirutpend backlink failed (non-fatal):', err);
      }
    }

    try {
      await strapi.execute(
        '100updateRatson',
        { id: ratsonId, status_ratson: 'negotiating' },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[requestSuggestion] ratson status update failed:', err);
    }

    if (chatForumId) {
      try {
        await strapi.execute(
          '1chatsend',
          {
            fid: chatForumId,
            fidn: parseInt(chatForumId, 10),
            idL: context.userId,
            da: now,
            mes: `שלחתי בקשת שירות עבור "${label || 'מוצר מתאים'}".`
          },
          context.jwt,
          context.fetch
        );
      } catch {
        /* chat seed is best-effort */
      }
    }

    // Notify the provider weave's members.
    let recipientIds: string[] = [];
    try {
      const memRes = await strapi.execute(
        '128getProjectMembersAndRestime',
        { pid: projectId },
        context.jwt,
        context.fetch
      );
      recipientIds = (memRes?.data?.project?.data?.attributes?.user_1s?.data ?? [])
        .map((m: any) => String(m.id))
        .filter((id: string) => id && id !== String(context.userId));
    } catch {
      /* notification targeting is best-effort */
    }

    return {
      data: {
        success: true,
        track: 'service_request',
        proposalId,
        sheirutpendId,
        ratsonId: String(ratsonId)
      },
      recipientIds,
      updateStrategy: { type: 'none' as const }
    };
  }

  // ── Track B — person / resource: soft invitation proposal ─────────────────
  if (!targetUserId) throw new Error('targetUserId is required to invite a member');

  const dupe = existingProps.find((p: any) => {
    const status = p?.attributes?.status_proposal;
    if (TERMINAL.has(status)) return false;
    const proposers = p?.attributes?.proposer_users?.data ?? [];
    return proposers.some((u: any) => String(u.id) === String(targetUserId));
  });

  let proposalId: string | null = dupe ? String(dupe.id) : null;
  if (!proposalId) {
    const propRes = await strapi.execute(
      '101createRatsonProposal',
      {
        ratson: ratsonId,
        kind: projectId ? 'existing_project' : 'partial',
        status_proposal: 'suggested',
        project: projectId || null,
        proposer_users: [targetUserId],
        total_price: typeof totalPrice === 'number' ? totalPrice : 0,
        auto_generated: false,
        publishedAt: now
      },
      context.jwt,
      context.fetch
    );
    proposalId = propRes?.data?.createRatsonProposal?.data?.id
      ? String(propRes.data.createRatsonProposal.data.id)
      : null;
  }
  if (!proposalId) throw new Error('Failed to create invitation proposal');

  if (chatForumId) {
    try {
      await strapi.execute(
        '1chatsend',
        {
          fid: chatForumId,
          fidn: parseInt(chatForumId, 10),
          idL: context.userId,
          da: now,
          mes: `הזמנתי שותף/ה אפשרי/ת עבור "${label || 'אחד הצרכים'}".`
        },
        context.jwt,
        context.fetch
      );
    } catch {
      /* chat seed is best-effort */
    }
  }

  return {
    data: {
      success: true,
      track: 'invitation',
      proposalId,
      ratsonId: String(ratsonId)
    },
    recipientIds: [String(targetUserId)],
    updateStrategy: { type: 'none' as const }
  };
};

export const requestSuggestionConfig: ActionConfig = {
  key: 'requestSuggestion',
  description:
    "Wisher reaches out to a grounded suggestion: a product (matanot) opens a Sheirutpend service request; a person/resource creates a suggested invitation proposal and notifies them.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    kind: { type: 'string', required: true },
    matanotId: { type: 'string', required: false },
    projectId: { type: 'string', required: false },
    targetUserId: { type: 'string', required: false },
    totalPrice: { type: 'number', required: false },
    label: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to reach out' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'בקשה חדשה ממשאלה',
        en: 'New request from a wish',
        ar: 'طلب جديد من أمنية'
      },
      body: {
        he: 'מישהי פנתה אלייך דרך משאלה בקונסיירז׳. כנסי ל־Lev כדי להגיב.',
        en: 'Someone reached out to you through a concierge wish. Open Lev to respond.',
        ar: 'تواصل معك أحدهم عبر أمنية. افتح Lev للرد.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'ratsonProposal', url: '/lev' }
  },
  updateStrategy: { type: 'none' }
};
