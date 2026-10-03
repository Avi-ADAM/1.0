/**
 * Accept Wish Offer — PLAN_CONCIERGE §5.3, and the approval half of C-9.
 *
 * The customer already authored the mission/resource spec at request time
 * (`requestWishMission`) as an UNASSIGNED BOM recipe line on the wish's draft
 * complex matanot. The invited provider **approves their placement**: we set
 * `assignedMember` on that existing slot, mark the proposal accepted, and record
 * the signature. No product/recipe creation, no weave selection (the weave is
 * materialised later, once all slots are filled).
 *
 * Since C-9 the terms are negotiable (`counterRatsonProposal`), so this approves
 * *the version on the table*, and either side can be the one approving:
 *   - the provider approves what the wisher authored, or her counter;
 *   - the wisher approves a counter the provider made — the slot is then filled
 *     with the provider she invited.
 * Only the side whose move it is may approve (the other side signed last). The
 * agreed hours/price are written onto the slot before anyone is assigned, so the
 * deal is priced and carried out at the same numbers.
 *
 * A *volunteer* from the community feed opened their proposal themselves, and the
 * wisher's accept (`acceptRatsonProposal`) is what builds the slot. Here a
 * volunteer can only approve a counter of the wisher's — which records their
 * signature and tells her to close the placement.
 *
 * The slot reference rides in the proposal's
 * `covered_missions[].extracted_mission_idx` (recipe-mission id) — set by
 * requestWishMission.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { isTurnOf } from '$lib/wish/proposalRounds.js';
import { entryInput, loadWishProposal, requireParty } from '$lib/server/wish/proposal.js';
import { syncSlotToVersion } from '$lib/server/wish/placement.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { proposalId, ratsonId } = params as { proposalId: string; ratsonId: string };

  if (!proposalId) throw new Error('proposalId is required');
  if (!ratsonId) throw new Error('ratsonId is required');

  const me = String(context.userId);
  const now = new Date().toISOString();

  const p = await loadWishProposal(strapi, context, String(ratsonId), String(proposalId));
  const party = requireParty(p, me);

  const status = p.attrs.status_proposal ?? 'suggested';
  if (status === 'accepted') throw new Error('This placement was already approved');
  if (status !== 'suggested' && status !== 'viewed') {
    throw new Error(`This proposal is '${status}' and can no longer be approved`);
  }
  if (!p.slot) throw new Error('This invitation has no slot to fill (missing recipe reference)');

  // Your move only if the other side signed last.
  if (!isTurnOf(party, p.standing)) {
    throw new Error("You already stand behind the current terms — it is the other side's turn");
  }

  const { kind, idx } = p.slot;
  const isResource = kind === 'resource';
  const version = p.version;
  const approval = {
    user: me,
    item_kind: isResource ? 'covered_resource' : 'covered_mission',
    item_idx: 0,
    agree: true,
    submittedAt: now,
    ...(version.amount != null ? { willingHours: version.amount } : {}),
    ...(version.price != null ? { willingAmount: version.price } : {})
  };
  const log = [...p.entries.map(entryInput), approval];

  const ratAttrs = p.ratsonAttrs;
  const chatForumId = ratAttrs.chat_forum?.data?.id ?? null;
  const say = async (mes: string) => {
    if (!chatForumId) return;
    try {
      await strapi.execute(
        '1chatsend',
        { fid: chatForumId, fidn: parseInt(String(chatForumId), 10), idL: me, da: now, mes },
        context.jwt,
        context.fetch
      );
    } catch {
      /* best-effort */
    }
  };
  const tell = async (toIds: string[], title: any, body: any, url: string) => {
    if (!notifier || toIds.length === 0) return;
    try {
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
          templates: { title, body },
          channels: ['socket', 'push'],
          metadata: { priority: 'high', type: 'ratsonProposal', url }
        },
        params,
        { recipientIds: toIds, data: { proposalId, ratsonId } },
        context
      );
    } catch (err) {
      console.warn('[acceptWishOffer] notification failed (non-fatal):', err);
    }
  };

  // ── A volunteer approving the wisher's counter: sign, and hand it back ──────
  // The slot is built by the wisher's own accept (it needs her authority), so this
  // only records that the volunteer stands behind her version.
  if (p.ref.openedBy === 'provider') {
    if (party !== 'provider') {
      throw new Error("A volunteer's offer is closed by the wisher's own accept, not from here");
    }
    await strapi.execute(
      '112commitWishWillingness',
      { id: proposalId, ratson_willingness_entry: log },
      context.jwt,
      context.fetch
    );
    await say('אישרתי את הגרסה שהוצעה למשימה.');
    await tell(
      p.wisherIds.filter((id) => id !== me),
      { he: 'המתנדב/ת אישר/ה את הגרסה שלך', en: 'The volunteer approved your version', ar: 'وافق المتطوّع على نسختك' },
      {
        he: 'אפשר לסגור את ההשמה.',
        en: 'You can close the placement.',
        ar: 'يمكنك إغلاق التعيين.'
      },
      `/concierge/${ratsonId}`
    );
    return {
      data: { success: true, ratsonId: String(ratsonId), proposalId: String(proposalId), finalized: false },
      updateStrategy: { type: 'none' as const }
    };
  }

  // ── The wisher's invitation: both sides agree → fill the slot ───────────────
  const providerId = p.proposerIds[0];
  if (!providerId) throw new Error('This proposal has no provider to place');
  const recipeId = idx;
  if (!recipeId) throw new Error('This invitation has no slot to fill (missing recipe reference)');

  // 1. The slot carries the agreed terms before anyone is assigned to it.
  const matanotId = ratAttrs.derivedComplexMatanot?.data?.id ? String(ratAttrs.derivedComplexMatanot.data.id) : null;
  await syncSlotToVersion(strapi, context, { matanotId, kind, recipeId, version });

  // 2. Assign the provider to the slot — the one invited, whoever approves.
  if (!isResource) {
    await strapi.execute(
      '143assignRecipeMissionMember',
      { id: recipeId, assignedMember: providerId },
      context.jwt,
      context.fetch
    );
  } else {
    await strapi.execute(
      '144assignRecipeResourceMember',
      { id: recipeId, assignedMember: providerId },
      context.jwt,
      context.fetch
    );
  }

  // 3. Record the signature on the proposal and mark it accepted.
  try {
    await strapi.execute(
      '112commitWishWillingness',
      {
        id: proposalId,
        status_proposal: 'accepted',
        total_price: typeof version.price === 'number' ? version.price : undefined,
        ratson_willingness_entry: log
      },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    console.warn('[acceptWishOffer] willingness/status update failed (non-fatal):', err);
  }

  // 4. Seed the wish chat + tell the other side.
  if (party === 'provider') {
    await say('אישרתי את ההשמה שלי למשימה במשאלה.');
    await tell(
      p.wisherIds.filter((id) => id !== me),
      {
        he: 'ספק אישר השמה במשאלה שלך',
        en: 'A provider approved their placement',
        ar: 'وافق مزوّد على تعيينه'
      },
      {
        he: 'מישהו אישר את ההשמה שלו במשימה. עוד צעד לקראת השלמת החבילה.',
        en: 'Someone approved their placement. One step closer to completing the package.',
        ar: 'وافق أحدهم على تعيينه. خطوة أقرب لإكمال الحزمة.'
      },
      `/concierge/${ratsonId}`
    );
  } else {
    await say('אישרתי את הגרסה שהוצעה — ההשמה נסגרה.');
    await tell(
      p.proposerIds.filter((id) => id !== me),
      {
        he: 'הלקוח/ה אישר/ה את הגרסה שהצעת',
        en: 'The wisher approved your version',
        ar: 'وافقت صاحبة الأمنية على نسختك'
      },
      {
        he: 'ההשמה שלך נסגרה בתנאים שהוצעו.',
        en: 'Your placement is closed on the terms proposed.',
        ar: 'أُغلق تعيينك بالشروط المقترحة.'
      },
      '/lev'
    );
  }

  return {
    data: {
      success: true,
      finalized: true,
      ratsonId: String(ratsonId),
      proposalId: String(proposalId),
      recipeMissionId: isResource ? null : recipeId,
      recipeResourceId: isResource ? recipeId : null
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const acceptWishOfferConfig: ActionConfig = {
  key: 'acceptWishOffer',
  description:
    "Approve the version on the table of a wish proposal. An invited provider approves their placement (or the wisher approves the provider's counter): the agreed hours/price are written onto the customer-authored BOM slot, the provider is assigned to it and the proposal is marked accepted. A volunteer can only approve a counter of the wisher's. Only the side whose move it is may approve.",
  graphqlOperation: handler,
  paramSchema: {
    proposalId: { type: 'string', required: true },
    ratsonId: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to approve a placement' }],
  updateStrategy: { type: 'none' }
};
