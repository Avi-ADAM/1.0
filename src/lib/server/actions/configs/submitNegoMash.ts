import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { calcDeadlineMs, normalizeLocationInput, extractRelationId } from './actionUtils.js';

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

  // 1. Extend the timegrama deadline (if the pmash has one)
  if (params.timegramaId) {
    await strapi.execute('35updateTimeGrama', {
      id: params.timegramaId,
      date: deadline,
      done: false,
    }, context.jwt, context.fetch);
  }

  // 2. Create a NegoMash snapshot storing the original values before this negotiation.
  //    NegoMashInput has no `location` field, so the original location is not snapshotted.
  const orig = params.originalValues ?? {};
  await strapi.execute('negoCreateNegoMash', {
    publishedAt: nowISO,
    userId,
    pmash: params.pmashId,
    isOriginal: params.isOriginal ?? false,
    name: orig.name ?? null,
    descrip: orig.descrip ?? null,
    spnot: orig.spnot ?? null,
    easy: orig.easy ?? null,
    hm: orig.hm ?? null,
    price: orig.price ?? null,
    kindOf: orig.kindOf ?? null,
    sqadualed: orig.sqadualed ?? null,
    sqadualedf: orig.sqadualedf ?? null,
    linkto: orig.linkto ?? null,
    location: (() => {
      const loc = normalizeLocationInput(orig.location);
      return loc ? [loc] : null;
    })(),
  }, context.jwt, context.fetch);

  // 3. Build the updated users array (existing votes + new vote from current user)
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

  // 4. Build the pmash update data (only changed fields)
  const nv = params.newValues ?? {};
  const entityData: Record<string, any> = {};

  if (nv.name       != null) entityData.name       = nv.name;
  if (nv.descrip    != null) entityData.descrip    = nv.descrip;
  if (nv.spnot      != null) entityData.spnot      = nv.spnot;
  if (nv.easy       != null) entityData.easy       = nv.easy;
  if (nv.hm         != null) entityData.hm         = nv.hm;
  if (nv.price      != null) entityData.price      = nv.price;
  if (nv.kindOf     != null) entityData.kindOf     = nv.kindOf;
  if (nv.sqadualed  != null) entityData.sqadualed  = nv.sqadualed;
  if (nv.sqadualedf != null) entityData.sqadualedf = nv.sqadualedf;
  if (nv.linkto     != null) entityData.linkto     = nv.linkto;

  if (nv.location != null) {
    const loc = normalizeLocationInput(nv.location);
    if (loc) entityData.location = loc;
  }

  entityData.users = allUsers;

  await strapi.execute('negoUpdatePmash', {
    id: params.pmashId,
    data: entityData,
  }, context.jwt, context.fetch);

  return {
    data: { success: true },
    updateStrategy: { type: 'none' },
  };
};

export const submitNegoMashConfig: ActionConfig = {
  key: 'submitNegoMash',
  description: 'Submit a negotiation proposal for a pending resource (pmash). Creates a NegoMash snapshot of the original values, extends the timegrama deadline, and updates the pmash with the negotiated values (including location) plus the proposer\'s vote.',
  graphqlOperation: handler,

  paramSchema: {
    pmashId:        { type: 'string',  required: true,  description: 'ID of the pmash' },
    projectId:      { type: 'string',  required: true,  description: 'Project ID (for auth check)' },
    timegramaId:    { type: 'string',  required: false, description: 'Timegrama ID to extend deadline' },
    restime:        { type: 'string',  required: false, description: 'Project restime: feh|sth|nsh|sevend' },
    isOriginal:     { type: 'boolean', required: false, description: 'True if this is the first negotiation (stepState === 2)' },
    ordern:         { type: 'number',  required: false, description: 'Current order index (new vote gets ordern+1)' },
    newValues:      { type: 'object',  required: false, description: 'Changed field values to apply (name, descrip, spnot, easy, hm, price, kindOf, sqadualed, sqadualedf, linkto, location)' },
    originalValues: { type: 'object',  required: false, description: 'Original values before the change (for the snapshot)' },
    users:          { type: 'array',   required: false, description: 'Existing users/votes array on the pmash' },
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
      body:  { he: 'הוגשה הצעה למשא ומתן על משאב', en: 'A negotiation proposal was submitted for a resource' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
