/**
 * Action Configuration: Add Haluka Chat Entry
 *
 * Appends a new text entry to the `chatre` component array on a Haluka record.
 * This replaces the afreact() function in didiget.svelte.
 *
 * Server fetches the current chatre array from DB, appends the new entry
 * (with the caller's userId as sender), and saves back — ensuring the order
 * is correct and no client-side data is trusted.
 *
 * Client sends: { halukaId, projectId, text }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const addHalukaChatEntryHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { halukaId, projectId, text } = params;

  const now = new Date();

  // 1. Fetch current chatre array
  const getRes = await strapi.execute(
    '156getHalukaChatre',
    { id: halukaId },
    context.jwt,
    context.fetch,
  );
  const halukaData = getRes?.data?.haluka?.data;
  if (!halukaData) throw new Error('Haluka not found');

  const existingChatre: any[] = halukaData.attributes.chatre ?? [];

  // 2. Normalize existing entries (convert nested user relation to scalar ID for write-back)
  const normalizedChatre = existingChatre.map((c: any) => ({
    freetext: c.freetext ?? '',
    send: String(c.send?.data?.id ?? ''),
    when: c.when ?? now.toISOString(),
    seen: c.seen ?? false,
  }));

  // 3. Append new entry authored by the calling user
  const newEntry = {
    freetext: String(text),
    send: String(context.userId),
    when: now.toISOString(),
    seen: false,
  };

  const allChatre = [...normalizedChatre, newEntry];

  // 4. Save back and return updated chatre with nested user data for UI render
  const updateRes = await strapi.execute(
    '157updateHalukaChatre',
    { id: halukaId, chatre: allChatre },
    context.jwt,
    context.fetch,
  );

  if (updateRes?.errors) throw new Error(`Failed to save chat entry: ${JSON.stringify(updateRes.errors)}`);

  const savedChatre = updateRes?.data?.updateHaluka?.data?.attributes?.chatre ?? [];

  return {
    data: { chatre: savedChatre, userId: String(context.userId) },
    updateStrategy: { type: 'none' },
  };
};

export const addHalukaChatEntryConfig: ActionConfig = {
  key: 'addHalukaChatEntry',
  description:
    'Append a chat/reaction text entry to a Haluka record\'s chatre component array. Server fetches current chatre, appends the new entry, and saves back.',
  graphqlOperation: addHalukaChatEntryHandler,

  paramSchema: {
    halukaId: { type: 'string', required: true, description: 'Haluka record ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth)' },
    text: { type: 'string', required: true, description: 'Text content of the chat entry' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to add a chat entry',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'הודעה חדשה', en: 'New message' },
      body: { he: 'נשלחה הודעה בנוגע להעברת כסף', en: 'A message was sent about a money transfer' },
    },
    channels: ['socket'],
    metadata: { type: 'halukaChatEntry', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
