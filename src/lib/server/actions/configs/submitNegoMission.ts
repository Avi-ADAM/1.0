import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { calcDeadlineMs, normalizeLocationInput, extractRelationId } from './actionUtils.js';

interface NewAct {
  shem: string;
  des?: string | null;
  link?: string | null;
  dateS?: string | null;
  dateF?: string | null;
}

interface UserVote {
  what: boolean;
  users_permissions_user: string;
  order?: number;
  zman?: string;
  ide?: number;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { userId } = context;
  const now = new Date();
  const nowISO = now.toISOString();

  const x = calcDeadlineMs(params.restime ?? 'feh');
  const deadline = new Date(Date.now() + x).toISOString();

  // 1. Create new acts server-side
  const newActIds: string[] = [];
  for (const act of ((params.newActs ?? []) as NewAct[])) {
    let dateS: string | null = null;
    let dateF: string | null = null;
    if (act.dateS) {
      try { dateS = new Date(act.dateS).toISOString(); } catch { dateS = null; }
    }
    if (act.dateF) {
      try { dateF = new Date(act.dateF).toISOString(); } catch { dateF = null; }
    }

    const res = await strapi.execute('4crtask', {
      pid: params.projectId,
      mbId: null,
      assignedId: null,
      pendm: params.isAsk === 0 ? params.pendId : null,
      open_mission: params.isAsk !== 0 ? params.pendId : null,
      dateS,
      dateF,
      myIshur: null,
      shem: act.shem,
      des: act.des ?? null,
      link: act.link ?? null,
      askId: userId,
      publishedAt: nowISO,
    }, context.jwt, context.fetch).catch(() => null);

    const newId = res?.data?.createAct?.data?.id;
    if (newId) newActIds.push(newId);
  }

  const finalActIds: string[] = [...(params.existingActsIds ?? []), ...newActIds];
  const snapshotActIds: string[] = params.snapshotActIds ?? [];

  // 2. Extend timegrama deadline
  await strapi.execute('35updateTimeGrama', {
    id: params.timegramaId,
    date: deadline,
    done: false,
  }, context.jwt, context.fetch);

  // 3. Create negopendmission snapshot (stores original values before this negotiation)
  const orig = params.originalValues ?? {};
  await strapi.execute('negoCreateNegopendmission', {
    publishedAt: nowISO,
    userId,
    pendm: params.isAsk === 0 ? params.pendId : null,
    open_mission: params.isAsk !== 0 ? params.pendId : null,
    isOriginal: params.isOriginal ?? false,
    isMonth: orig.isMonth ?? null,
    noofhours: orig.noofhours ?? null,
    perhour: orig.perhour ?? null,
    hearotMeyuchadot: orig.hearotMeyuchadot ?? null,
    descrip: orig.descrip ?? null,
    name: orig.name ?? null,
    skills: orig.skillIds ?? null,
    tafkidims: orig.roleIds ?? null,
    work_ways: orig.workwayIds ?? null,
    sqadualed: orig.date ?? null,
    dates: orig.dates ?? null,
    acts: snapshotActIds.length > 0 ? snapshotActIds : null,
    location: (() => {
      const loc = normalizeLocationInput(orig.location);
      return loc ? [loc] : null;
    })(),
  }, context.jwt, context.fetch);

  // 4. Build updated users array (existing + new vote from current user)
  const existingUsers = ((params.users ?? []) as UserVote[]).map((u) => {
    const upu = extractRelationId(u.users_permissions_user);
    return {
      what: u.what,
      users_permissions_user: upu,
      order: u.order ?? 0,
      zman: u.zman ?? null,
      ide: u.ide != null ? parseInt(String(u.ide), 10) : (upu != null ? parseInt(upu, 10) : null),
    };
  });

  const newVote = {
    what: true,
    users_permissions_user: userId,
    order: (params.ordern ?? 0) + 1,
    zman: nowISO,
    ide: parseInt(String(userId), 10),
  };

  const allUsers = [...existingUsers, newVote];

