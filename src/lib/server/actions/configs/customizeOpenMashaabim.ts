/**
 * Action: Path D (resource) — a rikma member takes an open resource on customized
 * terms. Behaviorally identical to proposeOnOpenMashaabim: the SHARED handler
 * checks membership server-side and routes (member → project round + clock now +
 * solo materialize; non-member → candidate round + deferred clock). Kept as a
 * distinct key for clients that semantically mean "customize", but the action
 * key never changes the outcome — the server decides from actual membership.
 */

import type { ActionConfig } from '../types.js';
import { openMashaabimProposalHandler } from './proposeOnOpenMashaabim.js';

export const customizeOpenMashaabimConfig: ActionConfig = {
  key: 'customizeOpenMashaabim',
  description:
    'Take an open resource on customized terms (Path D). Shares proposeOnOpenMashaabim\'s server-side membership routing — the key is semantic only.',
  graphqlOperation: openMashaabimProposalHandler,

  paramSchema: {
    openMashaabimId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    spId: { type: 'string', required: true },
    missionName: { type: 'string', required: false },
    newValues: {
      type: 'object',
      required: false,
      description: 'Customized terms: name, descrip, spnot, easy, hm, price, kindOf, sqadualed, sqadualedf, linkto, location',
    },
  },

  authRules: [{ type: 'jwt' }],

  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: { he: 'התאמה אישית למשאב', en: 'Customized resource terms' },
      body: { he: 'חבר ריקמה לקח משאב בתנאים מותאמים', en: 'A member took a resource on customized terms' },
    },
    channels: ['socket'],
    metadata: { type: 'mashaabimRequest', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
