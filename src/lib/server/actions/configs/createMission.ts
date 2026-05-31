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
import { calcDeadlineMs } from './actionUtils.js';

interface ChecklistItem {
  shem: string;
  des?: string;
  link?: string;
  dateS?: string;
  dateF?: string;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
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

  // Common fields for OpenMission / Pendm
  const commonFields = {
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

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'משימה חדשה לאישור', en: 'New mission for approval' },
      body:  { he: 'נוצרה משימה חדשה בפרויקט', en: 'A new mission was created in your project' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
