/**
 * Action Configuration: Add Vote
 * 
 * Action כללי להוספת הצבעה לסוגים שונים של פריטים
 * תומך ב-pend (users component) ו-sheirutpend (vots component)
 */

import type { ActionConfig, ActionExecutionHandler } from '../types';

/**
 * Custom handler לבניית קומפוננטות ועדכון
 */
const addVoteHandler: ActionExecutionHandler = async (params, context, util) => {
  const { type, id, projectId, existingComponentData, order } = params;
  const { userId } = context;
  const { strapi } = util;

  // Validation
  if (!type || !['pend', 'sheirutpend'].includes(type)) {
    throw new Error('Invalid type. Must be "pend" or "sheirutpend"');
  }

  if (!id || !projectId) {
    throw new Error('Missing required parameters: id and projectId');
  }

  // בניית קומפוננטה חדשה של הצבעה
  const now = new Date();
  const newVote: any = {
    what: true, // approve
    users_permissions_user: userId,
    order: order || 0,
    ide: userId,
    zman: now.toISOString()
  };

  // בניית מערך קומפוננטות מעודכן
  // המרת existingComponentData למבנה המתאים אם צריך
  const existingComponents = Array.isArray(existingComponentData) 
    ? existingComponentData.map((comp: any) => {
        // אם יש data wrapper, נסיר אותו
        if (comp.data && comp.data.attributes) {
          return {
            what: comp.data.attributes.what ?? comp.what,
            users_permissions_user: comp.data.attributes.users_permissions_user?.data?.id ?? comp.users_permissions_user?.data?.id ?? comp.users_permissions_user,
            order: comp.data.attributes.order ?? comp.order ?? 0,
            ide: comp.data.attributes.ide ?? comp.ide,
            zman: comp.data.attributes.zman ?? comp.zman
          };
        }
        // אם יש users_permissions_user.data.id, נמיר ל-ID בלבד
        if (comp.users_permissions_user?.data?.id) {
          return {
            ...comp,
            users_permissions_user: comp.users_permissions_user.data.id
          };
        }
        return comp;
      })
    : [];

  const updatedComponents = [...existingComponents, newVote];

  // קביעת שם השדה והקוורי לפי הסוג
  let qid: string;

  if (type === 'pend') {
    qid = '85addVoteToPend';
  } else if (type === 'sheirutpend') {
    qid = '86addVoteToSheirutpend';
  } else {
    throw new Error(`Unsupported type: ${type}`);
  }

  // בניית variables ל-GraphQL
  const fieldName = type === 'pend' ? 'users' : 'vots';
  const variables: any = {
    id: id,
    [fieldName]: updatedComponents
  };

  // ביצוע ה-mutation דרך StrapiClient
  const result = await strapi.execute(qid, variables, context.jwt, context.fetch);

  if (!result || result.errors) {
    throw new Error(`GraphQL mutation failed: ${JSON.stringify(result?.errors || 'Unknown error')}`);
  }

  // החזרת תוצאה עם updateStrategy דינמי בהתבסס על הסוג
  const dataKey = type === 'pend' ? 'pends' : 'sheirutpends';
  
  return {
    data: result.data || result,
    updateStrategy: {
      type: 'partialUpdate',
      config: {
        dataKeys: [dataKey],
        updateFunction: 'refreshVotes'
      }
    }
  };
};

export const addVoteConfig: ActionConfig = {
  key: 'addVote',
  description: 'Add a vote to a pend or sheirutpend item',
  graphqlOperation: addVoteHandler,

  paramSchema: {
    type: {
      type: 'string',
      required: true,
      validate: (value) => ['pend', 'sheirutpend'].includes(value),
      description: 'Type of item: "pend" or "sheirutpend"'
    },
    id: {
      type: 'string',
      required: true,
      description: 'ID of the item to vote on'
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    },
    existingComponentData: {
      type: 'array',
      required: true,
      description: 'Existing component data (users for pend, vots for sheirutpend)'
    },
    order: {
      type: 'number',
      required: false,
      description: 'Order number for the vote (defaults to 0)'
    }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to vote'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'Must be a project member to vote'
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
        he: 'הצבעה חדשה',
        en: 'New vote',
        ar: 'تصويت جديد'
      },
      body: {
        he: 'משתמש הצביע על פריט בפרויקט',
        en: 'A user voted on an item in the project',
        ar: 'صوت مستخدم على عنصر في المشروع'
      }
    },
    channels: ['socket'],
    metadata: {
      type: 'voteUpdate',
      url: 'lev'
    }
  },

  // updateStrategy מוגדר דינמית ב-handler בהתבסס על type
};
