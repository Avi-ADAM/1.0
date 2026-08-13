/**
 * Action Configuration: Create Tosplit (Profit Distribution Proposal)
 * 
 * This action creates a new tosplit - a complete profit distribution proposal
 * that includes multiple halukot (individual transfers) and requires voting
 * from all project members.
 * 
 * A tosplit represents:
 * - A collection of halukot (transfers between users)
 * - Hervachti (profit distribution breakdown per user)
 * - Voting mechanism for approval
 * - Associated sales that are being split
 * 
 * Notifications:
 * - Sent to ALL project members (except the creator)
 * - Informs them to go to Lev page to vote on the proposal
 * - Includes link to the lev page for voting
 */

import type { ActionConfig } from '../types';

export const createTosplitConfig: ActionConfig = {
  key: 'createTosplit',
  
  description: 'Create a new tosplit (profit distribution proposal) requiring member votes',
  
  graphqlOperation: '70.5createTosplit',
  
  paramSchema: {
    data: {
      type: 'object',
      required: true,
      validate: (value) => {
        if (!value || typeof value !== 'object') return false;
        
        // Required fields
        if (!value.project) return false;
        if (!value.publishedAt) return false;
        
        // Must have a halukas array — but it MAY be empty. A proposal with no
        // transfers is the normal, balanced outcome whenever everyone already
        // holds exactly their share: always in a one-member rikma (the sole
        // member holds the money and owes it to nobody), and in any rikma where
        // the sales happen to land on the right people. Rejecting it left solo
        // rikmas unable to ever close a split, with the sale stuck in
        // "pending distribution" forever. See docs/QA_SOLO_RIKMA_2026-08.md B1.
        if (!Array.isArray(value.halukas)) {
          return false;
        }

        // Must have hervachti array — this is what makes the proposal meaningful:
        // who earned what. Without it there is nothing to approve.
        if (!Array.isArray(value.hervachti) || value.hervachti.length === 0) {
          return false;
        }
        
        // Must have vots array with at least creator's vote
        if (!Array.isArray(value.vots) || value.vots.length === 0) {
          return false;
        }
        
        return true;
      }
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to create tosplit'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'data.project'
      },
      errorMessage: 'Must be a member of the project to create tosplit'
    }
  ],
  
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'data.project',
        excludeSender: true // Don't notify the creator
      }
    },
    
    templates: {
      title: {
        he: 'הצעה לחלוקת רווחים',
        en: 'Profit Distribution Proposal',
        ar: 'اقتراح توزيع الأرباح'
      },
      body: {
        he: 'הוגשה הצעה חדשה לחלוקת רווחים. היכנס ללב כדי להצביע',
        en: 'A new profit distribution proposal has been submitted. Go to Lev to vote',
        ar: 'تم تقديم اقتراح جديد لتوزيع الأرباح. انتقل إلى ليف للتصويت'
      }
    },
    
    channels: ['socket', 'email', 'telegram', 'push'],
    
    emailTemplate: 'SimpleNuti',
    
    metadata: {
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      url: 'lev',
      priority: 'high' // High priority because requires action (voting)
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['tosplits', 'halukas', 'splits']
    }
  }
};
