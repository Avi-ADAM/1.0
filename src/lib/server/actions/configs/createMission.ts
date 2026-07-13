/**
 * Action: createMission
 *
 * Server-authoritative mission creation. Handles all 4 branches:
 *
 * Branch 1 — Multi-user, open vote (Pendm)
 *   userCount > 1 && !assignedUserId
 *   → createMission (if new) → createPendm (with initial YES vote)
 *     → createTimegrama(pendm) → notification(kind:'pend')
 *
 * Branch 2 — Multi-user, assigned to specific member (OpenMission + Ask)
 *   userCount > 1 && assignedUserId set
 *   → createMission (if new) → createOpenMission(rishon, archived:true, isRishon:true)
 *     → createAsk(open_mission, assignedUser, initial vote)
 *     → createTimegrama(ask) → notification(kind:'pendAsk')
 *
 * Branch 3 — Solo project, open (OpenMission isRishon:false)
 *   userCount === 1 && !assignedUserId
 *   → createMission (if new) → createOpenMission(isRishon:false)
 *
 * Branch 4 — Solo project, assigned to self (Mesimabetahalich)
 *   userCount === 1 && assignedUserId === context.userId (self)
 *   → createMission (if new) → createMesimabetahalich(userId=self)
 *
 * After entity creation (all branches):
 *   → attachEntityToProcess (if processId)
 *   → createTask for each checklist item
 *
 * Client sends pre-resolved IDs (skill IDs, role IDs, workway IDs, vallue IDs)
 * so the server doesn't need to look up names.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { calcDeadlineMs, restimeLabel, voteUrl } from './actionUtils.js';
import { createMissionConsentSpec } from '$lib/consent/specs/s2b';
import { matchOpenMissionToUsers } from '$lib/server/matching/engine';

interface ChecklistItem {
  shem: string;
  des?: string;
  link?: string;
  dateS?: string;
  dateF?: string;
}

function buildLocationInput(
  isOnline?: boolean,
  lat?: number | null,
  lng?: number | null,
  radius?: number | null,
  location_hint?: string | null
): Record<string, unknown> | null {
  if (lat == null && lng == null && !location_hint && isOnline === undefined) return null;
  const loc: Record<string, unknown> = {};
  if (lat != null) loc.lat = lat;
  if (lng != null) loc.lng = lng;
  if (radius != null) loc.radius = Math.round(radius);
  if (location_hint) loc.location_hint = location_hint;
  if (isOnline === true) loc.location_mode = 'online';
  return Object.keys(loc).length > 0 ? loc : null;
}

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const {
    projectId,
    existingMissionId,
    missionName,
    descrip,
    skillIds = [],
    roleIds = [],
    workwayIds = [],
    vallueIds = [],
    nhours = 0,
    valph = 0,
    iskvua = false,
    dateStart,
    dateEnd,
    publicklinks,
    privatlinks,
    spnot,
    assignedUserId,       // set → assigned to someone; null/absent → open
    checklist = [],
    processId,
    isOnline,
    lat,
    lng,
    radius,
    location_hint,
  } = params;

  const { userId } = context;
  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Fetch project to determine member count and restime
  const projRes = await strapi.execute(
    '128getProjectMembersAndRestime',
    { pid: projectId },
    context.jwt,
    context.fetch,
  );
  const projAttrs = projRes?.data?.project?.data?.attributes;
  if (!projAttrs) throw new Error('Project not found');

  const members: any[] = projAttrs.user_1s?.data ?? [];
  const userCount = members.length;
  const restime: string = projAttrs.restime ?? 'feh';
  const deadlineISO = new Date(Date.now() + calcDeadlineMs(restime)).toISOString();

  // Context for the case-specific notifications sent at the end of the handler.
  const projectName: string = projAttrs.projectName ?? '';
  const projectPic: string =
    projAttrs.profilePic?.data?.attributes?.url ??
    'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';
  const memberName = (id: unknown): string =>
    members.find((m) => String(m.id) === String(id))?.attributes?.username ?? '';
  const creatorName = memberName(userId);

  // 2. Create the base Mission entity (if not editing an existing one)
  let missionId: string;
  if (existingMissionId) {
    missionId = String(existingMissionId);
  } else {
    const missionRes = await strapi.execute(
      '21createMission',
      {
        missionName,
        descrip: descrip ?? null,
        skills: skillIds,
        tafkidims: roleIds,
        publishedAt: deadlineISO,
      },
      context.jwt,
      context.fetch,
    );
    missionId = missionRes?.data?.createMission?.data?.id;
    if (!missionId) throw new Error('Failed to create Mission entity');
  }

  const locationInput = buildLocationInput(isOnline, lat, lng, radius, location_hint);

  // 2b. Fire-and-forget: create Strapi localizations for newly created Mission entries
  if (!existingMissionId && missionId) {
    const sourceLocale = (context as any).lang ?? 'he';
    // Use the request-scoped fetch so the request carries auth cookies
    (context.fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: 'missions', entryId: Number(missionId), sourceLocale }),
    }).catch((e: unknown) => {
      console.warn('[createMission] localization trigger failed:', e);
    })) as Promise<void>;
  }

  // Common fields for OpenMission / Pendm
  const commonFields: Record<string, unknown> = {
    projectId,
    missionId,
    name: missionName,
    descrip: descrip ?? null,
    skills: skillIds,
    tafkidims: roleIds,
    workWays: workwayIds,
    vallues: vallueIds,
    noofhours: nhours > 0 ? nhours : null,
    perhour: valph > 0 ? valph : null,
    iskvua,
    sqadualed: dateStart ?? null,
    dates: dateEnd ?? null,
    publicklinks: publicklinks ?? null,
    privatlinks: privatlinks ?? null,
    hearotMeyuchadot: spnot ?? null,
    publishedAt: nowISO,
    ...(locationInput ? { location: locationInput } : {}),
  };

  const initialVote = [
    {
      what: true,
      users_permissions_user: userId,
      ide: parseInt(String(userId), 10),
      order: 0,
      zman: nowISO,
    },
  ];

  let createdEntityId: string | null = null;
  let createdEntityType: string | null = null;
  let notificationKind: string | null = null;
  let createdAskId: string | null = null;

  // ── BRANCH 1: Multi-user, open vote → Pendm ──────────────────────────────
  if (userCount > 1 && !assignedUserId) {
    const pendmRes = await strapi.execute(
      '163createPendm',
      { ...commonFields, users: initialVote },
      context.jwt,
      context.fetch,
    );
    createdEntityId = pendmRes?.data?.createPendm?.data?.id;
    if (!createdEntityId) throw new Error('Failed to create Pendm');
    createdEntityType = 'pendm';

    await strapi.execute(
      '165createTimegramaForPendm',
      { date: deadlineISO, pendmId: createdEntityId },
      context.jwt,
      context.fetch,
    );
    notificationKind = 'pend';
  }
  // ── BRANCH 2: Multi-user, assigned → OpenMission + Ask ───────────────────
  else if (userCount > 1 && assignedUserId) {
    const openRes = await strapi.execute(
      '164createOpenMission',
      {
        ...commonFields,
        isRishon: true,
        rishon: String(assignedUserId),
        archived: true,
      },
      context.jwt,
      context.fetch,
    );
    createdEntityId = openRes?.data?.createOpenMission?.data?.id;
    if (!createdEntityId) throw new Error('Failed to create OpenMission (branch 2)');
    createdEntityType = 'openMission';

    // Create Ask for the assigned person
    const askRes = await strapi.execute(
      '81.5createAsk',
      {
        userId: String(assignedUserId),
        openMissionId: createdEntityId,
        projectId,
        publishedAt: nowISO,
        vote: initialVote,
      },
      context.jwt,
      context.fetch,
    );
    const askId = askRes?.data?.createAsk?.data?.id;
    if (askId) {
      createdAskId = String(askId);
      await strapi.execute(
        '82createTimegramaForAsk',
        { date: deadlineISO, whatami: 'ask', askId },
        context.jwt,
        context.fetch,
      );
    }
    notificationKind = 'pendAsk';
  }
  // ── BRANCH 3: Solo, open → OpenMission (isRishon:false) ──────────────────
  else if (userCount <= 1 && !assignedUserId) {
    const openRes = await strapi.execute(
      '164createOpenMission',
      {
        ...commonFields,
        isRishon: false,
        rishon: null,
        archived: false,
      },
      context.jwt,
      context.fetch,
    );
    createdEntityId = openRes?.data?.createOpenMission?.data?.id;
    if (!createdEntityId) throw new Error('Failed to create OpenMission (branch 3)');
    createdEntityType = 'openMission';

    // Tag every relevant user with a match-suggestion (+ email) so the lev
    // page can pull ready-made suggestions instead of matching client-side.
    await matchOpenMissionToUsers(String(createdEntityId), 'missionCreated', {
      strapi,
      fetch: context.fetch,
      lang: context.lang
    });
  }
  // ── BRANCH 4: Solo, self-assigned → Mesimabetahalich ─────────────────────
  else {
    // userCount <= 1 && assignedUserId (= self)
    const mbRes = await strapi.execute(
      '72createMesimabetahalich',
      {
        projectId,
        missId: missionId,
        userId: String(userId),
        openmissionName: missionName,
        missionDetails: descrip ?? null,
        nhours: nhours > 0 ? nhours : 0,
        valph: valph > 0 ? valph : 0,
        iskvua,
        hearotMeyuchadot: spnot ?? null,
        privatlinks: privatlinks ?? null,
        publicklinks: publicklinks ?? null,
        tafkidims: roleIds,
        publishedAt: nowISO,
        sqedualed: dateStart ?? null,
        deadline: dateEnd ?? null,
      },
      context.jwt,
      context.fetch,
    );
    createdEntityId = mbRes?.data?.createMesimabetahalich?.data?.id;
    if (!createdEntityId) throw new Error('Failed to create Mesimabetahalich');
    createdEntityType = 'mesimabetahalich';
  }

  // 3. Attach to process (if processId provided)
  if (processId && createdEntityId && createdEntityType) {
    await strapi.execute(
      'attachEntityToProcess',
      {
        processId: String(processId),
        projectId: String(projectId),
        entityType: createdEntityType,
        entityId: String(createdEntityId),
        name: missionName,
      },
      context.jwt,
      context.fetch,
    ).catch(() => {
      // Non-fatal: process attachment failure shouldn't block mission creation
    });
  }

  // 4. Create checklist tasks
  for (const item of (checklist as ChecklistItem[])) {
    const taskParams: Record<string, any> = {
      pid: projectId,
      shem: item.shem,
      des: item.des ?? null,
      link: item.link ?? null,
      publishedAt: nowISO,
      askId: userId,
      dateS: item.dateS ?? null,
      dateF: item.dateF ?? null,
      myIshur: null,
      assignedId: null,
    };
    // Wire the checklist task to the right entity type
    if (createdEntityType === 'pendm') {
      taskParams.pendm = createdEntityId;
      taskParams.open_mission = null;
      taskParams.mbId = null;
    } else if (createdEntityType === 'openMission') {
      taskParams.pendm = null;
      taskParams.open_mission = createdEntityId;
      taskParams.mbId = null;
    } else if (createdEntityType === 'mesimabetahalich') {
      taskParams.pendm = null;
      taskParams.open_mission = null;
      taskParams.mbId = [createdEntityId];
    }

    await strapi.execute('4crtask', taskParams, context.jwt, context.fetch).catch(() => {});
  }

  // 5. Case-specific notifications (fire-and-forget — never block the response).
  //    Branch 1 (pendm): every member gets a deep link to the vote page plus an
  //    explanation that during the restime they may reshape the proposal.
  //    Branch 2 (assigned): the assigned member gets a personal invitation
  //    (nothing happens without their consent); the rest get the regular notice.
  //    Branches 3/4 are solo projects — nobody to notify.
  if (notifier && createdEntityId) {
    const restimeHe = restimeLabel(restime, 'he');
    const restimeEn = restimeLabel(restime, 'en');

    if (notificationKind === 'pend') {
      const url = voteUrl(projectId, 'pendm', createdEntityId);
      notifier
        .notify(
          {
            recipients: {
              type: 'projectMembers',
              config: { projectIdParam: 'projectId', excludeSender: true },
            },
            templates: {
              title: {
                he: `משימה חדשה להצבעה: "${missionName}"`,
                en: `New mission up for a vote: "${missionName}"`,
              },
              body: {
                he: `${creatorName} הציע/ה בריקמה "${projectName}" את המשימה "${missionName}". במהלך ${restimeHe} של זמן התגובה אפשר לאשר, לפתוח שיחה או להציע גרסה מדויקת משלך — ההצעה משתנה כרצונך וההצעה האחרונה שעל השולחן מאושרת אוטומטית בתום הזמן. לחצו להצבעה.`,
                en: `${creatorName} proposed the mission "${missionName}" in the "${projectName}" rikma. During the ${restimeEn} response window you can approve, open a discussion or counter with your own refined version — the proposal is yours to shape, and the last version on the table is auto-approved when time runs out. Tap to vote.`,
              },
            },
            channels: ['socket', 'push', 'email'],
            emailTemplate: 'PendJustCreated',
            emailTemplateData: {
              un: creatorName,
              pl: projectPic,
              pn: projectName,
              kind: 'pend',
              rishon: '',
              name: missionName,
              restime,
              pid: projectId,
              eid: createdEntityId,
            },
            metadata: { type: 'voteUpdate', url },
          },
          params,
          { projectId, createdEntityId },
          context,
        )
        .catch((e: unknown) => console.warn('[createMission] pend notification failed:', e));
    } else if (notificationKind === 'pendAsk' && createdAskId) {
      const url = voteUrl(projectId, 'ask', createdAskId);
      const assigneeName = memberName(assignedUserId);
      const selfAssigned = String(assignedUserId) === String(userId);

      // 5a. Personal invitation to the assigned member — recruiter style.
      //     Skipped when the creator took the mission themselves (self-proposal):
      //     no point inviting yourself; the other members still get 5b.
      if (!selfAssigned) notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: `✨ ${creatorName} חושב/ת שרק את/ה מתאימ/ה למשימה "${missionName}"`,
                en: `✨ ${creatorName} thinks you're the one for "${missionName}"`,
              },
              body: {
                he: `בריקמה "${projectName}" נולדה משימה חדשה — "${missionName}" — ו${creatorName} בחר/ה דווקא בך. שום דבר לא קורה בלי ההסכמה שלך: המשימה תירשם על שמך רק אם תאשר/י אותה. יש לך ${restimeHe} לאשר, לדייק את התנאים בהצעה נגדית או לפתוח שיחה; אם לא תגיב/י עד אז, ההצעה תיפתח לכל החברים והריקמה תחפש מישהו אחר. לחצו כדי לצפות בכל הפרטים ולהצביע.`,
                en: `A new mission was born in "${projectName}" — "${missionName}" — and ${creatorName} picked you for it. Nothing happens without your consent: the mission is registered under your name only once you approve. You have ${restimeEn} to approve, refine the terms with a counter-offer or open a discussion; if you don't respond in time the offer opens up to everyone and the rikma looks for someone else. Tap to see the full details and vote.`,
              },
            },
            channels: ['socket', 'push', 'email'],
            emailTemplate: 'MissionInvite',
            emailTemplateData: {
              un: creatorName,
              pl: projectPic,
              pn: projectName,
              name: missionName,
              descrip: descrip ?? '',
              nhours: nhours > 0 ? nhours : null,
              valph: valph > 0 ? valph : null,
              dateStart: dateStart ?? null,
              dateEnd: dateEnd ?? null,
              restime,
              pid: projectId,
              askId: createdAskId,
            },
            metadata: { type: 'voteUpdate', url, priority: 'high' },
          },
          { recipients: [String(assignedUserId)], projectId },
          { projectId, createdEntityId, askId: createdAskId },
          context,
        )
        .catch((e: unknown) => console.warn('[createMission] invite notification failed:', e));

      // 5b. Regular notice to the remaining members (not the sender, not the assignee).
      const otherMemberIds = members
        .map((m) => String(m.id))
        .filter((id) => id !== String(userId) && id !== String(assignedUserId));
      if (otherMemberIds.length > 0) {
        const memberTemplates = selfAssigned
          ? {
              title: {
                he: `${creatorName} מציע/ה לקחת את המשימה "${missionName}"`,
                en: `${creatorName} offers to take on "${missionName}"`,
              },
              body: {
                he: `${creatorName} הציע/ה בריקמה "${projectName}" את המשימה "${missionName}" ומציע/ה לבצע אותה בעצמו/ה. במהלך ${restimeHe} של זמן התגובה אפשר לאשר, לדייק את התנאים או לפתוח שיחה — ההצעה האחרונה שעל השולחן מאושרת אוטומטית בתום הזמן. לחצו להצבעה.`,
                en: `${creatorName} proposed the mission "${missionName}" in "${projectName}" and offers to carry it out themselves. During the ${restimeEn} response window you can approve, refine the terms or open a discussion — the last version on the table is auto-approved when time runs out. Tap to vote.`,
              },
            }
          : {
              title: {
                he: `משימה חדשה בדרך אל ${assigneeName}: "${missionName}"`,
                en: `New mission on its way to ${assigneeName}: "${missionName}"`,
              },
              body: {
                he: `${creatorName} הציע/ה בריקמה "${projectName}" את המשימה "${missionName}" והועיד/ה אותה ל${assigneeName}. ההצעה ממתינה להסכמתו/ה, וגם אתם מוזמנים להביע עמדה, לדייק או לפתוח שיחה במהלך ${restimeHe} של זמן התגובה. לחצו להצבעה.`,
                en: `${creatorName} proposed the mission "${missionName}" in "${projectName}" and offered it to ${assigneeName}. It now awaits their consent — and you too can weigh in, refine or open a discussion during the ${restimeEn} response window. Tap to vote.`,
              },
            };
        notifier
          .notify(
            {
              recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
              templates: memberTemplates,
              channels: ['socket', 'push', 'email'],
              emailTemplate: 'PendJustCreated',
              emailTemplateData: {
                un: creatorName,
                pl: projectPic,
                pn: projectName,
                kind: 'pendAsk',
                rishon: assigneeName,
                name: missionName,
                restime,
                pid: projectId,
                eid: createdAskId,
              },
              metadata: { type: 'voteUpdate', url },
            },
            { recipients: otherMemberIds, projectId },
            { projectId, createdEntityId, askId: createdAskId },
            context,
          )
          .catch((e: unknown) => console.warn('[createMission] pendAsk notification failed:', e));
      }
    }
  }

  return {
    data: {
      missionId,
      createdEntityId,
      createdEntityType,
      notificationKind,
      userCount,
    },
    updateStrategy: { type: 'none' },
  };
};

export const createMissionConfig: ActionConfig = {
  key: 'createMission',
  // S2b shadow event (mission.create) — signed client-side via
  // shadowSignRegistry after the server returns missionId/createdEntityId.
  consentSpec: createMissionConsentSpec,
  description:
    'Create a mission with all 4 branches: Pendm (multi-user open vote), OpenMission+Ask (multi-user assigned), OpenMission solo, or Mesimabetahalich (self-assigned solo). Server resolves user count and deadline from project.',
  graphqlOperation: handler,

  paramSchema: {
    projectId:          { type: 'string',  required: true,  description: 'Project ID' },
    existingMissionId:  { type: 'string',  required: false, description: 'Reuse existing Mission entity ID (edit mode)' },
    missionName:        { type: 'string',  required: true,  description: 'Mission name' },
    descrip:            { type: 'string',  required: false, description: 'Rich-text description (HTML)' },
    skillIds:           { type: 'array',   required: false, description: 'Skill entity IDs' },
    roleIds:            { type: 'array',   required: false, description: 'Role (tafkidim) entity IDs' },
    workwayIds:         { type: 'array',   required: false, description: 'WorkWay entity IDs' },
    vallueIds:          { type: 'array',   required: false, description: 'Vallue entity IDs from project' },
    nhours:             { type: 'number',  required: false, description: 'Number of hours' },
    valph:              { type: 'number',  required: false, description: 'Value per hour' },
    iskvua:             { type: 'boolean', required: false, description: 'Is recurring mission' },
    dateStart:          { type: 'string',  required: false, description: 'Start date ISO string' },
    dateEnd:            { type: 'string',  required: false, description: 'End date ISO string' },
    isOnline:           { type: 'boolean', required: false, description: 'Whether the mission can happen online' },
    lat:                { type: 'number',  required: false, description: 'Mission latitude' },
    lng:                { type: 'number',  required: false, description: 'Mission longitude' },
    radius:             { type: 'number',  required: false, description: 'Mission service radius in km' },
    location_hint:      { type: 'string',  required: false, description: 'Human-readable location hint' },
    publicklinks:       { type: 'string',  required: false, description: 'Public links' },
    privatlinks:        { type: 'string',  required: false, description: 'Private links' },
    spnot:              { type: 'string',  required: false, description: 'Special notes (hearotMeyuchadot)' },
    assignedUserId:     { type: 'string',  required: false, description: 'Assigned user ID (branch 2: specific member, branch 4: self = context.userId)' },
    checklist:          { type: 'array',   required: false, description: 'Checklist tasks [{shem, des?, link?, dateS?, dateF?}]' },
    processId:          { type: 'string',  required: false, description: 'Process ID to attach created entity to' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to create a mission',
    },
  ],

  // Notifications are sent from the handler itself (case-specific per branch:
  // pendm open vote / personal invitation to an assigned member / regular
  // member notice) — no static notification config here to avoid doubles.

  updateStrategy: { type: 'none' },
};