  // 5. Build data object for the main entity update (only changed fields)
  const nv = params.newValues ?? {};
  const entityData: Record<string, any> = {};

  if (nv.name        != null) entityData.name              = nv.name;
  if (nv.descrip     != null) entityData.descrip            = nv.descrip;
  if (nv.hearotMeyuchadot != null) entityData.hearotMeyuchadot = nv.hearotMeyuchadot;
  if (nv.noofhours   != null) entityData.noofhours          = nv.noofhours;
  if (nv.perhour     != null) entityData.perhour             = nv.perhour;
  if (nv.skillIds    != null) entityData.skills              = nv.skillIds;
  if (nv.roleIds     != null) entityData.tafkidims           = nv.roleIds;
  if (nv.workwayIds  != null) entityData.work_ways           = nv.workwayIds;
  if (nv.sqadualed   != null) entityData.sqadualed           = nv.sqadualed;
  if (nv.dates       != null) entityData.dates               = nv.dates;
  if (nv.iskvua      != null) entityData.iskvua              = nv.iskvua;
  if (nv.location    != null) {
    const loc = normalizeLocationInput(nv.location);
    if (loc) entityData.location = loc;
  }
  if (finalActIds.length > 0 || params.actsChanged) entityData.acts = finalActIds;

  if (params.isAsk === 0) {
    // Pendm path: update users + nego component
    entityData.users = allUsers;
    entityData.nego = [{ ide: parseInt(String(userId), 10) }];

    await strapi.execute('negoUpdatePendm', {
      id: params.pendId,
      data: entityData,
    }, context.jwt, context.fetch);
  } else {
    // OpenMission path: update fields only
    await strapi.execute('negoUpdateOpenMission', {
      id: params.pendId,
      data: entityData,
    }, context.jwt, context.fetch);

    // Update the Ask with the new vote
    await strapi.execute('negoUpdateAskVots', {
      id: String(params.isAsk),
      vots: allUsers,
    }, context.jwt, context.fetch);
  }

  return {
    data: { success: true },
    updateStrategy: { type: 'none' },
  };
};

export const submitNegoMissionConfig: ActionConfig = {
  key: 'submitNegoMission',
  description: 'Submit a negotiation proposal for a pending or open mission. Creates a snapshot (negopendmission), extends the timegrama deadline, creates any new checklist tasks, and updates the entity with the negotiated values.',
  graphqlOperation: handler,

  paramSchema: {
    pendId:          { type: 'string',  required: true,  description: 'ID of the pendm or openMission' },
    projectId:       { type: 'string',  required: true,  description: 'Project ID (for auth check)' },
    timegramaId:     { type: 'string',  required: true,  description: 'Timegrama ID to extend deadline' },
    isAsk:           { type: 'number',  required: true,  description: '0 = pendm flow; non-zero = Ask ID for vote update' },
    restime:         { type: 'string',  required: false, description: 'Project restime: feh|sth|nsh|sevend' },
    isOriginal:      { type: 'boolean', required: false, description: 'True if this is the first negotiation (stepState === 2)' },
    ordern:          { type: 'number',  required: false, description: 'Current order index (new vote gets ordern+1)' },
    newValues:       { type: 'object',  required: false, description: 'Changed field values (new values to apply)' },
    originalValues:  { type: 'object',  required: false, description: 'Original values before the change (for snapshot)' },
    newActs:         { type: 'array',   required: false, description: 'New acts to create: [{shem, des?, link?, dateS?, dateF?}]' },
    existingActsIds: { type: 'array',   required: false, description: 'IDs of kept existing acts' },
    snapshotActIds:  { type: 'array',   required: false, description: 'Original acts IDs for the snapshot' },
    actsChanged:     { type: 'boolean', required: false, description: 'True if acts list was modified' },
    users:           { type: 'array',   required: false, description: 'Existing users/votes array on the entity' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to submit a negotiation',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'הצעת משא ומתן חדשה', en: 'New negotiation proposal' },
      body:  { he: 'הוגשה הצעה למשא ומתן על משימה', en: 'A negotiation proposal was submitted for a mission' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
