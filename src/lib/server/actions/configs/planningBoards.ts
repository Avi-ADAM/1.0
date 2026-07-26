/**
 * Planning board actions — PLAN_PROJECT_PLANNING_BOARDS
 *
 * CRUD for a rikma's planning boards: persistent, amorphous spaces where a
 * direction for advancing the project is gradually turned into concrete
 * missions, acts, resources and product ideas.
 *
 * Nothing here creates a real entity. A `project-plan-item` stays a proposal
 * until a human opens it in the normal creation form (mission.svelte /
 * crtask.svelte / ResourceCreator.svelte) and approves it there — at which
 * point `markPlanItemCreated` records what was created. This is the
 * "proposal + navigate to approve" pattern from PLAN_AI_ERA stage 2, applied
 * to a *set* of entities rather than one.
 *
 * Authorization: every action is projectMember-gated. Because a board/item id
 * does not carry a project on its own, mutating actions take an explicit
 * `projectId` and verify the target really belongs to it — otherwise a member
 * of project A could edit project B's board by guessing an id.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type PlanOrigin = 'quickScan' | 'freeText' | 'manual' | 'agent';
type PlanBoardStatus = 'suggested' | 'active' | 'expanded' | 'archived';
type PlanItemKind = 'mission' | 'act' | 'resource' | 'product' | 'note';
type PlanItemStatus = 'proposed' | 'accepted' | 'created' | 'dismissed';

const ORIGINS: PlanOrigin[] = ['quickScan', 'freeText', 'manual', 'agent'];
const BOARD_STATUSES: PlanBoardStatus[] = ['suggested', 'active', 'expanded', 'archived'];
const ITEM_KINDS: PlanItemKind[] = ['mission', 'act', 'resource', 'product', 'note'];
const ITEM_STATUSES: PlanItemStatus[] = ['proposed', 'accepted', 'created', 'dismissed'];

/**
 * Load a board and assert it belongs to `projectId`.
 * Returns the board node so callers can read its current state.
 */
async function loadBoardInProject(
  strapi: any,
  context: any,
  boardId: string,
  projectId: string
): Promise<any> {
  const res = await strapi.execute('286getPlanBoard', { id: String(boardId) }, context.jwt, context.fetch);
  const board = res?.data?.projectPlanBoard?.data;
  if (!board) throw new Error(`Planning board ${boardId} not found`);

  const boardProjectId = board.attributes?.project?.data?.id;
  if (String(boardProjectId) !== String(projectId)) {
    throw new Error('This planning board does not belong to the given project');
  }
  return board;
}

/** Find an item inside a board (the board read already includes its items). */
function findItemInBoard(board: any, itemId: string): any {
  const item = (board.attributes?.items?.data ?? []).find(
    (i: any) => String(i.id) === String(itemId)
  );
  if (!item) throw new Error(`Plan item ${itemId} is not part of this board`);
  return item;
}

// ── createPlanBoard ────────────────────────────────────────────────────────

const createPlanBoardHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    projectId,
    title,
    descrip = '',
    rationale = '',
    origin = 'manual',
    status,
    sourceText = '',
    order
  } = params as Record<string, any>;

  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) throw new Error('title is required');

  const safeOrigin: PlanOrigin = ORIGINS.includes(origin) ? origin : 'manual';
  // A board a human created deliberately is active from the start; an
  // AI-proposed direction waits for the user to accept it.
  const defaultStatus: PlanBoardStatus = safeOrigin === 'quickScan' ? 'suggested' : 'active';
  const safeStatus: PlanBoardStatus = BOARD_STATUSES.includes(status) ? status : defaultStatus;

  const res = await strapi.execute(
    '287createPlanBoard',
    {
      title: cleanTitle,
      descrip,
      rationale,
      origin: safeOrigin,
      status: safeStatus,
      sourceText,
      order: typeof order === 'number' ? order : 0,
      projectId: String(projectId),
      userId: String(context.userId),
      publishedAt: new Date().toISOString()
    },
    context.jwt,
    context.fetch
  );

  const created = res?.data?.createProjectPlanBoard?.data;
  if (!created) throw new Error('Failed to create planning board');
  return created;
};

