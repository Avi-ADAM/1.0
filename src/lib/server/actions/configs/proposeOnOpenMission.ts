/**
 * Action Configuration: Candidate proposes parallel terms on an open mission.
 *
 * Unlike the internal pendm negotiation (submitNegoMission) — between rights-holders —
 * an open mission can attract several candidates at once. Each candidate gets their own
 * Ask, and their proposed terms are stored as a Negopendmission round bound to that Ask.
 * The OpenMission stays untouched as the rikma's baseline for comparison.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput } from './actionUtils.js';

const resMs: Record<string, number> = {
  feh: 48 * 3_600_000,
  sth: 72 * 3_600_000,
  nsh: 96 * 3_600_000,
  sevend: 168 * 3_600_000,
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, projectId } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;

  const now = new Date();
  const nowISO = now.toISOString();
  const requesterId = String(context.userId);

  // 1. Project members + restime (for deadline + notifications).
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = (projectRes as any)?.data?.project?.data?.attributes;
  const memberIds: string[] = (projectAttrs?.user_1s?.data || []).map((m: any) => String(m.id));
  const restime: string = projectAttrs?.restime ?? '';

  // 2. Fetch existing asked IDs so user.askeds stays consistent.
  const askedsRes = await strapi.execute(
    '80usersPermissionsUserWithAskeds',
    { id: context.userId },
    context.jwt,
    context.fetch
  );
  const existingAskedIds: string[] =
    (askedsRes as any)?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data?.map((a: any) => String(a.id)) ?? [];

  // 3. Create the Ask with the candidate's initial vote. Ask carries no scalar
  //    negotiation-state — round/turn/status derive from Negopendmission rounds.
  const vote = [{
    what: true,
    users_permissions_user: requesterId,
    ide: parseInt(requesterId, 10),
    zman: nowISO,
  }];
  const askRes = await strapi.execute(
    '81.5createAsk',
    { userId: requesterId, openMissionId, projectId, publishedAt: nowISO, vote },
    context.jwt,
    context.fetch
  );
  const askId = (askRes as any)?.data?.createAsk?.data?.id;
  if (!askId) throw new Error('Failed to create Ask');

  // 4. Store the candidate's proposed terms as a Negopendmission round bound to
  //    the Ask + OpenMission. The OpenMission itself is NOT modified.
  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegopendmissionRound',
    {
      publishedAt: nowISO,
      userId: requesterId,
      open_mission: openMissionId,
      ask: askId,
      ordern: 0,
      proposedBy: 'candidate',
      status: 'proposed',
      isOriginal: false,
      noofhours: newValues.noofhours ?? null,
      perhour: newValues.perhour ?? null,
      hearotMeyuchadot: newValues.hearotMeyuchadot ?? null,
      descrip: newValues.descrip ?? null,
      name: newValues.name ?? null,
      skills: newValues.skillIds ?? null,
      tafkidims: newValues.roleIds ?? null,
      work_ways: newValues.workwayIds ?? null,
      sqadualed: newValues.sqadualed ?? null,
      dates: newValues.dates ?? null,
      location: loc ? [loc] : [],
    },
    context.jwt,
    context.fetch
  );

  // 5. Update user.askeds with the new open mission appended.
  const newAskedIds = [...existingAskedIds.map(String), String(openMissionId)];
  await strapi.execute(
    '81updateAskeds',
    { userId: context.userId, askedsList: newAskedIds },
    context.jwt,
    context.fetch
  );

  // 6. Deadline timegrama (same windows as applyToMission).
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

  const recipientIds = Array.from(new Set([...memberIds, requesterId].filter(Boolean)));

  return {
    data: { askId, openMissionId },
    recipientIds,
    updateStrategy: { type: 'none' },
  };
};

export const proposeOnOpenMissionConfig: ActionConfig = {
  key: 'proposeOnOpenMission',
  description:
    "Candidate proposes parallel terms on an open mission. Creates an Ask plus a Negopendmission round holding the proposed terms — without overwriting the shared OpenMission. The rights-holders then vote or counter.",
  graphqlOperation: handler,

  paramSchema: {
    openMissionId: { type: 'string', required: true, description: 'ID of the open mission' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID' },
    newValues: {
      type: 'object',
      required: false,
      description:
        'Proposed terms: name, descrip, hearotMeyuchadot, noofhours, perhour, skillIds, roleIds, workwayIds, sqadualed, dates, location',
    },
    originalValues: {
      type: 'object',
      required: false,
      description: "The rikma's baseline terms (reference only — not written anywhere)",
    },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' },
    },
    templates: {
      title: { he: 'הצעה מקבילה למשימה', en: 'Counter-proposal for a mission' },
      body: {
        he: 'מועמד הגיש הצעה מתוקנת למשימה בריקמה',
        en: 'A candidate submitted revised terms for a mission',
      },
    },
    channels: ['socket'],
    metadata: { type: 'missionApplication', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
