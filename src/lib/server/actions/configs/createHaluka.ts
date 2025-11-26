/**
 * Action Configuration: Create Haluka (Distribution Transfer)
 * 
 * This action creates a new haluka - a transfer request from one user to another
 * within a project's profit distribution (tosplit).
 * 
 * A haluka represents:
 * - A transfer from usersend to userrecive
 * - An amount in a specific currency (matbea)
 * - Part of a larger tosplit (profit distribution)
 * 
 * Notifications:
 * - NO notifications sent at this level (to avoid duplicates)
 * - Notifications are sent when the tosplit is created (see createTosplit action)
 * - This is because multiple halukot are created in a loop for one tosplit
 */

import type { ActionConfig } from '../types';

export const createHalukaConfig: ActionConfig = {
  key: 'createHaluka',
  
  description: 'Create a new haluka (distribution transfer) from one user to another',
  
  graphqlOperation: '69createHaluka',
  
  paramSchema: {
    data: {
      type: 'object',
      required: true,
      validate: (value) => {
        if (!value || typeof value !== 'object') return false;
        
        // Required fields
        if (!value.project || !value.usersend || !value.userrecive) return false;
        if (typeof value.amount !== 'number' || value.amount <= 0) return false;
        
        // Validate that sender and receiver are different
        if (value.usersend === value.userrecive) return false;
        
        return true;
      }
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to create haluka'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'data.project'
      },
      errorMessage: 'Must be a member of the project to create haluka'
    }
  ],
  
  // No notifications for individual haluka creation
  // Notifications are sent at the tosplit level (when all halukot are created)
  notification: undefined,
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['tosplits', 'halukas']
    }
  }
};
