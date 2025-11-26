/**
 * Update Task Action Configuration
 * 
 * This action updates a task (Act) in the system. It allows updating:
 * - Task approval status (myIshur, valiIshur)
 * - Assignment status (isAssigned)
 * - Assigned users (uid)
 * - Associated missions (mesimabetahaliches)
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

import type { ActionConfig } from '../types.js';

export const updateTaskAction: ActionConfig = {
  key: 'updateTask',
  description: 'Update a task (Act) in a project',
  graphqlOperation: '31updateTask', // QIDS query ID
  
  paramSchema: {
    id: {
      type: 'string',
      required: true,
      description: 'ID of the task (Act) to update'
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project containing the task (used for authorization and notifications)'
    },
    myIshur: {
      type: 'boolean',
      required: false,
      description: 'Task approval status by assignee'
    },
    valiIshur: {
      type: 'boolean',
      required: false,
      description: 'Task approval status by validator'
    },
    isAssigned: {
      type: 'boolean',
      required: false,
      description: 'Whether the task is assigned'
    },
    uid: {
      type: 'array',
      required: false,
      description: 'Array of user IDs assigned to the task'
    },
    mesimabetahaliches: {
      type: 'array',
      required: false,
      description: 'Array of mission IDs associated with the task'
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to update tasks'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to update tasks'
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
        he: 'משימה עודכנה',
        en: 'Task Updated',
        ar: 'تم تحديث المهمة'
      },
      body: {
        he: 'משימה עודכנה בפרויקט',
        en: 'A task was updated in the project',
        ar: 'تم تحديث مهمة في المشروع'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/lev?project={{projectId}}'
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1'], // Update task list in user's arr1
      updateFunction: 'refreshTaskList'
    }
  }
};
