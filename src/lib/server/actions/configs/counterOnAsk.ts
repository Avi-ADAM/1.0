/**
 * Action Configuration: Rights-holder counter (intermediate proposal) on an Ask.
 *
 * The mission-side mirror of counterOnAskm. A rights-holder offers intermediate
 * terms instead of a plain approve/decline. Stored as a new Negopendmission round
 * (proposedBy=project) bound to the candidate's Ask. The shared OpenMission is untouched.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput, extractRelationId } from './actionUtils.js';

interface UserVote {
  what: boolean;
  users_permissions_user: any;
  order?: number;
  zman?: string;
  ide?: number;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askId, openMissionId, projectId } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;
  const now = new Date();
  const nowISO = now.toISOString();
  const userId = String(context.userId);
  const nextOrder = (Number(params.ordern) || 0) + 1;

  // 1. The project's counter terms as a new Negopendmission round on the candidate's Ask.
  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegopendmissionRound',
    {
      publishedAt: nowISO,
      userId,
      open_mission: openMissionId != null ? String(openMissionId) : null,
      ask: String(askId),
      ordern: nextOrder,
      proposedBy: 'project',
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

  // 2. Record the proposer's vote at the new round (replaces the whole vots array).
  const existing = ((params.users ?? []) as UserVote[]).map((u) => {
    const upu = extractRelationId(u.users_permissions_user);
    return {
      what: u.what,
      users_permissions_user: upu,
      order: u.order ?? 0,
      zman: u.zman ?? null,
      ide: u.ide != null ? parseInt(String(u.ide), 10) : upu != null ? parseInt(upu, 10) : null,
    };
  });
  const newVote = {
    what: true,
    users_permissions_user: userId,
    order: nextOrder,
    zman: nowISO,
    ide: parseInt(userId, 10),
  };
  await strapi.execute(
    'negoUpdateAskVots',
    { id: String(askId), vots: [...existing, newVote] },
    context.jwt,
    context.fetch
  );

  return {
    data: { askId, ordern: nextOrder },
    updateStrategy: { type: 'none' },
  };
};

export const counterOnAskConfig: ActionConfig = {
  key: 'counterOnAsk',
  description:
    "Rights-holder counter-proposal on a candidate's Ask. Adds a Negopendmission round (proposedBy=project) plus the proposer's vote at the new round, without touching the shared OpenMission.",
  graphqlOperation: handler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'Ask being negotiated' },
    openMissionId: { type: 'string', required: false, description: 'Open mission the Ask targets' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID — auth' },
    ordern: { type: 'number', required: false, description: 'Current max round (new round = ordern+1)' },
    newValues: {
      type: 'object',
      required: false,
      description: 'Counter terms: name, descrip, hearotMeyuchadot, noofhours, perhour, skillIds, roleIds, workwayIds, sqadualed, dates, location',
    },
    users: { type: 'array', required: false, description: 'Existing Ask vots array' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to counter a proposal',
    },
  ],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'הצעת ביניים למשימה', en: 'Intermediate proposal for a mission' },
      body: { he: 'הוגשה הצעת ביניים על משימה בריקמה', en: 'An intermediate proposal was submitted for a mission' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
