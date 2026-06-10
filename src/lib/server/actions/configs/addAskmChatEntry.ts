import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const addAskmChatEntryHandler: ActionExecutionHandler = async (params, context) => {
  const { askId, why } = params;
  const strapiUrl = process.env.VITE_URL || 'https://tovmeod.1lev1.com';

  // 1. Fetch current askm chat
  const getRes = await context.fetch(
    `${strapiUrl}/api/askms/${askId}?populate[chat]=*`,
    { headers: { Authorization: `Bearer ${context.jwt}` } }
  );
  if (!getRes.ok) throw new Error(`Askm not found: ${askId}`);
  const askmData = await getRes.json();
  const existingChat: any[] = askmData?.data?.attributes?.chat ?? [];

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
    what: true,
    users_permissions_user: String(context.userId),
    why: String(why),
    order: maxOrder + 1,
    zman: new Date().toISOString(),
    ide: String(context.userId),
  };
  const updatedChat = [...normalizedChat, newEntry];

  // 4. Save back
  const putRes = await context.fetch(
    `${strapiUrl}/api/askms/${askId}?populate[chat]=*`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${context.jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { chat: updatedChat } }),
    }
  );
  if (!putRes.ok) throw new Error('Failed to update askm chat');
  const result = await putRes.json();
  const savedChat: any[] = result?.data?.attributes?.chat ?? [];

  return {
    data: {
      chat: savedChat,
      lastId: savedChat.length > 0 ? savedChat[savedChat.length - 1].id : null,
    },
    updateStrategy: { type: 'none' },
  };
};

export const addAskmChatEntryConfig: ActionConfig = {
  key: 'addAskmChatEntry',
  description:
    'Append a chat entry to an Askm record. Server fetches current chat, appends the new entry, and saves back.',
  graphqlOperation: addAskmChatEntryHandler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'Askm record ID' },
    why: { type: 'string', required: true, description: 'Message content' },
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },
};
