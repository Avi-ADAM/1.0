/**
 * Action: nominateSelfMission (PLAN_SELF_NOMINATION §3.1)
 *
 * A non-member proposes themselves to a rikma from the public join page:
 * "take me in on these terms — I'll do this". The candidate authors the
 * mission (their ideal terms are the negotiation baseline), and the existing
 * candidacy machine takes over unchanged:
 *
 *  1. Mission entity (the template the candidate wrote)
 *  2. OpenMission with source:'selfNomination' — never shown in public lists
 *  3. Ask without a vote (Path A: applying IS the candidate's consent)
 *  4. NO timegrama — deferred to the first member engagement
 *     (ensureCandidacyTimegrama inside addVote), per the negotiation plan
 *
 * Members are rejected: they have the moach (and the isRishon path).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, name, descrip, noofhours, perhour, hearotMeyuchadot } = params;

  const now = new Date();
  const nowISO = now.toISOString();
  const requesterId = String(context.userId);

  // 1. Project members — the whole point is joining, so members are redirected.
  const projectRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projectAttrs = projectRes?.data?.project?.data?.attributes;
  if (!projectAttrs) throw new Error('Project not found');
  const memberIds: string[] = (projectAttrs.user_1s?.data ?? []).map((m: any) => String(m.id));
  if (memberIds.includes(requesterId)) {
    throw new Error('Project members create missions from the moach, not by self-nomination');
  }

  // 2. Mission entity — the candidate-authored template. Required because the
  //    acceptance finalizer creates the Mesimabetahalich against om.mission.
  const missionRes = await strapi.execute(
    '21createMission',
    { missionName: name, descrip: descrip ?? null, skills: [], tafkidims: [], publishedAt: nowISO },
    context.jwt,
    context.fetch
  );
  const missionId = missionRes?.data?.createMission?.data?.id;
  if (!missionId) throw new Error('Failed to create Mission entity');

  // 3. OpenMission carrying the candidate's terms.
  let openMissionId: string | undefined;
  try {
    const omRes = await strapi.execute(
      '214createSelfNomOpenMission',
      {
        projectId,
        missionId,
        name,
        descrip: descrip ?? null,
        noofhours: noofhours ?? null,
        perhour: perhour ?? null,
        hearotMeyuchadot: hearotMeyuchadot ?? null,
        source: 'selfNomination',
        publishedAt: nowISO,
      },
      context.jwt,
      context.fetch
    );
    openMissionId = omRes?.data?.createOpenMission?.data?.id;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes('ENUM_OPENMISSION_SOURCE') || /source/i.test(msg)) {
      throw new Error(
        "Self-nomination needs the 'selfNomination' value added to open-mission.source in Strapi (then npm run types:update)"
      );
    }
    throw e;
  }
  if (!openMissionId) throw new Error('Failed to create OpenMission');

  // 4. Ask — no vote: the external candidate's application is their consent
  //    (Path A). The timegrama comes later, on the first member vote.
  const askRes = await strapi.execute(
    '81.5createAsk',
    { userId: requesterId, openMissionId, projectId, publishedAt: nowISO },
    context.jwt,
    context.fetch
  );
  const askId = askRes?.data?.createAsk?.data?.id;
  if (!askId) throw new Error('Failed to create Ask');

  // 5. user.askeds — so the UI reflects "already applied".
  const askedsRes = await strapi.execute(
    '80usersPermissionsUserWithAskeds',
    { id: requesterId },
    context.jwt,
    context.fetch
  );
  const existingIds: string[] =
    askedsRes?.data?.usersPermissionsUser?.data?.attributes?.askeds?.data?.map((a: any) =>
      String(a.id)
    ) ?? [];
  await strapi.execute(
    '81updateAskeds',
    { userId: requesterId, askedsList: [...existingIds, String(openMissionId)] },
    context.jwt,
    context.fetch
  );

  return {
    data: { openMissionId, askId, missionId, projectId },
    updateStrategy: { type: 'none' },
  };
};

export const nominateSelfMissionConfig: ActionConfig = {
  key: 'nominateSelfMission',
  description:
    "Self-nomination (mission): a non-member authors an OpenMission with their own terms (source:'selfNomination') + Ask. Existing candidacy machine (votes, counters, timegrama-on-first-vote) takes over.",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    name: { type: 'string', required: true, description: "The candidate's mission title" },
    descrip: { type: 'string', required: false },
    noofhours: { type: 'number', required: false },
    perhour: { type: 'number', required: false, description: "Candidate's ideal hourly rate" },
    hearotMeyuchadot: { type: 'string', required: false },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: {
        he: 'מישהו מציע את עצמו לריקמה שלכם 🌱',
        en: 'Someone is nominating themselves to your rikma 🌱',
        ar: 'شخص ما يرشّح نفسه لنسيجكم 🌱',
      },
      body: {
        he: 'התקבלה הצעה עצמית חדשה — משימה בתנאי המציע/ה. היכנסו ללב כדי להגיב.',
        en: 'A new self-nomination arrived — a mission on the candidate’s terms. Open Lev to respond.',
        ar: 'وصل ترشيح ذاتي جديد — مهمة بشروط المرشّح. افتحوا ليف للرد.',
      },
    },
    channels: ['socket', 'email', 'push'],
    metadata: { type: 'selfNomination', url: 'lev', priority: 'high' },
  },

  updateStrategy: { type: 'none' },
};
