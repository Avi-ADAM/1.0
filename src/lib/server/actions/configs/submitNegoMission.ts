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
  const origLoc = normalizeLocationInput(orig.location);
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
    // Omit `location` entirely when absent: the field is a repeatable component
    // ([ComponentNewLocationInput]) and Strapi rejects an explicit `null`.
    ...(origLoc ? { location: [origLoc] } : {}),
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

    // Precise card update: a negotiation rewrites the mission terms and opens a
    // new voting round, so send the changed scalar fields + the negotiator's
    // vote (at the new order) for an in-place pends-store update. This avoids a
    // full refresh that would reset the user's scroll/swiper position. The
    // relation/acts/negopendmission changes reconcile on the next load — the
    // card face (name, totals, vote counts) updates immediately.
    const patch: Record<string, any> = {};
    if (nv.name             != null) patch.name             = nv.name;
    if (nv.descrip          != null) patch.descrip          = nv.descrip;
    if (nv.hearotMeyuchadot != null) patch.hearotMeyuchadot = nv.hearotMeyuchadot;
    if (nv.noofhours        != null) patch.noofhours        = nv.noofhours;
    if (nv.perhour          != null) patch.perhour          = nv.perhour;
    if (nv.sqadualed        != null) patch.sqadualed        = nv.sqadualed;
    if (nv.dates            != null) patch.dates            = nv.dates;
    if (nv.iskvua           != null) patch.iskvua           = nv.iskvua;
    if (entityData.location != null) patch.location         = entityData.location;

    // Negotiator's vote in the Strapi-nested shape processPends/mergeVote expect.
    const strapiVote: Record<string, any> = {
      what: true,
      users_permissions_user: { data: { id: String(userId) } },
      order: (params.ordern ?? 0) + 1,
      ide: parseInt(String(userId), 10),
      zman: nowISO,
    };

    return {
      data: { id: String(params.pendId), patch, newVote: strapiVote },
      updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['pends'] } },
    };
  }

  // OpenMission path: create a negotiation round instead of overwriting the
  // shared resource. Multiple candidates negotiate in parallel; the OpenMission
  // stays clean as the rikma baseline.
  const roundLoc = nv.location != null ? normalizeLocationInput(nv.location) : null;
  await strapi.execute('negoCreateNegopendmissionRound', {
    publishedAt: nowISO,
    userId,
    open_mission: String(params.pendId),
    ask: String(params.isAsk),
    ordern: (params.ordern ?? 0) + 1,
    proposedBy: 'candidate',
    status: 'proposed',
    isOriginal: false,
    noofhours: nv.noofhours ?? null,
    perhour: nv.perhour ?? null,
    hearotMeyuchadot: nv.hearotMeyuchadot ?? null,
    descrip: nv.descrip ?? null,
    name: nv.name ?? null,
    skills: nv.skillIds ?? null,
    tafkidims: nv.roleIds ?? null,
    work_ways: nv.workwayIds ?? null,
    sqadualed: nv.sqadualed ?? null,
    dates: nv.dates ?? null,
    // Omit when absent — repeatable component rejects explicit `null` (see snapshot above).
    ...(roundLoc ? { location: [roundLoc] } : {}),
  }, context.jwt, context.fetch);

  // Update the Ask with the new vote
  await strapi.execute('negoUpdateAskVots', {
    id: String(params.isAsk),
    vots: allUsers,
  }, context.jwt, context.fetch);

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
