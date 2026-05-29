/**
 * Approve Matanot Action (MVP)
 *
 * Flips status_of_voting='active' and appruved=true for a matanot.
 * Restricted to project members. Full vote-driven approval is a later
 * milestone; this is the manual "open for sale" toggle used during MVP.
 */

import type { ActionConfig } from '../types.js';

export const approveMatanotConfig: ActionConfig = {
  key: 'approveMatanot',
  description: 'Approve a matanot product — flips status_of_voting to active',
  graphqlOperation: '135approveMatanot',
  paramSchema: {
    id: { type: 'string', required: true },
    projectId: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to approve a product' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can approve products'
    }
  ],
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'מוצר אושר',
        en: 'Product approved',
        ar: 'تمت الموافقة على المنتج'
      },
      body: {
        he: 'המוצר נפתח לרכישה',
        en: 'The product is now open for purchase',
        ar: 'المنتج متاح الآن للشراء'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/gift/{{id}}'
    }
  }
};
