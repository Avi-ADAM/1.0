import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

/**
 * Append a chat entry to an Ask record (PUT /api/asks/:id).
 *
 * Mirror of addAskmChatEntry but for the `asks` collection (used by
 * reqtosherut.svelte afreact()). Server fetches the current chat, appends the
 * new entry with the authenticated user, and saves back — so the JWT never
 * touches the client.
 */
const addAskChatEntryHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askId, why, what } = params;
  const strapiUrl = STRAPI_URL;

  // 1. Fetch current ask chat
  const getRes = await context.fetch(
    `${strapiUrl}/api/asks/${askId}?populate[chat]=*`,
    { headers: { Authorization: `Bearer ${context.jwt}` } }
  );
  if (!getRes.ok) throw new Error(`Ask not found: ${askId}`);
  const askData = await getRes.json();
  const existingChat: any[] = askData?.data?.attributes?.chat ?? [];

  // 2. Normalize existing entries (remove nested relation objects for write-back)
  const normalizedChat = existingChat.map((c: any) => ({
    what: c.what ?? true,
    users_permissions_user:
      typeof c.users_permissions_user === 'object'
        ? String(c.users_permissions_user?.data?.id ?? c.users_permissions_user?.id ?? '')
        : String(c.users_permissions_user ?? ''),
    why: c.why ?? '',
    order: c.order ?? 0,
    zman: c.zman ?? new Date().toISOString(),
    ide: c.ide ?? '',
  }));

  // 3. Append new entry
  const maxOrder = normalizedChat.length > 0
    ? Math.max(...normalizedChat.map((c) => c.order ?? 0))
    : 0;
  const newEntry = {
    what: what === undefined ? true : !!what,
    users_permissions_user: String(context.userId),
    why: String(why),
    order: maxOrder + 1,
    zman: new Date().toISOString(),
    ide: String(context.userId),
  };
  const updatedChat = [...normalizedChat, newEntry];

  // 4. Save back
  const putRes = await context.fetch(
    `${strapiUrl}/api/asks/${askId}?populate[chat]=*`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${context.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { chat: updatedChat } }),
    }
  );
  if (!putRes.ok) throw new Error('Failed to update ask chat');
  const result = await putRes.json();
  const savedChat: any[] = result?.data?.attributes?.chat ?? [];

  // Who else sees this chat: the rikma and the candidate. Best-effort — the
  // entry is saved either way.
  const who = await strapi.execute('65GetAskById', { id: String(askId) }, context.jwt, context.fetch).catch(() => null);
  const askAttrs = who?.data?.ask?.data?.attributes;

  return {
    data: {
      projectId: askAttrs?.project?.data?.id ?? null,
      askerId: askAttrs?.users_permissions_user?.data?.id ?? null,
      chat: savedChat,
      lastId: savedChat.length > 0 ? savedChat[savedChat.length - 1].id : null,
    },
    updateStrategy: { type: 'none' },
  };
};

export const addAskChatEntryConfig: ActionConfig = {
  key: 'addAskChatEntry',
  description:
    'Append a chat entry to an Ask record. Server fetches current chat, appends the new entry, and saves back.',
  graphqlOperation: addAskChatEntryHandler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'Ask record ID' },
    why: { type: 'string', required: true, description: 'Message content' },
    what: { type: 'boolean', required: false, description: 'Vote/stance flag (default true)' },
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', r?.data?.projectId), decisionScope('ask', p.askId)]),
    partiesFrom: (_p, r) => [r?.data?.askerId],
  },
};
