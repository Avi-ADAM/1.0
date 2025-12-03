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
    data: {
      type: 'object',
      required: true,
      validate: (value) => {
        if (!value || typeof value !== 'object') return false;
        
        // Required fields
        if (!value.project || !value.users_permissions_user) return false;
        
        // Validate date formats if provided
        if (value.startDate && !(value.startDate instanceof Date || !isNaN(Date.parse(value.startDate)))) {
          return false;
        }
        if (value.finnishDate && !(value.finnishDate instanceof Date || !isNaN(Date.parse(value.finnishDate)))) {
          return false;
        }
        
        return true;
      }
    }
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
      url: 'lev',
      priority: 'high' // High priority because it requires action
    }
  },
};
