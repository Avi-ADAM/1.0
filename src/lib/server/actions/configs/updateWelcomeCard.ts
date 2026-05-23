import type { ActionConfig } from '../types.js';

export const updateWelcomeCardConfig: ActionConfig = {
  key: 'updateWelcomeCard',
  description: 'Mark a WelcomTop card as clicked (dismiss welcome card)',
  graphqlOperation: '44updateWelcomeCard',

  paramSchema: {
    id: { type: 'string', required: true },
    clicked: { type: 'boolean', required: false }
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' }
};
