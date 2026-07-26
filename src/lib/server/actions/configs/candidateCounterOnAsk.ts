/**
 * Action: Candidate counters back on their existing mission Ask (Path B2 → the
 * candidate's other option), the mission-side mirror of candidateCounterOnAskm.
 * Adds a new Negopendmission round (proposedBy=candidate) at ordern+1 with the
 * candidate's revised terms + their vote at that order, and cancels the
 * auto-approval clock — the turn returns to the members. OpenMission untouched.
 *
 * Distinct from proposeOnOpenMission (new Ask for a first proposal): this adds a
 * round to the SAME ongoing Ask.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput, extractRelationId } from './actionUtils.js';
import { buildRoundActs } from '../helpers/roundActs.js';
import { cancelCandidacyTimegrama } from '../../nego/timegrama.js';

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

  // Only the Ask's own candidate speaks for the candidate side. A member's
  // counter is a `project` round (counterOnAsk) — routing it here would let the
  // rikma's own terms pass as the taker's implicit consent in the nego gate.
  const askRes: any = await strapi
    .execute('getAskNegoRounds', { id: String(askId) }, context.jwt, context.fetch)
    .catch(() => null);
  const takerId = askRes?.data?.ask?.data?.attributes?.users_permissions_user?.data?.id;
  if (takerId != null && String(takerId) !== userId) {
    throw new Error('Only the candidate of this Ask may counter as the candidate');
  }

  // The negotiated checklist rides on the round, not on the shared OpenMission
  // (parallel candidates each keep their own). Rounds carry the full proposed
  // list, so acceptance can take it as-is.
  const roundActs = await buildRoundActs(strapi, context, {
    projectId,
    newActs: params.newActs ?? [],
    existingActsIds: params.existingActsIds ?? [],
  });

  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegopendmissionRound',
    {
      publishedAt: nowISO,
      userId,
      open_mission: openMissionId != null ? String(openMissionId) : null,
      ask: String(askId),
      ordern: nextOrder,
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
      acts: roundActs,
      location: loc ? [loc] : [],
    },
    context.jwt,
    context.fetch
  );

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

  // Candidate took the turn back → stop the clock; a member vote restarts it.
  await cancelCandidacyTimegrama(strapi, context, 'ask', String(askId));

  return { data: { askId, ordern: nextOrder }, updateStrategy: { type: 'none' } };
};

export const candidateCounterOnAskConfig: ActionConfig = {
  key: 'candidateCounterOnAsk',
  description:
    "Candidate counters back on an existing mission Ask: adds a candidate Negopendmission round at ordern+1 with their vote and cancels the auto-approval clock (turn returns to the members).",
  graphqlOperation: handler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'Ask being negotiated' },
    openMissionId: { type: 'string', required: false, description: 'Open mission the Ask targets' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID — notifications' },
    ordern: { type: 'number', required: false, description: 'Current max round (new round = ordern+1)' },
    newValues: {
      type: 'object',
      required: false,
      description: 'Revised terms: name, descrip, hearotMeyuchadot, noofhours, perhour, skillIds, roleIds, workwayIds, sqadualed, dates, location',
    },
    newActs: { type: 'array', required: false, description: 'Checklist items added in this round: [{shem, des?, link?, dateS?, dateF?}]' },
    existingActsIds: { type: 'array', required: false, description: 'Ids of the checklist items this round keeps' },
    actsChanged: { type: 'boolean', required: false, description: 'True when the negotiator edited the checklist' },
    users: { type: 'array', required: false, description: 'Existing Ask vots array' },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'הצעה נגדית מהמועמד', en: 'Counter from the candidate' },
      body: { he: 'המועמד הגיש הצעה נגדית למשימה', en: 'The candidate submitted a counter for the mission' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