export const createPlanBoardAction: ActionConfig = {
  key: 'createPlanBoard',
  description: 'Create a planning board (a direction for advancing the project)',
  graphqlOperation: createPlanBoardHandler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'ID of the project' },
    title: { type: 'string', required: true, description: 'Board / direction title' },
    descrip: { type: 'string', required: false, description: 'What this direction is about' },
    rationale: { type: 'string', required: false, description: 'Why it was proposed, grounded in the project state' },
    origin: { type: 'string', required: false, description: 'quickScan | freeText | manual | agent' },
    status: { type: 'string', required: false, description: 'suggested | active | expanded | archived' },
    sourceText: { type: 'string', required: false, description: 'The free text this board came from' },
    order: { type: 'number', required: false, description: 'Display order' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to create a planning board'
    }
  ]
};

// ── updatePlanBoard ────────────────────────────────────────────────────────

const updatePlanBoardHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { boardId, projectId, title, descrip, status, revisionNote, order } =
    params as Record<string, any>;

  await loadBoardInProject(strapi, context, boardId, projectId);

  const data: Record<string, any> = {};
  if (title != null) {
    const clean = String(title).trim();
    if (!clean) throw new Error('title cannot be empty');
    data.title = clean;
  }
  if (descrip != null) data.descrip = descrip;
  if (revisionNote != null) data.revisionNote = revisionNote;
  if (typeof order === 'number') data.order = order;
  if (status != null) {
    if (!BOARD_STATUSES.includes(status)) throw new Error(`Unknown board status: ${status}`);
    data.status = status;
  }

  if (Object.keys(data).length === 0) throw new Error('Nothing to update');

  const res = await strapi.execute(
    '288updatePlanBoard',
    { id: String(boardId), data },
    context.jwt,
    context.fetch
  );

  const updated = res?.data?.updateProjectPlanBoard?.data;
  if (!updated) throw new Error('Failed to update planning board');
  return updated;
};

export const updatePlanBoardAction: ActionConfig = {
  key: 'updatePlanBoard',
  description: 'Update a planning board — accept a suggested direction, rename it, archive it, or record a revision request',
  graphqlOperation: updatePlanBoardHandler,
  paramSchema: {
    boardId: { type: 'string', required: true, description: 'ID of the board' },
    projectId: { type: 'string', required: true, description: 'ID of the project the board belongs to' },
    title: { type: 'string', required: false, description: 'New title' },
    descrip: { type: 'string', required: false, description: 'New description' },
    status: { type: 'string', required: false, description: 'suggested | active | expanded | archived' },
    revisionNote: { type: 'string', required: false, description: 'Free-text revision request for the next AI pass' },
    order: { type: 'number', required: false, description: 'Display order' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to change its planning boards'
    }
  ]
};

// ── createPlanItem ─────────────────────────────────────────────────────────

const createPlanItemHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    boardId,
    projectId,
    kind = 'mission',
    name,
    descrip = '',
    imp = 'nice',
    spec = null,
    existingRef = null,
    order
  } = params as Record<string, any>;

  await loadBoardInProject(strapi, context, boardId, projectId);

  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('name is required');
  if (!ITEM_KINDS.includes(kind)) throw new Error(`Unknown plan item kind: ${kind}`);

  const res = await strapi.execute(
    '289createPlanItem',
    {
      kind,
      name: cleanName,
      descrip,
      imp: imp === 'must' ? 'must' : 'nice',
      status: 'proposed',
      spec,
      existingRef,
      order: typeof order === 'number' ? order : 0,
      boardId: String(boardId),
      publishedAt: new Date().toISOString()
    },
    context.jwt,
    context.fetch
  );

  const created = res?.data?.createProjectPlanItem?.data;
  if (!created) throw new Error('Failed to create plan item');
  return created;
};

export const createPlanItemAction: ActionConfig = {
  key: 'createPlanItem',
  description: 'Add a proposed row (mission / act / resource / product / note) to a planning board',
  graphqlOperation: createPlanItemHandler,
  paramSchema: {
    boardId: { type: 'string', required: true, description: 'ID of the board' },
    projectId: { type: 'string', required: true, description: 'ID of the project the board belongs to' },
    kind: { type: 'string', required: false, description: 'mission | act | resource | product | note' },
    name: { type: 'string', required: true, description: 'Row title' },
    descrip: { type: 'string', required: false, description: 'Row description' },
    imp: { type: 'string', required: false, description: 'must | nice' },
    spec: { type: 'object', required: false, description: 'Prefill for the real creation form (skills, roles, hours, assignee, missionId…)' },
    existingRef: { type: 'object', required: false, description: 'Match against something already live: { type, id, name, similarity }' },
    order: { type: 'number', required: false, description: 'Display order' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to change its planning boards'
    }
  ]
};

// ── updatePlanItem ─────────────────────────────────────────────────────────

const updatePlanItemHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { itemId, boardId, projectId, name, descrip, imp, status, spec, order } =
    params as Record<string, any>;

  const board = await loadBoardInProject(strapi, context, boardId, projectId);
  const item = findItemInBoard(board, itemId);

  // `created` is terminal — it records a real entity that exists in the world.
  // Re-opening it would let the board drift out of sync with reality; the user
  // should act on the created entity itself instead.
  if (item.attributes?.status === 'created') {
    throw new Error('This row has already been created and can no longer be edited');
  }

  const data: Record<string, any> = {};
  if (name != null) {
    const clean = String(name).trim();
    if (!clean) throw new Error('name cannot be empty');
    data.name = clean;
  }
  if (descrip != null) data.descrip = descrip;
  if (spec != null) data.spec = spec;
  if (typeof order === 'number') data.order = order;
  if (imp != null) data.imp = imp === 'must' ? 'must' : 'nice';
  if (status != null) {
    if (!ITEM_STATUSES.includes(status)) throw new Error(`Unknown plan item status: ${status}`);
    // Only markPlanItemCreated may set `created`, since it must record what
    // was actually created alongside the status.
    if (status === 'created') {
      throw new Error('Use markPlanItemCreated to mark a row as created');
    }
    data.status = status;
  }

  if (Object.keys(data).length === 0) throw new Error('Nothing to update');

  const res = await strapi.execute(
    '290updatePlanItem',
    { id: String(itemId), data },
    context.jwt,
    context.fetch
  );

  const updated = res?.data?.updateProjectPlanItem?.data;
  if (!updated) throw new Error('Failed to update plan item');
  return updated;
};

export const updatePlanItemAction: ActionConfig = {
  key: 'updatePlanItem',
  description: 'Edit a planning row — rename, flip must/nice, accept it, or dismiss it',
  graphqlOperation: updatePlanItemHandler,
  paramSchema: {
    itemId: { type: 'string', required: true, description: 'ID of the plan item' },
    boardId: { type: 'string', required: true, description: 'ID of the board it belongs to' },
    projectId: { type: 'string', required: true, description: 'ID of the project the board belongs to' },
    name: { type: 'string', required: false, description: 'New title' },
    descrip: { type: 'string', required: false, description: 'New description' },
    imp: { type: 'string', required: false, description: 'must | nice' },
    status: { type: 'string', required: false, description: 'proposed | accepted | dismissed' },
    spec: { type: 'object', required: false, description: 'Updated prefill spec' },
    order: { type: 'number', required: false, description: 'Display order' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to change its planning boards'
    }
  ]
};

// ── markPlanItemCreated ────────────────────────────────────────────────────

const markPlanItemCreatedHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { itemId, boardId, projectId, createdType, createdId } = params as Record<string, any>;

  const board = await loadBoardInProject(strapi, context, boardId, projectId);
  const item = findItemInBoard(board, itemId);

  if (item.attributes?.status === 'created') {
    // Idempotent: the form may retry, and double-marking must not lose the
    // original reference.
    return item;
  }

  const cleanType = String(createdType || '').trim();
  const cleanId = String(createdId || '').trim();
  if (!cleanType || !cleanId) {
    throw new Error('createdType and createdId are required to mark a row as created');
  }

  const res = await strapi.execute(
    '290updatePlanItem',
    {
      id: String(itemId),
      data: {
        status: 'created',
        createdRef: { type: cleanType, id: cleanId, at: new Date().toISOString() }
      }
    },
    context.jwt,
    context.fetch
  );

  const updated = res?.data?.updateProjectPlanItem?.data;
  if (!updated) throw new Error('Failed to mark plan item as created');
  return updated;
};

export const markPlanItemCreatedAction: ActionConfig = {
  key: 'markPlanItemCreated',
  description: 'Record that a real entity was created from a planning row (called after the user approves it in the creation form)',
  graphqlOperation: markPlanItemCreatedHandler,
  paramSchema: {
    itemId: { type: 'string', required: true, description: 'ID of the plan item' },
    boardId: { type: 'string', required: true, description: 'ID of the board it belongs to' },
    projectId: { type: 'string', required: true, description: 'ID of the project the board belongs to' },
    createdType: { type: 'string', required: true, description: 'What was created: mission | act | openMission | pendm | mesimabetahalich | openMashaabim | matanot' },
    createdId: { type: 'string', required: true, description: 'ID of the created entity' }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to plan' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a member of this project to change its planning boards'
    }
  ]
};
