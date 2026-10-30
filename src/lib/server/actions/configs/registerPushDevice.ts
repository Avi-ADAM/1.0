import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

/**
 * Register this browser's web-push subscription (a `Machshir`) for the
 * logged-in member. Every push — notifications and the device co-sign ask
 * after a timer moved through Telegram / MCP / the assistant — reads the
 * member's machshirs, so a subscription that never reaches Strapi is a device
 * that silently never rings.
 *
 * The owner is the JWT's user, never a param. Idempotent on the push endpoint:
 * the settings page re-sends the browser's existing subscription on every
 * visit, which heals a device subscribed while this write was missing.
 *
 * Client sends: { subscription: PushSubscriptionJSON }
 */

type SubscriptionJSON = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

/** The subscription as web-push needs it, or null when it is not one. */
export function normalizeSubscription(raw: unknown): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  let sub: SubscriptionJSON | null = null;
  try {
    sub = typeof raw === 'string' ? JSON.parse(raw) : (raw as SubscriptionJSON);
  } catch {
    return null;
  }
  if (!sub || typeof sub !== 'object') return null;
  const { endpoint, keys } = sub;
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return null;
  try {
    if (new URL(endpoint).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;
  if (typeof p256dh !== 'string' || typeof auth !== 'string') return null;
  if (p256dh.length > 256 || auth.length > 64) return null;
  return { endpoint, keys: { p256dh, auth } };
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const sub = normalizeSubscription(params.subscription);
  if (!sub) throw new Error('Invalid push subscription');
  const userId = String(context.userId);

  const found = await strapi.execute('46getMachshirByEndpoint', { endpoint: sub.endpoint }, undefined, context.fetch);
  const rows: any[] = found?.machshirs?.data ?? found?.data?.machshirs?.data ?? [];
  const mine = rows.find((r) => String(r?.attributes?.users_permissions_user?.data?.id) === userId);
  if (mine) return { data: { machshirId: mine.id, created: false } };

  const res = await strapi.execute(
    '467createMachshir',
    // jsoni holds the stringified subscription — /api/pusher JSON.parses it.
    { uid: userId, jsoni: JSON.stringify(sub), publishedAt: new Date().toISOString() },
    undefined,
    context.fetch
  );
  const id = res?.createMachshir?.data?.id ?? res?.data?.createMachshir?.data?.id;
  if (!id) throw new Error('Device was not saved');
  return { data: { machshirId: id, created: true } };
};

export const registerPushDeviceConfig: ActionConfig = {
  key: 'registerPushDevice',
  description: "Save this browser's web-push subscription as a device (Machshir) of the logged-in member",
  graphqlOperation: handler,
  paramSchema: {
    subscription: { type: 'object', required: true, description: 'PushSubscription.toJSON()' }
  },
  access: ['user'],
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to register a device' }],
  updateStrategy: { type: 'none' },

  realtime: {
    scopes: (_p, _r, ctx) => scopeList([scope('user', ctx.userId)]),
    audience: 'self'
  }
};
