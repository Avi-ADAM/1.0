/**
 * Action: Candidate counters back on their existing resource Askm (Path B2 → the
 * candidate's other option). Adds a new NegoMash round (proposedBy=candidate) at
 * ordern+1 with the candidate's revised terms + the candidate's vote at that
 * order, and cancels the auto-approval clock — the turn returns to the members,
 * who must vote/counter to restart it. The shared OpenMashaabim is untouched.
 *
 * Distinct from proposeOnOpenMashaabim (which creates a NEW Askm for a first
 * proposal): this adds a round to the SAME ongoing Askm.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { normalizeLocationInput, extractRelationId } from './actionUtils.js';
import { cancelCandidacyTimegrama } from '../../nego/timegrama.js';

interface UserVote {
  what: boolean;
  users_permissions_user: any;
  order?: number;
  zman?: string;
  ide?: number;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askmId, openMashaabimId } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;
  const now = new Date();
  const nowISO = now.toISOString();
  const userId = String(context.userId);
  const nextOrder = (Number(params.ordern) || 0) + 1;

  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegoMashRound',
    {
      publishedAt: nowISO,
      userId,
      open_mashaabim: openMashaabimId != null ? String(openMashaabimId) : null,
      askm: String(askmId),
      ordern: nextOrder,
      proposedBy: 'candidate',
      status: 'proposed',
      isOriginal: false,
      name: newValues.name ?? null,
      descrip: newValues.descrip ?? null,
      spnot: newValues.spnot ?? null,
      easy: newValues.easy ?? null,
      hm: newValues.hm ?? null,
      price: newValues.price ?? null,
      kindOf: newValues.kindOf ?? null,
      sqadualed: newValues.sqadualed ?? null,
      sqadualedf: newValues.sqadualedf ?? null,
      linkto: newValues.linkto ?? null,
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
    '133addVoteToAskm',
    { id: String(askmId), vots: [...existing, newVote] },
    context.jwt,
    context.fetch
  );

  // Candidate took the turn back → stop the clock; a member vote restarts it.
  await cancelCandidacyTimegrama(strapi, context, 'askm', String(askmId));

  return { data: { askmId, ordern: nextOrder }, updateStrategy: { type: 'none' } };
};

export const candidateCounterOnAskmConfig: ActionConfig = {
  key: 'candidateCounterOnAskm',
  description:
    "Candidate counters back on an existing resource Askm: adds a candidate NegoMash round at ordern+1 with their vote and cancels the auto-approval clock (turn returns to the members).",
  graphqlOperation: handler,

  paramSchema: {
    askmId: { type: 'string', required: true, description: 'Askm being negotiated' },
    openMashaabimId: { type: 'string', required: false, description: 'Open resource the Askm targets' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID — notifications' },
    ordern: { type: 'number', required: false, description: 'Current max round (new round = ordern+1)' },
    newValues: {
      type: 'object',
      required: false,
      description: 'Revised terms: name, descrip, spnot, easy, hm, price, kindOf, sqadualed, sqadualedf, linkto, location',
    },
    users: { type: 'array', required: false, description: 'Existing Askm vots array' },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'הצעה נגדית מהמועמד', en: 'Counter from the candidate' },
      body: { he: 'המועמד הגיש הצעה נגדית למשאב', en: 'The candidate submitted a counter for the resource' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
