/**
 * Link the signed-in member's Telegram account, so `personal` / `consent`
 * notices reach them there (src/lib/server/notifications/intent.ts).
 *
 * Replaces the Telegram login widget writing `6addTelegram` straight through
 * /api/send (docs/inprogress/PLAN_REALTIME_MIGRATION.md B9). The row written is
 * always the caller's own (`context.userId`), never one named by the client.
 *
 * Not done yet: verifying the widget's `hash` against the bot token. It needs
 * the token of the bot the widget is configured for (`onelev_bot`), and
 * checking against the wrong one would refuse every honest link.
 */

import type { ActionConfig } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

export const linkTelegramConfig: ActionConfig = {
  key: 'linkTelegram',
  description: "Store the signed-in member's Telegram id for notifications",
  graphqlOperation: async (params, context, { strapi }) => {
    const telegramId = String(params.telegramId ?? '').trim();
    if (!/^\d{1,20}$/.test(telegramId)) throw new Error('Invalid Telegram id');

    const res = await strapi.execute(
      '6addTelegram',
      { uid: String(context.userId), telegramId },
      context.jwt,
      context.fetch
    );
    if (res?.errors?.length) throw new Error(`Failed to link Telegram: ${JSON.stringify(res.errors)}`);
    return { success: true, data: { linked: true } };
  },
  paramSchema: {
    telegramId: { type: 'string', required: true, description: "The Telegram user id the login widget returned" }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be signed in' }],
  updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } },
  // The member's own settings, on their own devices.
  realtime: {
    scopes: (_p, _r, ctx) => scopeList([scope('user', ctx.userId)]),
    audience: 'self'
  }
};
