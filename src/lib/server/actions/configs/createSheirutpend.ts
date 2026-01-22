/**
 * Action Configuration: Create Sheirutpend
 * 
 * This action creates a new Sheirutpend object which represents a service period
 * with associated metadata like project, user, timeframes, and approval status.
 */

import type { ActionConfig } from '../types';

export const createSheirutpendConfig: ActionConfig = {
  key: 'createSheirutpend',

  description: 'Create a new Sheirutpend record',

  graphqlOperation: '71createSheirutpend',

  paramSchema: {
    project: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    matanots: { type: 'array', required: false },
    price: { type: 'number', required: false },
    quant: { type: 'number', required: false },
    total: { type: 'number', required: false },
    startDate: {
      type: 'string',
      required: false,
      validate: (value) => !value || !isNaN(Date.parse(value))
    },
    finnishDate: {
      type: 'string',
      required: false,
      validate: (value) => !value || !isNaN(Date.parse(value))
    },
    appruved: { type: 'boolean', required: false }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to create Sheirutpend'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'data.project',
        excludeSender: true
      }
    },
    templates: {
      title: {
        en: 'New Service Request',
        he: 'בקשת שירות חדשה',
        ar: 'طلب خدمة جديد'
      },
      body: {
        en: 'New service request created for project {{project.name}}',
        he: 'נוצרה בקשת שירות חדשה לפרויקט {{project.name}}',
        ar: 'تم إنشاء طلب خدمة جديد للمشروع {{project.name}}'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti',
    metadata: {
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      type: 'sheirutUpdate',
      url: 'lev',
      priority: 'high' // High priority because it requires action
    }
  },

  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['sheirutpends'],
      updateFunction: 'refreshSheirutpends'
    }
  }
};
