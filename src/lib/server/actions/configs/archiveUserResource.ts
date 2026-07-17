import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

/**
 * Archive (soft-delete) one of the current user's personal resources (Sp).
 *
 * Replaces the old client-side GraphQL mutation that exposed the JWT. Strapi's
 * own ownership permissions on the Sp collection enforce that the caller may
 * only archive their own resource; we additionally require a valid JWT.
 *
 * PLAN_USER_OFFERINGS §8.5: a resource published as a product carries a linked
 * personal Matanot — archiving the Sp archives that product too (never
 * deletes; existing sales keep referencing it).
 *
 * Client sends: { spId: string | number }
 */
const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const spId = params.spId;
  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  // Archive the linked public product first (best-effort — the Sp archive is
  // the source of truth and must not fail because of the product).
  try {
    const spRes = await strapi.execute('252getSpForPublish', { spId: String(spId) }, jwt, f);
    const spAttrs = spRes?.data?.sp?.data?.attributes;
    const linked = spAttrs?.matanot?.data;
    if (linked?.id && !linked.attributes?.archived) {
      await strapi.execute(
        '255setMatanotArchived',
        { id: String(linked.id), archived: true },
        jwt,
        f
      );
    }
  } catch (e) {
    console.warn('[archiveUserResource] linked-matanot archive failed (non-fatal):', e);
  }

  const res = await f(STRAPI_GRAPHQL, {
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
