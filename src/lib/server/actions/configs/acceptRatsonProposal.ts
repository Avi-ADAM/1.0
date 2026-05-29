/**
 * Accept Ratson Proposal — PLAN_CONCIERGE §5.1
 *
 * The wisher accepts a proposal. This is *not* a deal yet — it opens the
 * existing Sheirutpend consent gate. The proposers must vote in their
 * Sheirutpend; once consensus is reached (simple matanot = 1 member,
 * complex matanot = unanimous of involved members) the existing
 * `createSheirutFromPending` flow creates the actual Sheirut and the
 * BOM activates.
 *
 * Flow:
 *   1. Load proposal (matanot, project, total_price, status).
 *   2. Guard: only proposals in `suggested`/`viewed` can be accepted.
 *   3. Update `ratson_proposal.status_proposal='accepted'` (wisher side).
 *   4. Call `createSheirutpend` mutation directly so the proposer project
 *      members get the standard "new service request" notification.
 *   5. Return both ids; the existing `approveSheirutpend` flow takes over.
 *
 * Out of scope here:
 *   - The 72h expiry sweeper (M5.1 cron `closeRatsonProposalExpired`).
 *   - The post-Sheirut hook that flips the proposal status to its terminal
 *     'fulfilled' marker on `ratson.status_ratson` (handled where Sheirut
 *     is actually created — the boundary lives in createSheirutFromPending).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const ACCEPTABLE_FROM_STATUSES = new Set(['suggested', 'viewed']);

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { proposalId, note } = params as { proposalId: string; note?: string };
  if (!proposalId) throw new Error('proposalId is required');

  const ratsonId = (params as any).ratsonId;
  if (!ratsonId) {
    throw new Error('ratsonId is required (until a single-proposal query is added)');
  }

  // ── 1. Load the proposal via its parent ratson ──────────────────────────

  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const propsNodes = ratRes?.data?.ratsonProposals?.data ?? [];
  const proposal = propsNodes.find((p: any) => String(p.id) === String(proposalId));
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found under ratson ${ratsonId}`);
  }

  const pa = proposal.attributes ?? {};
  const currentStatus = pa.status_proposal ?? 'suggested';
  if (!ACCEPTABLE_FROM_STATUSES.has(currentStatus)) {
    throw new Error(`Proposal status '${currentStatus}' cannot transition to 'accepted'`);
  }

  const matanotId = pa.matanot?.data?.id ?? null;
  const projectId = pa.project?.data?.id ?? null;
  const totalPrice = typeof pa.total_price === 'number' ? pa.total_price : 0;

  if (!matanotId) {
    throw new Error('Proposal has no matanot — cannot open Sheirutpend (custom_offer flow handled separately in M7)');
  }
  if (!projectId) {
    throw new Error('Proposal has no proposer project — cannot open Sheirutpend');
  }

  const ratsonAttrs = ratRes?.data?.ratson?.data?.attributes ?? {};
  const owners = ratsonAttrs.users_permissions_users?.data ?? [];
  const ratsonStart = ratsonAttrs.startDate ?? null;
  const ratsonFinish = ratsonAttrs.finnishDate ?? null;

  if (owners.length === 0) {
    throw new Error('Ratson has no owner — cannot create Sheirutpend');
  }
  const wisherUserId = String(owners[0].id);

  // Authorization sanity: only the wisher (or an owner) can accept on her own ratson.
  if (String(context.userId) !== wisherUserId) {
    throw new Error('Only the ratson owner may accept its proposals');
  }

  const now = new Date().toISOString();

  // ── 2. Flip status to 'accepted' (wisher side of the gate) ──────────────
  await strapi.execute(
    '102updateRatsonProposal',
    { id: proposalId, status_proposal: 'accepted' },
    context.jwt,
    context.fetch
  );

  // ── 3. Create the Sheirutpend so the proposer side can vote ─────────────
  const sheirutpendRes = await strapi.execute(
    '71createSheirutpend',
    {
      project: projectId,
      userId: wisherUserId,
      matanots: [matanotId],
      price: totalPrice,
      quant: 1,
      total: totalPrice,
      startDate: ratsonStart,
      finnishDate: ratsonFinish,
      appruved: false
    },
    context.jwt,
    context.fetch
  );
  const sheirutpendId = sheirutpendRes?.data?.createSheirutpend?.data?.id
    ? String(sheirutpendRes.data.createSheirutpend.data.id)
    : null;

  // ── 4. Best-effort: link the Sheirutpend back to the ratson_proposal
  //       so the deals screen can show "this came from a wish".
  //       Requires Sheirutpend.ratson_proposal field in Strapi — if absent,
  //       the mutation will reject and we swallow the error. No effect on
  //       the consent flow itself.
  if (sheirutpendId) {
    try {
      await strapi.execute(
        '73updateSheirutpend',
        { id: sheirutpendId, data: { ratson_proposal: proposalId } },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn(
        '[acceptRatsonProposal] could not link sheirutpend.ratson_proposal — schema field may be missing:',
        err
      );
    }
  }

  // ── 5. Update the parent ratson status → 'negotiating' ──────────────────
  try {
    await strapi.execute(
      '100updateRatson',
      { id: ratsonId, status_ratson: 'negotiating' },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    console.warn('[acceptRatsonProposal] ratson status update failed:', err);
  }

  // ── 6. (Optional) seed a chat message documenting the acceptance ────────
  const chatForumId = ratsonAttrs.chat_forum?.data?.id ?? null;
  if (chatForumId) {
    try {
      await strapi.execute(
        '1chatsend',
        {
          fid: chatForumId,
          fidn: parseInt(chatForumId, 10),
          idL: context.userId,
          da: now,
          mes: note
            ? `אישרתי את ההצעה. ${note}`
            : 'אישרתי את ההצעה — Sheirutpend נפתח לאישור הספקים.'
        },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[acceptRatsonProposal] chat seed message failed:', err);
    }
  }

  return {
    success: true,
    proposalId: String(proposalId),
    sheirutpendId,
    ratsonId: String(ratsonId),
    matanotId: String(matanotId),
    projectId: String(projectId),
    statusProposal: 'accepted',
    statusRatson: 'negotiating'
  };
};

export const acceptRatsonProposalConfig: ActionConfig = {
  key: 'acceptRatsonProposal',
  description:
    'Wisher accepts a ratson_proposal — opens a Sheirutpend so the proposer project members can vote.',
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true },
    note: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to accept a proposal' }],
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'הצעה אושרה — נדרשת הסכמה',
        en: 'Proposal accepted — your consent needed',
        ar: 'تمت الموافقة على العرض — مطلوبة موافقتك'
      },
      body: {
        he: 'הלקוחה אישרה את ההצעה. נא לאשר את הבקשה ב־Sheirutpend כדי שהדיל ייסגר.',
        en: 'The wisher accepted your proposal. Please approve the Sheirutpend so the deal can close.',
        ar: 'وافقت العميلة على عرضك. الرجاء الموافقة على الـ Sheirutpend لإغلاق الصفقة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'high',
      type: 'sheirutUpdate',
      url: '/lev'
    }
  }
};
