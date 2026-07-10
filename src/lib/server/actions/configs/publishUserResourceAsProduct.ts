/**
 * Publish User Resource As Product — PLAN_USER_OFFERINGS §3.2.
 *
 * Switches an Sp's offerScope between "give to rikmas only" ('rikma', the
 * historic behaviour) and "also sell directly to customers"
 * ('customers'/'both'). Going public mints (or re-activates and re-syncs) a
 * fixed-price personal Matanot hosted on the caller's home rikma
 * (ensurePersonalRikmaFor), so the entire existing sale pipeline —
 * /gift/[id] → sheirutpend → sheirut → sale/tosplit — works untouched.
 * Reverting to 'rikma' archives the linked Matanot (never deletes: sales may
 * reference it).
 *
 * Moderation: the same deterministic screen as the vocab pipeline
 * (screenLabel) runs inline on the public name so it cannot be bypassed.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { screenLabel } from '../../vocab/moderation.js';
import { ensurePersonalRikmaFor } from './ensurePersonalRikma.js';

const SCOPES = ['rikma', 'customers', 'both'] as const;
type OfferScope = (typeof SCOPES)[number];

/** Sp pricing kinds → Matanot sale kinds (recurrence semantics). */
const KINDOF_MAP: Record<string, string> = {
  monthly: 'monthly',
  rent: 'monthly',
  yearly: 'yearly',
  perUnit: 'total',
  total: 'total'
};

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const spId = String(params.spId ?? '');
  const offerScope = String(params.offerScope ?? '') as OfferScope;
  const priceOverride =
    params.price === undefined || params.price === null ? null : Number(params.price);

  if (!spId) throw new Error('spId is required');
  if (!SCOPES.includes(offerScope)) {
    throw new Error(`offerScope must be one of ${SCOPES.join(', ')}`);
  }

  const ctx = {
    userId: context.userId as string,
    jwt: context.jwt as string,
    fetch: context.fetch as typeof fetch
  };

  // ── Load + ownership guard ────────────────────────────────────────────────
  const spRes = await strapi.execute('252getSpForPublish', { spId }, ctx.jwt, ctx.fetch);
  const spNode = spRes?.data?.sp?.data;
  if (!spNode) throw new Error(`Sp ${spId} not found`);
  const sp = spNode.attributes ?? {};

  const ownerId = sp.users_permissions_user?.data?.id;
  if (!ownerId || String(ownerId) !== String(ctx.userId)) {
    throw new Error('Only the resource owner may change how it is offered');
  }
  if (sp.archived) throw new Error('Cannot publish an archived resource');

  const linkedMatanot = sp.matanot?.data ?? null;
  const goingPublic = offerScope === 'customers' || offerScope === 'both';

  let matanotId: string | null = linkedMatanot?.id ? String(linkedMatanot.id) : null;

  if (goingPublic) {
    const price = priceOverride ?? (sp.price != null ? Number(sp.price) : null);
    if (!price || price <= 0) {
      throw new Error('נדרש מחיר כדי לפרסם משאב כמוצר ללקוחות');
    }

    // Inline moderation — same non-bypassable screen as /api/vocab/create.
    const verdict = screenLabel(String(sp.name ?? ''), { checkLength: false });
    if (verdict.flagged) {
      throw new Error(`השם לא עבר בדיקת תוכן (${verdict.reasons.join(', ')})`);
    }

    const home = await ensurePersonalRikmaFor(ctx, strapi);

    const kindOf = KINDOF_MAP[String(sp.kindOf ?? '')] ?? 'total';
    const quant = sp.unit != null ? Number(sp.unit) : null;
    const picId = sp.pics?.data?.[0]?.id ? String(sp.pics.data[0].id) : null;
    const location = sp.location
      ? {
          lat: sp.location.lat ?? null,
          lng: sp.location.lng ?? null,
          radius: sp.location.radius ?? null,
          location_hint: sp.location.location_hint ?? null,
          location_mode: sp.location.location_mode ?? null
        }
      : null;

    if (matanotId) {
      // Re-activate + re-sync the existing product (the Sp stays the source
      // of truth; PLAN_USER_OFFERINGS §8.4).
      await strapi.execute(
        '256syncPersonalMatanotFromSp',
        {
          id: matanotId,
          name: sp.name ?? '',
          desc: sp.descrip ?? '',
          price,
          quant,
          kindOf,
          location
        },
        ctx.jwt,
        ctx.fetch
      );
    } else {
      const mRes = await strapi.execute(
        '253createPersonalMatanotFromSp',
        {
          projectcreates: home.projectId,
          ownerUser: String(ctx.userId),
          name: sp.name ?? '',
          desc: sp.descrip ?? '',
          price,
          quant,
          kindOf,
          pic: picId,
          location,
          publishedAt: new Date().toISOString()
        },
        ctx.jwt,
        ctx.fetch
      );
      matanotId = mRes?.data?.createMatanot?.data?.id
        ? String(mRes.data.createMatanot.data.id)
        : null;
      if (!matanotId) throw new Error('יצירת המוצר מהמשאב נכשלה');
    }

    await strapi.execute(
      '254updateSpOfferState',
      { spId, offerScope, matanot: matanotId },
      ctx.jwt,
      ctx.fetch
    );
  } else {
    // Back to rikma-only: archive the public product (keep the link so a
    // future re-publish revives the same Matanot and its sale history).
    if (matanotId) {
      await strapi.execute(
        '255setMatanotArchived',
        { id: matanotId, archived: true },
        ctx.jwt,
        ctx.fetch
      );
    }
    await strapi.execute(
      '254updateSpOfferState',
      { spId, offerScope, matanot: matanotId },
      ctx.jwt,
      ctx.fetch
    );
  }

  return {
    data: { spId, offerScope, matanotId },
    notifyUserIds: [String(ctx.userId)],
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
  };
};

export const publishUserResourceAsProductConfig: ActionConfig = {
  key: 'publishUserResourceAsProduct',
  description:
    'Set how a personal resource (Sp) is offered: rikma-only, or also as a direct fixed-price product for customers (mints/archives a personal Matanot hosted on the caller home rikma).',
  graphqlOperation: handler,
  paramSchema: {
    spId: { type: 'string', required: true, description: 'The Sp to publish/unpublish' },
    offerScope: {
      type: 'string',
      required: true,
      description: "One of 'rikma' | 'customers' | 'both'"
    },
    price: {
      type: 'number',
      required: false,
      description: 'Price for the public product (defaults to sp.price; required to go public)'
    }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'notifyUserIds', excludeSender: false }
    },
    templates: {
      title: {
        he: 'עדכון פרסום משאב',
        en: 'Resource offering updated',
        ar: 'تم تحديث عرض المورد'
      },
      body: {
        he: 'אופן הפרסום של המשאב שלך עודכן',
        en: 'How your resource is offered was updated',
        ar: 'تم تحديث طريقة عرض موردك'
      }
    },
    channels: ['socket'],
    metadata: { type: 'profile', url: 'me' }
  },
  updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
};
