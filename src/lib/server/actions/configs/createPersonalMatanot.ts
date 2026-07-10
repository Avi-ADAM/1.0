/**
 * Create Personal Matanot — PLAN_USER_OFFERINGS §3.3 (M3).
 *
 * A user creates a fixed-price product without opening a rikma first: the
 * product is hosted on their home rikma (ensurePersonalRikmaFor — a regular
 * one-member project created on first use, open to partners), carries
 * origin='personal' + owner_user for display, and rides the existing
 * /gift → sheirutpend sale flow untouched. Single-member consensus matures
 * immediately, so the product is active right away.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { screenLabel } from '../../vocab/moderation.js';
import { ensurePersonalRikmaFor } from './ensurePersonalRikma.js';

const KINDS = ['total', 'monthly', 'yearly', 'daily', 'unlimited'] as const;

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const ctx = {
    userId: context.userId as string,
    jwt: context.jwt as string,
    fetch: context.fetch as typeof fetch
  };

  const name = String(params.name ?? '').trim();
  if (!name) throw new Error('name is required');
  const price = Number(params.price);
  if (!price || price <= 0) throw new Error('נדרש מחיר גדול מאפס');
  const kindOf = KINDS.includes(params.kindOf) ? params.kindOf : 'total';

  // Inline moderation — same non-bypassable screen as the vocab pipeline.
  const verdict = screenLabel(name, { checkLength: false });
  if (verdict.flagged) {
    throw new Error(`השם לא עבר בדיקת תוכן (${verdict.reasons.join(', ')})`);
  }

  const home = await ensurePersonalRikmaFor(ctx, strapi);

  const location = params.location
    ? {
        lat: params.location.lat ?? null,
        lng: params.location.lng ?? null,
        radius: params.location.radius ?? null,
        location_hint: params.location.location_hint ?? null,
        location_mode: params.location.location_mode ?? null
      }
    : null;

  const mRes = await strapi.execute(
    '253createPersonalMatanotFromSp',
    {
      projectcreates: home.projectId,
      ownerUser: String(ctx.userId),
      name,
      desc: params.descrip ?? '',
      price,
      quant: params.quant != null ? Number(params.quant) : null,
      kindOf,
      pic: params.picId ? String(params.picId) : null,
      location,
      publishedAt: new Date().toISOString()
    },
    ctx.jwt,
    ctx.fetch
  );
  const matanotId = mRes?.data?.createMatanot?.data?.id;
  if (!matanotId) throw new Error('יצירת המוצר נכשלה');

  return {
    data: { matanotId: String(matanotId), projectId: home.projectId },
    updateStrategy: { type: 'none' as const }
  };
};

export const createPersonalMatanotConfig: ActionConfig = {
  key: 'createPersonalMatanot',
  description:
    'Create a personal fixed-price product (Matanot origin=personal, owner_user) hosted on the caller home rikma; the regular /gift sale flow applies unchanged.',
  graphqlOperation: handler,
  paramSchema: {
    name: { type: 'string', required: true },
    descrip: { type: 'string', required: false, description: 'Description (stored in desc)' },
    price: { type: 'number', required: true },
    quant: { type: 'number', required: false, description: 'Available quantity' },
    kindOf: { type: 'string', required: false, description: "total|monthly|yearly|daily|unlimited (default 'total')" },
    picId: { type: 'string', required: false, description: 'Uploaded image id' },
    location: { type: 'object', required: false, description: 'ComponentNewLocation shape' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
