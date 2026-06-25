/**
 * Action: Candidate accepts the rights-holders' counter on their Askm (Path B2 →
 * resolution). The candidate (the Askm taker) records a favorable vote at the
 * latest project round's order, which satisfies the bilateral gate's takerYes,
 * and (re)starts the auto-approval clock so it materializes when the window
 * elapses with no objection. The shared OpenMashaabim is untouched.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { extractRelationId } from './actionUtils.js';
import { ensureCandidacyTimegrama } from '../../nego/timegrama.js';

interface UserVote {
  what: boolean;
  users_permissions_user: any;
  order?: number;
  zman?: string;
  ide?: number;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askmId } = params;
  const now = new Date();
  const nowISO = now.toISOString();
  const userId = String(context.userId);
  const L = Number(params.ordern) || 0; // latest (project) round order being accepted

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
  const acceptVote = {
    what: true,
    users_permissions_user: userId,
    order: L,
    zman: nowISO,
    ide: parseInt(userId, 10),
  };
  await strapi.execute(
    '133addVoteToAskm',
    { id: String(askmId), vots: [...existing, acceptVote] },
    context.jwt,
    context.fetch
  );

  // Both sides now agree on the latest round → run the clock so it auto-approves.
  await ensureCandidacyTimegrama(strapi, context, { side: 'askm', id: String(askmId), reset: true });

  return { data: { askmId, ordern: L }, updateStrategy: { type: 'none' } };
};

export const acceptCounterOnAskmConfig: ActionConfig = {
  key: 'acceptCounterOnAskm',
  description:
    "Candidate accepts the rights-holders' counter on their resource Askm: records the taker's favorable vote at the latest round and (re)starts the auto-approval timegrama.",
  graphqlOperation: handler,

  paramSchema: {
    askmId: { type: 'string', required: true, description: 'Askm being negotiated' },
    projectId: { type: 'string', required: true, description: 'Project (rikma) ID — notifications' },
    ordern: { type: 'number', required: false, description: 'Latest round order being accepted' },
    users: { type: 'array', required: false, description: 'Existing Askm vots array' },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'המועמד אישר את ההצעה', en: 'Candidate accepted the proposal' },
      body: { he: 'המועמד אישר את הצעת הביניים למשאב', en: 'The candidate accepted the intermediate resource proposal' },
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
