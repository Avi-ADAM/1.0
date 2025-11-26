/**
 * Action Configuration: Approve Haluka (Division)
 * 
 * This action is triggered when all users approve a tosplit (division request).
 * When approved:
 * - The tosplit is marked as finished
 * - All related sales are marked as splited
 * - All halukot (individual divisions) are marked as ushar (approved)
 * - User balances (hervachti) are updated
 * 
 * Sends customized notifications:
 * - Celebratory notification with confetti 🎉 for users receiving money
 * - Formal notification for users giving money
 */

import type { ActionConfig } from '../types';

export const approveHalukaConfig: ActionConfig = {
  key: 'approveHaluka',
  
  description: 'Approve a haluka (division) when all users agree, activating the tosplits',
  
  // Uses QIDS 79, 80, 81 for the mutations
  graphqlOperation: '79approveTosplit',
  
  paramSchema: {
    tosplitId: {
      type: 'string',
      required: true,
      validate: (value) => !isNaN(Number(value))
    },
    userId: {
      type: 'string',
      required: true,
      validate: (value) => !isNaN(Number(value))
    },
    halukot: {
      type: 'array',
      required: true,
      validate: (value) => Array.isArray(value) && value.length > 0
    },
    projectId: {
      type: 'string',
      required: false
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to approve haluka'
    }
  ],
  
  notification: {
    recipients: {
      type: 'custom',
      config: {
        // Get all users from halukot array
        // Each haluka has noten (giver) and mekabel (receiver)
        excludeSender: false
      }
    },
    
    // Base templates - will be customized per user in NotificationOrchestrator
    templates: {
      title: {
        he: 'חלוקה אושרה!',
        en: 'Division Approved!',
        ar: 'تمت الموافقة على التقسيم!'
      },
      body: {
        he: 'החלוקה אושרה על ידי כל המשתתפים',
        en: 'The division has been approved by all participants',
        ar: 'تمت الموافقة على التقسيم من قبل جميع المشاركين'
      }
    },
    
    channels: ['socket', 'email', 'telegram', 'push'],
    
    emailTemplate: 'HalukaApproved',
    
    metadata: {
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      url: 'lev',
      priority: 'high'
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['splits', 'tosplits', 'fils']
    }
  }
};
