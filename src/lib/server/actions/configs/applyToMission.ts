import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const applyToMissionHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, projectId, existingAskedIds = [] } = params;

  const now = new Date();
  const nowISO = now.toISOString();

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

  // Create Timegrama deadline
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

  return {
    data: { askId, openMissionId },
    updateStrategy: { type: 'none' },
  };
};

export const applyToMissionConfig: ActionConfig = {
  key: 'applyToMission',
  description: 'Apply to an open mission. Solo project (1 member = self): creates Mesimabetahalich directly + archives OpenMission. Multi-member project: creates Ask + Timegrama deadline. Updates user.askeds in both cases.',
  graphqlOperation: applyToMissionHandler,

  paramSchema: {
    openMissionId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    existingAskedIds: { type: 'array', required: false },
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
