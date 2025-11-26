/**
 * Example Action Configurations
 * 
 * This file demonstrates how to define action configurations.
 * In production, actions will be organized by domain/feature.
 */

import type { ActionConfig } from '../types.js';

/**
 * Example: Update Task Action
 * 
 * This action updates a task's properties. It requires:
 * - JWT authentication
 * - Project membership
 * - Sends notifications to project members
 * - Uses partial update strategy
 */
export const updateTaskAction: ActionConfig = {
  key: 'updateTask',
  description: 'Update a task in a project',
  graphqlOperation: '31updateTask', // QIDS query ID
  
  paramSchema: {
    taskId: {
      type: 'string',
      required: true,
      description: 'ID of the task to update'
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project containing the task'
    },
    taskName: {
      type: 'string',
      required: false,
      description: 'New task name'
    },
    status: {
      type: 'string',
      required: false,
      description: 'New task status'
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
        he: 'משימה {{taskName}} עודכנה בפרויקט',
        en: 'Task {{taskName}} was updated in the project',
        ar: 'تم تحديث المهمة {{taskName}} في المشروع'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/project/{{projectId}}/task/{{taskId}}'
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1'], // Update task list
      updateFunction: 'refreshTaskList'
    }
  }
};

/**
 * Example: Create Message Action
 * 
 * This action creates a new message in a forum. It requires:
 * - JWT authentication
 * - Sends notifications to forum members
 * - Uses optimistic update strategy
 */
export const createMessageAction: ActionConfig = {
  key: 'createMessage',
  description: 'Create a new message in a forum',
  graphqlOperation: '1chatsend', // QIDS query ID
  
  paramSchema: {
    forumId: {
      type: 'string',
      required: true,
      description: 'ID of the forum'
    },
    message: {
      type: 'string',
      required: true,
      description: 'Message content',
      validate: (value) => typeof value === 'string' && value.trim().length > 0
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to send messages'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to send messages'
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
        he: 'הודעה חדשה',
        en: 'New Message',
        ar: 'رسالة جديدة'
      },
      body: {
        he: '{{username}} שלח הודעה חדשה',
        en: '{{username}} sent a new message',
        ar: 'أرسل {{username}} رسالة جديدة'
      }
    },
    channels: ['socket', 'push', 'email'],
    metadata: {
      priority: 'normal',
      url: '/project/{{projectId}}/forum/{{forumId}}'
    }
  },
  
  updateStrategy: {
    type: 'optimistic',
    config: {
      updateFunction: 'addMessageOptimistically'
    }
  }
};

/**
 * Example: Create Haluka (Distribution) Action
 * 
 * This action creates a new distribution request. It requires:
 * - JWT authentication
 * - Sends notifications to specific users
 * - Uses full refresh strategy
 */
export const createHalukaAction: ActionConfig = {
  key: 'createHaluka',
  description: 'Create a new distribution request',
  graphqlOperation: '69createHaluka', // QIDS query ID
  
  paramSchema: {
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    },
    recipientIds: {
      type: 'array',
      required: true,
      description: 'Array of user IDs to receive the distribution'
    },
    amount: {
      type: 'number',
      required: true,
      description: 'Amount to distribute',
      validate: (value) => typeof value === 'number' && value > 0
    },
    description: {
      type: 'string',
      required: false,
      description: 'Description of the distribution'
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to create distributions'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project'
    }
  ],
  
  notification: {
    recipients: {
      type: 'specificUsers',
      config: {
        projectIdParam: 'projectId',
        userIdsParam: 'recipientIds',
        excludeSender: false
      }
    },
    templates: {
      title: {
        he: 'חלוקה חדשה',
        en: 'New Distribution',
        ar: 'توزيع جديد'
      },
      body: {
        he: 'קיבלת חלוקה חדשה בסך {{amount}}',
        en: 'You received a new distribution of {{amount}}',
        ar: 'لقد تلقيت توزيعًا جديدًا بمبلغ {{amount}}'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    metadata: {
      priority: 'high',
      url: '/project/{{projectId}}/haluka/{{halukaId}}'
    }
  },
  
  updateStrategy: {
    type: 'fullRefresh',
    config: {
      updateFunction: 'refreshProjectData'
    }
  }
};
