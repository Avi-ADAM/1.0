import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Archive (soft-delete) one of the current user's personal resources (Sp).
 *
 * Replaces the old client-side GraphQL mutation that exposed the JWT. Strapi's
 * own ownership permissions on the Sp collection enforce that the caller may
 * only archive their own resource; we additionally require a valid JWT.
 *
 * Client sends: { spId: string | number }
 */
const handler: ActionExecutionHandler = async (params, context) => {
  const spId = params.spId;
  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation {
        updateSp(id: ${spId}, data: { archived: true }) {
          data { id }
        }
      }`
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  return {
    data: json.data.updateSp.data,
    notifyUserIds: [userId],
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
  };
};

export const archiveUserResourceConfig: ActionConfig = {
  key: 'archiveUserResource',
  description: 'Archive (soft-delete) one of the current user personal resources (Sp)',
  graphqlOperation: handler,
  paramSchema: {
    spId: { type: 'string', required: true, description: 'Id of the Sp resource to archive' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to remove a resource' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: false } },
    templates: {
      title: { he: 'משאב הוסר', en: 'Resource removed', ar: 'تمت إزالة المورد' },
      body: { he: 'משאב הוסר מהפרופיל שלך', en: 'A resource was removed from your profile', ar: 'تمت إزالة مورد من ملفك الشخصي' }
    },
    channels: ['socket'],
    metadata: { type: 'profile', url: 'me' }
  },
  updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
};
