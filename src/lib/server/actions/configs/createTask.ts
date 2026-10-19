/**
 * Create Task Action Configuration
 * 
 * This action creates a new task (Act) in a project.
 * It supports assignment to specific users or roles.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { stepIsLive } from '$lib/fulfillment/plan';
import { stepOf } from '$lib/fulfillment/rows';

/**
 * An automatic act (PLAN_SHOP_OPERATIONS A1) may land on a person only under a
 * live step of this rikma that this person agreed to — checked here, not by
 * the caller, because `createTask` is also open to API keys. Returns whether
 * the assignee's acceptance is already given (their yes to the rule is it).
 */
async function checkAutomationStep(
  strapi: any,
  context: any,
  projectId: string,
  stepId: string,
  assignedUserId: string | null
): Promise<boolean> {
  const res = await strapi.execute('fulfillmentStep', { pid: String(projectId), id: String(stepId) }, context.jwt, context.fetch);
  const step = stepOf(res?.data?.fulfillmentSteps?.data?.[0]);
  if (!step) throw new ActionError('NOT_FOUND', `No fulfilment step ${stepId} in this rikma`);
  if (!stepIsLive(step)) throw new ActionError('STEP_NOT_LIVE', 'This fulfilment step is not agreed or is paused');
  if (assignedUserId && !step.consentedBy.includes(String(assignedUserId))) {
    throw new ActionError('NOT_CONSENTED', 'The assignee has not agreed to this fulfilment step');
  }
  return !!assignedUserId;
}

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
    myIshur = false,
    // External Tasks API (PLAN_EXTERNAL_TASKS_API): the id this task carries in
    // the system that opened it, and where it came from. Both absent on the
    // in-app path, which keeps Strapi's `source` default of 'ui'.
    externalId,
    source,
    // Order automation (PLAN_SHOP_OPERATIONS A1): the order, line and step an
    // automatic act belongs to. Only with `fulfillmentStepId`, and only under
    // a live step the assignee agreed to (`checkAutomationStep`).
    orderId,
    orderLineId,
    fulfillmentStepId
  } = params;

  const automatic = source === 'automation' || !!fulfillmentStepId;
  if (automatic && !fulfillmentStepId) {
    throw new ActionError('VALIDATION_FAILED', "source 'automation' needs fulfillmentStepId");
  }
  const agreedByRule = automatic
    ? await checkAutomationStep(strapi, context, String(projectId), String(fulfillmentStepId), isAssigned ? (assignedUserId ?? null) : null)
    : false;

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

  if (externalId) data.externalId = String(externalId);
  if (source) data.source = String(source);
  if (automatic) {
    data.source = 'automation';
    data.fulfillment_step = String(fulfillmentStepId);
    if (orderId) data.order = String(orderId);
    if (orderLineId) data.order_line = String(orderLineId);
  }

  // Add assignment details
  if (isAssigned) {
    if (assignedUserId) {
      data.my = assignedUserId;
      
      // Auto-approve if the creator is the assignee
      if (assignedUserId === context.userId || agreedByRule) {
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
    },
    externalId: {
      type: 'string',
      required: false,
      description: "Id of this task in the system that opened it (External Tasks API — idempotency + webhook key)"
    },
    source: {
      type: 'string',
      required: false,
      description: "Where the task came from: 'ui' (default in Strapi), 'api', or 'automation' (needs fulfillmentStepId)"
    },
    orderId: {
      type: 'string',
      required: false,
      description: 'Order this automatic act belongs to (order automation; with fulfillmentStepId)'
    },
    orderLineId: {
      type: 'string',
      required: false,
      description: 'Order line, for a per-line step'
    },
    fulfillmentStepId: {
      type: 'string',
      required: false,
      description: 'The live fulfilment step that opens this act; the assignee must have agreed to it'
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
    // The assignee's acceptance is awaited (myIshur), so reach them everywhere.
    intent: 'consent',
    metadata: {
      priority: 'normal',
      url: '/lev?project={{projectId}}'
    }
  },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', p.projectId), scope('act', r?.id), scope('mission', p.missionId)]),
  },
};
