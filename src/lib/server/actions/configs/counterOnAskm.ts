/**
 * Action Configuration: Rights-holder counter (intermediate proposal) on an Askm.
 *
 * The mirror of proposeOnOpenMashaabim, from the project side. A rights-holder,
 * instead of plain approve/decline, offers intermediate terms. This is stored as
 * a new NegoMash round (proposedBy=project) bound to the candidate's Askm, plus
 * the proposer's vote at the new round. The shared OpenMashaabim is untouched.
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
  const { askmId, openMashaabimId, projectId } = params;
  const newValues = (params.newValues ?? {}) as Record<string, any>;
  const now = new Date();
  const nowISO = now.toISOString();
  const userId = String(context.userId);
  const nextOrder = (Number(params.ordern) || 0) + 1;

  // 1. The project's counter terms as a new NegoMash round on the candidate's Askm.
  const loc = normalizeLocationInput(newValues.location);
  await strapi.execute(
    'negoCreateNegoMashRound',
    {
      publishedAt: nowISO,
      userId,
      open_mashaabim: openMashaabimId != null ? String(openMashaabimId) : null,
      askm: String(askmId),
      ordern: nextOrder,
      proposedBy: 'project',
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
      location: loc ? [loc] : null,
    },
    context.jwt,
    context.fetch
  );

  // 2. Record the proposer's vote at the new round (133 replaces the whole array).
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

  return {
    data: { askmId, ordern: nextOrder },
    updateStrategy: { type: 'none' },
  };
};

export const counterOnAskmConfig: ActionConfig = {
  key: 'counterOnAskm',
  description:
    "Rights-holder counter-proposal on a candidate's Askm. Adds a NegoMash round (proposedBy=project) plus the proposer's vote at the new round, without touching the shared OpenMashaabim.",
  graphqlOperation: handler,

  paramSchema: {
    askmId: { type: 'string', required: true, description: 'Askm being negotiated' },
    openMashaabimId: { type: 'string', required: false, description: 'Open resource the Askm targets' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID — auth' },
    ordern: { type: 'number', required: false, description: 'Current max round (new round = ordern+1)' },
    newValues: {
      type: 'object',
      required: false,
      description: 'Counter terms: name, descrip, spnot, easy, hm, price, kindOf, sqadualed, sqadualedf, linkto, location',
    },
    users: { type: 'array', required: false, description: 'Existing Askm vots array' },
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
      title: { he: 'הצעת ביניים למשאב', en: 'Intermediate proposal for a resource' },
      body: { he: 'הוגשה הצעת ביניים על משאב בריקמה', en: 'An intermediate proposal was submitted for a resource' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
