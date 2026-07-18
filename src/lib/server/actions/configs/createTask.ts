/**
 * Create Task Action Configuration
 * 
 * This action creates a new task (Act) in a project.
 * It supports assignment to specific users or roles.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Resolve the users who should be notified when a task is assigned to a role.
 * Returns the holders of the given roles (tafkidim) that are also members of
 * this project, so a role assignment notifies only the relevant role holders
 * rather than every project member.
 */
async function resolveRoleHoldersInProject(
  strapi: any,
  context: any,
  roleIds: string[],
  projectId: string
): Promise<string[]> {
  try {
    const [rolesRes, projRes] = await Promise.all([
      strapi.execute('getRolesHolders', { ids: roleIds }, context.jwt, context.fetch),
      strapi.execute('128getProjectMembersAndRestime', { pid: String(projectId) }, context.jwt, context.fetch)
    ]);

    const holderIds = new Set<string>();
    for (const role of rolesRes?.data?.tafkidims?.data ?? []) {
      for (const u of role?.attributes?.users_permissions_users?.data ?? []) {
        if (u?.id != null) holderIds.add(String(u.id));
      }
    }

    const memberIds = new Set<string>(
      (projRes?.data?.project?.data?.attributes?.user_1s?.data ?? [])
        .map((u: any) => String(u.id))
    );

    // Prefer role holders that are members of THIS project. If project
    // membership couldn't be resolved, fall back to the raw role holders.
    const scoped = [...holderIds].filter((id) => memberIds.has(id));
    if (scoped.length > 0) return scoped;
    if (memberIds.size === 0) return [...holderIds];
    return [];
  } catch (error) {
    console.error('[createTask] resolveRoleHoldersInProject error:', error);
    return [];
  }
}

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

  // Use the QIDS-registered mutation via StrapiClient so the admin token
  // is applied correctly (the admin token works here since StrapiClient
  // uses it as a fallback and Strapi accepts it for content mutations).
  const result = await strapi.execute(
    '140createAct',
    { data },
    context.jwt,
    context.fetch
  );

  const createdAct = result?.data?.createAct?.data;
  if (!createdAct) {
    throw new Error('Failed to create task: no data returned');
  }

  // Determine the direct recipients (notified on every channel):
  //  - assigned to a specific person other than the creator → that person.
  //  - assigned to a role → the holders of that role within this project.
  //  - otherwise → empty, so the notification rule falls back to project members.
  let notifyUserIds: string[] = [];
  if (isAssigned && assignedUserId && String(assignedUserId) !== String(context.userId)) {
    notifyUserIds = [String(assignedUserId)];
  } else if (Array.isArray(tafkidims) && tafkidims.length > 0) {
    const holders = await resolveRoleHoldersInProject(
      strapi,
      context,
      tafkidims.map((id: any) => String(id)),
      String(projectId)
    );
    notifyUserIds = holders.filter((id) => String(id) !== String(context.userId));
  }

  return {
    ...createdAct,
    notifyUserIds
  };
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

  // Exposed to external API keys via /api/v1/actions (was the hardcoded
  // ALLOWED_ACTIONS whitelist there).
  access: ['user', 'serviceAdmin', 'apiKey'],

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
    // When the task is assigned to a specific person other than the creator,
    // `notifyUserIds` (returned by the handler) targets that person directly.
    // When it's empty (self-assigned, role-assigned or unassigned) the rule
    // falls back to notifying the project members.
    recipients: {
      type: 'specificUsers',
      config: {
        userIdsParam: 'notifyUserIds',
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'מטלה חדשה: {{name}}',
        en: 'New task: {{name}}'
      },
      body: {
        he: 'נוספה מטלה חדשה עבורך: "{{name}}"',
        en: 'A new task was added for you: "{{name}}"'
      }
    },
    // All channels — each is delivered only where the recipient has it set up
    // (linked Telegram, email, push subscription), so the assignee is reached
    // everywhere available.
    channels: ['socket', 'push', 'email', 'telegram'],
    metadata: {
      priority: 'normal',
      url: '/lev?project={{projectId}}'
    }
  }
};
