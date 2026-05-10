/**
 * Create Task Action Configuration
 * 
 * This action creates a new task (Act) in a project.
 * It supports assignment to specific users or roles.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const createTaskHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    projectId,
    name,
    description = '',
    link = '',
    isAssigned = true,
    assignedUserId,
    missionId,
    tafkidims = [],
    hashivut = 'white',
    dateS,
    dateF,
    myIshur = false
  } = params;

  const now = new Date().toISOString();
  
  // Build the data object for Strapi
  const data: any = {
    project: projectId,
    shem: name,
    des: description,
    link: link,
    publishedAt: now,
    isAssigned: isAssigned,
    hashivut: hashivut,
    vali: context.userId // Creator is the "validator"
  };

  // Add assignment details
  if (isAssigned) {
    if (assignedUserId) {
      data.my = assignedUserId;
      
      // Auto-approve if the creator is the assignee
      if (assignedUserId === context.userId) {
        data.myIshur = true;
      } else {
        data.myIshur = myIshur;
      }
    }
    if (missionId) {
      data.mesimabetahaliches = missionId;
    }
  } else if (tafkidims && tafkidims.length > 0) {
    data.tafkidims = tafkidims;
  }

  // Add dates if provided
  if (dateS) data.dateS = dateS;
  if (dateF) data.dateF = dateF;

  // Use a custom GraphQL mutation string since it's cleaner for dynamic data
  const query = `
    mutation CreateAct($data: ActInput!) {
      createAct(data: $data) {
        data {
          id
          attributes {
            shem
            my {
              data {
                id
              }
            }
          }
        }
      }
    }
  `;

  // We use a trick to execute raw GraphQL via StrapiClient if needed, 
  // but since we want to follow the system, we'll use a custom handler.
  // Actually, StrapiClient.execute only takes a queryId.
  // I'll check if I can add a way to execute raw queries or if I should just register a QIDS.
  
  // Wait, I can just use fetch directly if I have the context.jwt
  const endpoint = import.meta.env.VITE_URL + '/graphql';
  const response = await context.fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.jwt}`
    },
    body: JSON.stringify({
      query,
      variables: { data }
    })
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.createAct.data;
};

export const createTaskAction: ActionConfig = {
  key: 'createTask',
  description: 'Create a new task (Act) in a project',
  graphqlOperation: createTaskHandler,
  
  paramSchema: {
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project'
    },
    name: {
      type: 'string',
      required: true,
      description: 'Task name'
    },
    description: {
      type: 'string',
      required: false,
      description: 'Task description'
    },
    link: {
      type: 'string',
      required: false,
      description: 'Optional link'
    },
    isAssigned: {
      type: 'boolean',
      required: false,
      description: 'Whether the task is assigned to a specific user'
    },
    assignedUserId: {
      type: 'string',
      required: false,
      description: 'ID of the assigned user'
    },
    missionId: {
      type: 'string',
      required: false,
      description: 'ID of the mission (mesimabetahaliches)'
    },
    tafkidims: {
      type: 'array',
      required: false,
      description: 'Array of role IDs (if not assigned to a specific user)'
    },
    hashivut: {
      type: 'string',
      required: false,
      description: 'Urgency level (white, green, yellow, red)'
    },
    dateS: {
      type: 'string',
      required: false,
      description: 'Start date'
    },
    dateF: {
      type: 'string',
      required: false,
      description: 'End date'
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to create tasks'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to create tasks'
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
        he: 'מטלה חדשה נוצרה',
        en: 'New Task Created'
      },
      body: {
        he: 'מטלה חדשה בשם "{{name}}" נוספה לפרויקט',
        en: 'A new task "{{name}}" was added to the project'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/lev?project={{projectId}}'
    }
  }
};
