/**
 * A community member answers a wish's published need — QA_CONCIERGE_E2E C-9.
 *
 * A need published to the community (`publishWishNeedToCommunity`) is an open mission
 * with no rikma behind it: it carries the wish (`ratson`) it came from and nothing
 * else. Whoever takes it — on the published terms, or on terms of their own — does
 * not go through the rikma's Ask/vote flow (there is no rikma), they put a
 * **proposal** in front of the wisher: a `custom_offer` ratsonProposal bound to the
 * open mission, covering the extracted need it was published from. The wisher then
 * approves it (`acceptRatsonProposal`), or negotiates (`counterRatsonProposal`).
 *
 * This used to live inline in `applyToMission`, which is the only path that handled
 * a rikma-less mission; the "customize" path (`proposeOnOpenMission`) did not and
 * died asking Strapi for the members of project "" (C-9). Both now come here.
 */

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
type Ctx = { userId: string; jwt: string; fetch: any };

export interface VolunteerTerms {
  /** Hours the volunteer proposes — omitted/null = the published ones. */
  hours?: number | null;
  /** Rate per hour the volunteer proposes — omitted/null = the published one. */
  ratePerHour?: number | null;
  /** Why these terms — shown to the wisher. */
  note?: string | null;
}

export interface VolunteerProposalResult {
  proposalId: string;
  ratsonId: string;
  openMissionId: string;
  coveredIdx: number;
  /** Marks the answer as the rikma-less path (what applyToMission has always returned). */
  concierge: true;
  /** True when the volunteer proposed terms other than the published ones. */
  countered: boolean;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : v == null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function createVolunteerProposal(
  strapi: Strapi,
  context: Ctx,
  notifier: any,
  args: { openMissionId: string; params: Record<string, unknown>; terms?: VolunteerTerms }
): Promise<{ data: VolunteerProposalResult; updateStrategy: { type: 'none' } }> {
  const { openMissionId, params } = args;
  const nowISO = new Date().toISOString();

  // Load the open mission to get the linked ratson + its published name/rate
  const omRes = await strapi.execute('51GetOpenMissionById', { id: openMissionId }, context.jwt, context.fetch);
  const omAttrs = omRes?.data?.openMission?.data?.attributes;
  if (!omAttrs) throw new Error('OpenMission not found');

  const ratsonId = omAttrs.ratson?.data?.id ? String(omAttrs.ratson.data.id) : null;
  if (!ratsonId) {
    throw new Error('This mission has no project and no linked wish - cannot apply');
  }

  // Load the wish so we can (a) link this offer to the exact extracted need it
  // was published from, and (b) notify the wish owner.
  const ratRes = await strapi.execute('105queryRatsonWithProposals', { id: ratsonId }, context.jwt, context.fetch);
  const ratAttrs = ratRes?.data?.ratson?.data?.attributes ?? {};
  const ownerIds: string[] = (ratAttrs.users_permissions_users?.data ?? []).map((o: any) => String(o.id));

  // Resolve which extracted need this open mission was published from. Prefer
  // the STABLE extracted-component id persisted on the open mission at publish
  // time (`extractedKey`) — robust against the owner later renaming/reordering
  // needs. The /concierge/[id] matcher accepts either the array index OR the
  // component id as `extracted_mission_idx`. Best-effort read: the field may not
  // be live in Strapi yet, so we fall back to matching by name → array index.
  let extractedKey: string | null = null;
  try {
    const kRes = await strapi.execute('getOpenMissionExtractedKey', { id: openMissionId }, context.jwt, context.fetch);
    const raw = kRes?.data?.openMission?.data?.attributes?.extractedKey;
    extractedKey = raw != null && String(raw) !== '' ? String(raw) : null;
  } catch (e) {
    console.warn('[volunteerProposal] extractedKey read failed (field may not be live yet):', e);
  }

  const extractedMissions: any[] = ratAttrs.extracted_missions ?? [];
  const omName = String(omAttrs.name ?? '').trim();
  const matchedIdx = omName ? extractedMissions.findIndex((m: any) => String(m?.name ?? '').trim() === omName) : -1;

  // Value written into covered_missions: the stable component id when we have
  // it, otherwise the matched array index (legacy/name-match path). If neither
  // resolves we still create the offer; it just won't auto-attach to a row.
  const coveredIdxValue = extractedKey != null ? extractedKey : matchedIdx >= 0 ? String(matchedIdx) : null;

  // The terms: the published ones, unless the volunteer put their own.
  const publishedHours = num(omAttrs.noofhours) ?? 0;
  const publishedRate = num(omAttrs.perhour) ?? 0;
  const hours = num(args.terms?.hours) ?? publishedHours;
  const rate = num(args.terms?.ratePerHour) ?? publishedRate;
  const price = hours * rate;
  const countered = Math.abs(hours - publishedHours) > 1e-6 || Math.abs(rate - publishedRate) > 1e-6;

  const coveredMissions =
    coveredIdxValue != null ? [{ extracted_mission_idx: coveredIdxValue, hours: omAttrs.noofhours != null || countered ? hours : null, price }] : [];

  // Create the volunteer offer. `open_mission` is what marks this as a
  // community-published volunteer (vs a plain offerWishHelp self-offer).
  const propRes = await strapi.execute(
    '101createRatsonProposal',
    {
      ratson: ratsonId,
      kind: 'custom_offer',
      status_proposal: 'suggested',
      proposer_users: [String(context.userId)],
      total_price: price,
      auto_generated: false,
      open_mission: String(openMissionId),
      covered_missions: coveredMissions,
      publishedAt: nowISO
    },
    context.jwt,
    context.fetch
  );
  const proposalId = propRes?.data?.createRatsonProposal?.data?.id ? String(propRes.data.createRatsonProposal.data.id) : null;
  if (!proposalId) throw new Error('Failed to create volunteer proposal for wish');

  // Other terms than the published ones are the first counter of the negotiation:
  // log it, with the reason, so the wisher sees what was proposed and why.
  if (countered && coveredMissions.length > 0) {
    try {
      await strapi.execute(
        '387counterRatsonProposal',
        {
          id: proposalId,
          ratson_willingness_entry: [
            {
              user: String(context.userId),
              item_kind: 'covered_mission',
              item_idx: 0,
              agree: false,
              note: String(args.terms?.note ?? '').trim() || undefined,
              submittedAt: nowISO,
              willingHours: hours,
              willingAmount: price
            }
          ]
        },
        context.jwt,
        context.fetch
      );
    } catch (e) {
      console.warn('[volunteerProposal] could not log the volunteer’s own terms (non-fatal):', e);
    }
  }

  // Update user.askeds so the UI can reflect "already applied"
  const askedsRes = await strapi.execute('80usersPermissionsUserWithAskeds', { id: context.userId }, context.jwt, context.fetch);
  const existingIds: string[] =
    askedsRes?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data?.map((a: any) => String(a.id)) ?? [];
  await strapi.execute(
    '81updateAskeds',
    { userId: context.userId, askedsList: [...existingIds, String(openMissionId)] },
    context.jwt,
    context.fetch
  );

  // Notify the wish owner(s). The action-level `notification` config targets
  // projectMembers and yields nobody here (no project), so we dispatch an
  // explicit owner notification with the channels the wisher needs. Fire and
  // forget — a notification failure must not fail the application.
  if (notifier && ownerIds.length) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
          templates: {
            title: countered
              ? {
                  he: 'הצעה בתנאים אחרים למשימה שלך',
                  en: 'An offer on different terms for your task',
                  ar: 'عرض بشروط أخرى لمهمتك'
                }
              : {
                  he: 'מתנדב/ת חדש/ה למשאלה שלך',
                  en: 'New volunteer for your wish',
                  ar: 'متطوّع جديد لأمنيتك'
                },
            body: countered
              ? {
                  he: 'מישהו מהקהילה הציע לבצע משימה שפרסמת, בתנאים משלו. אפשר להיכנס ל־Concierge לאשר או להציע גרסה אחרת.',
                  en: 'Someone from the community offered to do a task you published, on their own terms. Open Concierge to approve or propose other terms.',
                  ar: 'عرض أحد أفراد المجتمع تنفيذ مهمة نشرتها بشروطه. افتح Concierge للموافقة أو اقتراح شروط أخرى.'
                }
              : {
                  he: 'מישהו מהקהילה הציע לבצע משימה שפרסמת. אפשר להיכנס ל־Concierge כדי לאשר.',
                  en: 'Someone from the community offered to do a task you published. Open Concierge to approve.',
                  ar: 'عرض أحد أفراد المجتمع تنفيذ مهمة نشرتها. افتح Concierge للموافقة.'
                }
          },
          channels: ['socket', 'email', 'push'],
          metadata: { priority: 'high', type: 'ratsonProposal', url: `/concierge/${ratsonId}` }
        },
        params,
        { recipientIds: ownerIds, data: { proposalId, ratsonId, openMissionId } },
        context
      )
      .catch((e: unknown) => console.warn('[volunteerProposal] owner notification failed (non-fatal):', e));
  }

  return {
    data: { proposalId, ratsonId, openMissionId: String(openMissionId), coveredIdx: matchedIdx, concierge: true, countered },
    updateStrategy: { type: 'none' }
  };
}
