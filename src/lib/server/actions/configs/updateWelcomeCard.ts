import type { ActionConfig } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

export const updateWelcomeCardConfig: ActionConfig = {
  key: 'updateWelcomeCard',
  description: 'Mark a WelcomTop card as clicked (dismiss welcome card)',
  graphqlOperation: '44updateWelcomeCard',

  paramSchema: {
    id: { type: 'string', required: true },
    clicked: { type: 'boolean', required: false }
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (_p, _r, ctx) =>
      scopeList([scope('user', ctx.userId)]),
    audience: 'self',
  },
};
