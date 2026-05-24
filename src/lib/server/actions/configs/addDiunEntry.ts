/**
 * Action Configuration: Add Diun Entry
 *
 * Adds a discussion/reaction entry (diun component) to a pendm or pmash record.
 * The diun is a chat-style component used for discussion within a pending vote.
 *
 * Server fetches the current diun array from DB, appends the new entry,
 * and saves back — ensuring the order is correct and no client data is trusted.
 *
 * Client sends: { entityType, entityId, projectId, what, why }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const addDiunEntryHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { entityType, entityId, projectId, what, why } = params;

  // 'pendm' or 'pmash'
  const isPendm = entityType === 'pendm';

  const now = new Date();

  // 1. Fetch current diun array from DB
  const fetchQid = isPendm ? '147getPendmDiun' : '148getPmashDiun';
  const fetchRes = await strapi.execute(fetchQid, { id: entityId }, context.jwt, context.fetch);

  const record = isPendm
    ? fetchRes?.data?.pendm?.data?.attributes
    : fetchRes?.data?.pmash?.data?.attributes;

  if (!record) {
    throw new Error(`${entityType} ${entityId} not found`);
  }

  const existingDiun: any[] = record.diun ?? [];

  // 2. Calculate next order (max existing + 1)
  const maxOrder = existingDiun.reduce((max: number, d: any) => Math.max(max, d.order ?? 0), 0);
  const nextOrder = maxOrder + 1;

  // 3. Build updated diun array
  const normalizedDiun = existingDiun.map((d: any) => {
    const uid =
      d.users_permissions_user?.data?.id ??
      d.users_permissions_user?.id ??
      d.users_permissions_user;
    const row: Record<string, any> = {
      what: d.what ?? null,
      users_permissions_user: String(uid),
      order: d.order ?? 0,
      zman: d.zman ?? now.toISOString(),
      ide: Number(d.ide ?? uid),
    };
    if (d.why) row.why = d.why;
    return row;
  });

  const newEntry: Record<string, any> = {
    what: what ?? null,
    users_permissions_user: String(context.userId),
    order: nextOrder,
    zman: now.toISOString(),
    ide: Number(context.userId),
    why: why ?? '',
  };

  const allDiun = [...normalizedDiun, newEntry];

  // 4. Save back
  const updateQid = isPendm ? '149updatePendmDiun' : '150updatePmashDiun';
  const updateRes = await strapi.execute(
    updateQid,
    { id: entityId, diun: allDiun },
    context.jwt,
    context.fetch,
  );

  // Extract the newly created diun entry ID (last in the returned array)
  const savedDiun = isPendm
    ? updateRes?.updatePendm?.data?.attributes?.diun
    : updateRes?.updatePmash?.data?.attributes?.diun;

  const newDiunId = Array.isArray(savedDiun) ? savedDiun[savedDiun.length - 1]?.id : undefined;

  return {
    data: { entityId, entityType, newDiunId },
    updateStrategy: { type: 'none' },
  };
};

export const addDiunEntryConfig: ActionConfig = {
  key: 'addDiunEntry',
  description:
    'Add a discussion/reaction entry to a pendm or pmash. Server fetches current diun array, appends the new entry with a server-calculated order, and saves.',
  graphqlOperation: addDiunEntryHandler,

  paramSchema: {
    entityType: {
      type: 'string',
      required: true,
      validate: (v) => v === 'pendm' || v === 'pmash',
      description: '"pendm" or "pmash"',
    },
    entityId: { type: 'string', required: true, description: 'ID of the pendm or pmash record' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth check)' },
    what: { type: 'boolean', required: false, description: "Voter's current position (true/false)" },
    why: { type: 'string', required: false, description: 'Discussion text' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to add a discussion entry',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'תגובה חדשה בדיון', en: 'New discussion reply' },
      body: { he: 'חבר הוסיף תגובה לדיון', en: 'A team member replied in the discussion' },
    },
    channels: ['socket'],
    metadata: { type: 'diunEntry', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
