import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const applyToMissionHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { openMissionId, projectId } = params;

  const now = new Date();
  const nowISO = now.toISOString();

  // ── CONCIERGE CASE: source='concierge' open missions have no project ────────
  // When a user volunteers for a community-published wish need (created via
  // publishWishNeedToCommunity), the open mission has no project attached.
  // Instead of going through the Ask/project-vote flow, we create a volunteer
  // ratsonProposal on the linked wish — same shape as offerWishHelp (a
  // kind=custom_offer offer with the applicant as proposer_user). Linking it to
  // the source extracted need via covered_missions is what makes it surface
  // under the right plan row on /concierge/[id]; we also notify the wish owner
  // (socket + email + push) so it shows up as a reaction in their lev/Concierge.
  if (!projectId) {
    // Load the open mission to get the linked ratson + its published name/rate
    const omRes = await strapi.execute(
      '51GetOpenMissionById',
      { id: openMissionId },
      context.jwt,
      context.fetch
    );
    const omAttrs = omRes?.data?.openMission?.data?.attributes;
    if (!omAttrs) throw new Error('OpenMission not found');

    const ratsonId = omAttrs.ratson?.data?.id ? String(omAttrs.ratson.data.id) : null;
    if (!ratsonId) {
      throw new Error('This mission has no project and no linked wish — cannot apply');
    }

    // Load the wish so we can (a) link this offer to the exact extracted need it
    // was published from, and (b) notify the wish owner.
    const ratRes = await strapi.execute(
      '105queryRatsonWithProposals',
      { id: ratsonId },
      context.jwt,
      context.fetch
    );
    const ratAttrs = ratRes?.data?.ratson?.data?.attributes ?? {};
    const ownerIds: string[] = (ratAttrs.users_permissions_users?.data ?? []).map((o: any) =>
      String(o.id)
    );

    // Resolve which extracted need this open mission was published from. Prefer
    // the STABLE extracted-component id persisted on the open mission at publish
    // time (`extractedKey`) — robust against the owner later renaming/reordering
    // needs. The /concierge/[id] matcher accepts either the array index OR the
    // component id as `extracted_mission_idx`. Best-effort read: the field may not
    // be live in Strapi yet, so we fall back to matching by name → array index.
    let extractedKey: string | null = null;
    try {
      const kRes = await strapi.execute(
        'getOpenMissionExtractedKey',
        { id: openMissionId },
        context.jwt,
        context.fetch
      );
      const raw = kRes?.data?.openMission?.data?.attributes?.extractedKey;
      extractedKey = raw != null && String(raw) !== '' ? String(raw) : null;
    } catch (e) {
      console.warn('[applyToMission] extractedKey read failed (field may not be live yet):', e);
    }

    const extractedMissions: any[] = ratAttrs.extracted_missions ?? [];
    const omName = String(omAttrs.name ?? '').trim();
    const matchedIdx = omName
      ? extractedMissions.findIndex((m: any) => String(m?.name ?? '').trim() === omName)
      : -1;

    // Value written into covered_missions: the stable component id when we have
    // it, otherwise the matched array index (legacy/name-match path). If neither
    // resolves we still create the offer; it just won't auto-attach to a row.
    const coveredIdxValue =
      extractedKey != null ? extractedKey : matchedIdx >= 0 ? String(matchedIdx) : null;

    const price = (omAttrs.noofhours ?? 0) * (omAttrs.perhour ?? 0);
    const coveredMissions =
      coveredIdxValue != null
        ? [{ extracted_mission_idx: coveredIdxValue, hours: omAttrs.noofhours ?? null, price }]
        : [];

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
    const proposalId = propRes?.data?.createRatsonProposal?.data?.id
      ? String(propRes.data.createRatsonProposal.data.id)
      : null;
    if (!proposalId) throw new Error('Failed to create volunteer proposal for wish');

    // Update user.askeds so the UI can reflect "already applied"
    const askedsRes = await strapi.execute(
      '80usersPermissionsUserWithAskeds',
      { id: context.userId },
      context.jwt,
      context.fetch
    );
    const existingIds: string[] =
      askedsRes?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data?.map(
        (a: any) => String(a.id)
      ) ?? [];
    const newAskedIds = [...existingIds, String(openMissionId)];
    await strapi.execute(
      '81updateAskeds',
      { userId: context.userId, askedsList: newAskedIds },
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
              title: {
                he: 'מתנדב/ת חדש/ה למשאלה שלך',
                en: 'New volunteer for your wish',
                ar: 'متطوّع جديد لأمنيتك'
              },
              body: {
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
        .catch((e: unknown) =>
          console.warn('[applyToMission] concierge owner notification failed (non-fatal):', e)
        );
    }

    return {
      data: { proposalId, ratsonId, openMissionId, concierge: true, coveredIdx: matchedIdx },
      updateStrategy: { type: 'none' },
    };
  }

  // Fetch project members + restime in one call
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = projectRes?.data?.project?.data?.attributes;
  const memberIds: string[] = (projectAttrs?.user_1s?.data || []).map((m: any) => String(m.id));
  const restime: string = projectAttrs?.restime ?? '';

  // Fetch existing asked IDs server-side so clients don't need to send them
  const askedsRes = await strapi.execute(
    '80usersPermissionsUserWithAskeds',
    { id: context.userId },
    context.jwt,
    context.fetch
  );
  const existingAskedIds: string[] =
    askedsRes?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data?.map((a: any) => String(a.id)) ?? [];

  // ── SOLO CASE: single-member project where that member is the applicant ──
  // Creating an Ask with an initial self-vote would leave it permanently stuck
  // (the voter can never see it to approve). Skip the Ask entirely and create
  // a Mesimabetahalich (mission-in-progress) directly — mirroring what
  // finalizeJoinAcceptance does for the 'solo' variant.
  const isSolo = memberIds.length === 1 && memberIds[0] === String(context.userId);

  if (isSolo) {
    // 1. Fetch OpenMission details (name, mission link, hours, acts, etc.)
    const omRes = await strapi.execute(
      '51GetOpenMissionById',
      { id: openMissionId },
      context.jwt,
      context.fetch
    );
    const omAttrs = omRes?.data?.openMission?.data?.attributes;
    if (!omAttrs) throw new Error('OpenMission not found');

    const missId = omAttrs.mission?.data?.id;
    if (!missId) throw new Error('OpenMission has no linked mission entity');

    const iskvua: boolean = omAttrs.iskvua ?? false;
    const deadline: string | null = omAttrs.dates ?? null;
    const sqedualed: string | null = omAttrs.sqadualed ?? null;
    const acts: any[] = omAttrs.acts?.data ?? [];
    const tafkidimsStr = (omAttrs.tafkidims?.data ?? [])
      .map((t: any) => `"${t.id}"`)
      .join(',');
    const dateFragment = deadline ? `admaticedai: "${deadline}"` : '';
    const sdateFragment = sqedualed ? `start: "${sqedualed}"` : '';

    // 2. Atomic mutation: createMesimabetahalich + updateOpenMission (archive)
    //    (same pattern as finalizeJoinAcceptance main mutation, minus Ask/member parts)
    const strapiUrl = process.env.VITE_URL || 'https://tovmeod.1lev1.com';
    const graphqlUrl = `${strapiUrl}/graphql`;
    const headers = {
      Authorization: `bearer ${context.jwt}`,
      'Content-Type': 'application/json',
    };

    const mainMutation = `mutation {
      createMesimabetahalich(data: {
        project: "${projectId}",
        mission: "${missId}",
        hearotMeyuchadot: "${omAttrs.hearotMeyuchadot ?? ''}",
        name: "${omAttrs.name ?? ''}",
        descrip: "${omAttrs.descrip ?? ''}",
        hoursassinged: ${omAttrs.noofhours ?? 0},
        perhour: ${omAttrs.perhour ?? 0},
        iskvua: ${iskvua},
        privatlinks: "${omAttrs.privatlinks ?? ''}",
        publicklinks: "${omAttrs.publicklinks ?? ''}",
        users_permissions_user: "${context.userId}",
        tafkidims: [${tafkidimsStr}],
        publishedAt: "${nowISO}",
        open_missions: ["${openMissionId}"],
        ${dateFragment}
        ${sdateFragment}
      }) { data { id attributes { project { data { id } } } } }

      updateOpenMission(id: "${openMissionId}", data: { archived: true }) {
        data { id attributes { archived acts { data { id } } } }
      }
    }`;

    const res = await context.fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: mainMutation }),
    });
    const responseData = await res.json();
    if (responseData.errors) {
      throw new Error(`Solo mission creation failed: ${JSON.stringify(responseData.errors)}`);
    }

    const chiluzh: string = responseData.data?.createMesimabetahalich?.data?.id;
    if (!chiluzh) throw new Error('Failed to create Mesimabetahalich (solo path)');

    // 3. Inherit process anchors (partofs) from OpenMission → Mesimabetahalich
    try {
      const partofRes = await strapi.execute(
        '97getOpenMissionPartofs',
        { id: openMissionId },
        context.jwt,
        context.fetch
      );
      const partofIds: string[] =
        partofRes?.data?.openMission?.data?.attributes?.partofs?.data?.map((e: any) => String(e.id)) ?? [];
      if (partofIds.length > 0) {
        await strapi.execute(
          '95updateMesimabetahalichPartofs',
          { id: chiluzh, partofIds },
          context.jwt,
          context.fetch
        );
      }
    } catch {
      // Non-fatal: process anchors are best-effort
    }

    // 4. Create Monter for recurring missions (iskvua)
    if (iskvua) {
      const startDate =
        sqedualed && new Date(sqedualed) > now ? sqedualed : nowISO;
      const monterQuery = `mutation {
        createMonter(data: {
          mesimabetahalich: "${chiluzh}",
          ani: "mesimabetahalich"
          start: "${startDate}"
          ${deadline ? `finish: "${deadline}"` : ''}
        }) { data { id } }
      }`;
      await context.fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: monterQuery }),
      });
    }

    // 5. Update acts (tasks from OpenMission): mark as assigned to this user
    for (const act of acts) {
      try {
        await strapi.execute(
          '31updateTask',
          {
            id: act.id,
            myIshur: true,
            isAssigned: true,
            uid: [String(context.userId)],
            mesimabetahaliches: [chiluzh],
          },
          context.jwt,
          context.fetch
        );
      } catch {
        // Non-fatal
      }
    }

    // 6. Update user.askeds (keep consistent state)
    const newAskedIds = [...existingAskedIds.map(String), String(openMissionId)];
    await strapi.execute(
      '81updateAskeds',
      { userId: context.userId, askedsList: newAskedIds },
      context.jwt,
      context.fetch
    );

    return {
      data: { mesimabetahalichId: chiluzh, openMissionId, solo: true },
      updateStrategy: { type: 'none' },
    };
  }

  // ── NORMAL CASE: multi-member project → create Ask with vote ─────────────

  // Add initial vote (current user is a project member)
  const vote = memberIds.includes(String(context.userId))
    ? [{ what: true, users_permissions_user: context.userId, ide: parseInt(String(context.userId), 10), zman: nowISO }]
    : undefined;

  // Update user.askeds with the new open mission appended
  const newAskedIds = [...existingAskedIds.map(String), String(openMissionId)];
  await strapi.execute(
    '81updateAskeds',
    { userId: context.userId, askedsList: newAskedIds },
    context.jwt,
    context.fetch
  );

  // Create Ask
  const askRes = await strapi.execute(
    '81.5createAsk',
    {
      userId: context.userId,
      openMissionId,
      projectId,
      publishedAt: nowISO,
      vote,
    },
    context.jwt,
    context.fetch
  );
  const askId = askRes?.data?.createAsk?.data?.id;
  if (!askId) throw new Error('Failed to create Ask');

  // Create Timegrama deadline ONLY when the applicant is a rikma member (Path C:
  // their own favorable vote already exists, so the auto-approval clock can run).
  // For an external candidate (Path A) the timegrama is deferred until a member
  // first engages — created then by addVote (the ask vote path).
  if (memberIds.includes(String(context.userId))) {
    const resMs: Record<string, number> = {
      feh: 48 * 3_600_000,
      sth: 72 * 3_600_000,
      nsh: 96 * 3_600_000,
      sevend: 168 * 3_600_000,
    };
    const offsetMs = resMs[restime] ?? 0;
    if (offsetMs > 0) {
      const deadline = new Date(now.getTime() + offsetMs);
      await strapi.execute(
        '82createTimegramaForAsk',
        { date: deadline.toISOString(), whatami: 'ask', askId },
        context.jwt,
        context.fetch
      );
    }
  }

  return {
    data: { askId, openMissionId },
    updateStrategy: { type: 'none' },
  };
};

export const applyToMissionConfig: ActionConfig = {
  key: 'applyToMission',
  description: 'Apply to an open mission. Concierge missions (no projectId): creates volunteer ratsonProposal on the linked wish. Solo project (1 member = self): creates Mesimabetahalich directly + archives OpenMission. Multi-member project: creates Ask + Timegrama deadline. Updates user.askeds in all cases.',
  graphqlOperation: applyToMissionHandler,

  paramSchema: {
    openMissionId: { type: 'string', required: true },
    // projectId is optional: concierge open missions (source='concierge') have no
    // project — the action detects this and routes to the ratsonProposal flow instead.
    projectId: { type: 'string', required: false },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: { he: 'בקשה לביצוע משימה', en: 'Mission application' },
      body: { he: 'יש בקשה חדשה לביצוע משימה בפרויקט', en: 'A new mission application was submitted' },
    },
    channels: ['socket'],
    metadata: { type: 'missionApplication', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
