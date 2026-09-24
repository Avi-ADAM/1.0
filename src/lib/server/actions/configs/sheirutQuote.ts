/**
 * Price quotes on a product request — docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md §6.
 *
 * A grocery basket has no catalogue price: the customer asks ("2 cola, yellow
 * cheese", and a sum if she has one in mind — she does not have to), the shop
 * answers with a price, and they go back and forth until both sign the same
 * version. The same works on any ordinary product request from /gift.
 *
 *   quoteSheirutpend    — either side puts a version on the table (a round).
 *   acceptSheirutQuote  — the customer signs the seller's version.
 *   getSheirutpendQuote — the state, for the side asking.
 *   noteSheirutpend     — a line in the request's chat (the shopping list).
 *
 * The rikma approves the customer's version with the existing `addVote`
 * (type sheirutpend), which now refuses an open price and a version that is
 * the customer's to answer. Silence is consent: every round restarts the
 * sheirutpend clock, and src/routes/api/timegrama/sheirutpend.svelte matures
 * the last version when it runs out.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { customerCanAccept, sideOf } from '$lib/sheirut/quoteState';
import {
  loadQuote,
  postToRequestChat,
  resetQuoteClock,
  rikmaSigned,
  writeRound,
  type LoadedQuote,
  type StrapiLike
} from '../../sheirut/quote.js';
import { createSheirutFromPendingConfig } from './createSheirutFromPending.js';

const fmtAmount = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');

async function loadForCaller(strapi: StrapiLike, sheirutpendId: string, userId: string) {
  if (!sheirutpendId) throw new Error('sheirutpendId is required');
  const q = await loadQuote(strapi, sheirutpendId);
  if (!q) throw new Error(`Request ${sheirutpendId} not found`);
  const side = sideOf(userId, q.customerId, q.memberIds);
  if (!side) throw new Error('Only the customer or a member of the selling rikma may act on this request');
  return { q, side };
}

/**
 * Turn the agreed version into a Sheirut — the same handler a full signature
 * runs from `addVote`, on the service token (the customer's own token may not
 * create services in the seller's rikma).
 */
export async function settleQuote(q: LoadedQuote, context: any, util: any) {
  const handler = createSheirutFromPendingConfig.graphqlOperation as ActionExecutionHandler;
  return handler(
    {
      sheirutpendId: q.id,
      projectId: q.projectId,
      clientId: q.customerId,
      recipientIds: [...new Set([...q.memberIds, String(q.customerId ?? '')])].filter(Boolean)
    },
    { ...context, jwt: undefined },
    util
  );
}

// ── quoteSheirutpend ─────────────────────────────────────────────────────────

const quoteHandler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { sheirutpendId, note = '' } = params as { sheirutpendId: string; note?: string };
  const price = Number(params.price);
  if (!Number.isFinite(price) || price < 0) throw new Error('A price of 0 or more is required');

  const { q, side } = await loadForCaller(strapi, String(sheirutpendId), String(context.userId));
  if (q.closed) throw new Error('This request is already closed');

  const quantRaw = params.quant === undefined || params.quant === null ? q.state.quant : Number(params.quant);
  const quant = Number.isFinite(quantRaw) && quantRaw > 0 ? quantRaw : 1;

  const order = await writeRound(strapi, q, String(context.userId), price, quant);
  await resetQuoteClock(strapi, q);

  const total = Math.round(price * quant * 100) / 100;
  const line =
    (side === 'provider' ? '💬 הצעת מחיר' : '💬 הצעה נגדית') +
    `: ${fmtAmount(total)}` +
    (quant !== 1 ? ` (${fmtAmount(price)} × ${fmtAmount(quant)})` : '') +
    (String(note).trim() ? ` — ${String(note).trim()}` : '');
  await postToRequestChat(strapi, q, String(context.userId), line);

  // The other side answers.
  const recipientIds =
    side === 'provider'
      ? [q.customerId].filter(Boolean)
      : q.memberIds.filter((m) => m !== String(context.userId));

  return {
    data: { sheirutpendId: q.id, order, price, quant, total, side },
    sheirutpendId: q.id,
    recipientIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const quoteSheirutpendConfig: ActionConfig = {
  key: 'quoteSheirutpend',
  description:
    'Customer or seller puts a price version on a product request (a sheirutnego round), mirrored onto the request, with a fresh restime clock.',
  graphqlOperation: quoteHandler,
  paramSchema: {
    sheirutpendId: { type: 'string', required: true },
    price: { type: 'number', required: true },
    quant: { type: 'number', required: false },
    note: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to quote a price' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds', excludeSender: true } },
    templates: {
      title: { he: 'הצעת מחיר חדשה', en: 'A new price proposal', ar: 'عرض سعر جديد' },
      body: {
        he: 'יש הצעת מחיר חדשה בבקשה. אפשר לאשר, לכתוב בצ׳אט או להציע אחרת. בלי תגובה בזמן — היא מאושרת.',
        en: 'There is a new price on the request. Approve it, chat, or propose another. With no answer in time, it is approved.',
        ar: 'يوجد سعر جديد في الطلب. وافق أو تحدّث أو اقترح غيره. دون رد في الوقت المحدد، تتم الموافقة عليه.'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti',
    metadata: { priority: 'high', type: 'sheirutUpdate', url: 'deals/request/{{sheirutpendId}}' }
  },
  updateStrategy: { type: 'none' }
};

// ── acceptSheirutQuote ───────────────────────────────────────────────────────

const acceptHandler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { q, side } = await loadForCaller(strapi, String(params.sheirutpendId), String(context.userId));
  if (q.closed) throw new Error('This request is already closed');
  if (side !== 'customer') throw new Error('Only the customer accepts the seller’s price');
  if (!customerCanAccept(q.state)) {
    throw new Error(q.state.openPrice ? 'There is no price to accept yet' : 'This version is not waiting for you');
  }

  await strapi.execute('86addVoteToSheirutpend_v2', {
    sheirutpend: q.id,
    user: String(context.userId),
    what: true,
    order: q.state.order,
    why: ''
  });
  await postToRequestChat(strapi, q, String(context.userId), '✓ אישרתי את המחיר');

  // A rikma of one (the usual shop) has signed with its quote: the deal is made.
  if (rikmaSigned(q)) {
    const out: any = await settleQuote(q, context, util);
    return {
      data: { sheirutpendId: q.id, settled: true, serviceId: out?.data?.serviceId ?? null },
      sheirutpendId: q.id,
      recipientIds: q.memberIds,
      updateStrategy: { type: 'none' as const }
    };
  }
  // Otherwise the other members sign this round in the usual way (addVote).
  await resetQuoteClock(strapi, q);
  return {
    data: { sheirutpendId: q.id, settled: false },
    sheirutpendId: q.id,
    recipientIds: q.memberIds,
    updateStrategy: { type: 'none' as const }
  };
};

export const acceptSheirutQuoteConfig: ActionConfig = {
  key: 'acceptSheirutQuote',
  description:
    "Customer signs the seller's current price on a product request; settles it into a Sheirut when the rikma has signed too.",
  graphqlOperation: acceptHandler,
  paramSchema: { sheirutpendId: { type: 'string', required: true } },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to accept a price' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds', excludeSender: true } },
    templates: {
      title: { he: 'הלקוחה אישרה את המחיר', en: 'The customer accepted your price', ar: 'وافقت العميلة على السعر' },
      body: {
        he: 'המחיר שהצעת אושר. אם יש ברקמה חברים נוספים — הם מאשרים עכשיו ב־Deals.',
        en: 'Your price was accepted. If the rikma has other members, they sign it now in Deals.',
        ar: 'تمت الموافقة على سعرك. إن كان في الريكما أعضاء آخرون فهم يوقّعون الآن في Deals.'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti',
    metadata: { priority: 'high', type: 'sheirutUpdate', url: 'deals/request/{{sheirutpendId}}' }
  },
  updateStrategy: { type: 'none' }
};

// ── getSheirutpendQuote ──────────────────────────────────────────────────────

const getHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { q, side } = await loadForCaller(strapi, String(params.sheirutpendId), String(context.userId));
  const clock = await strapi
    .execute('362getActiveTimegramaForSheirutpend', { id: q.id })
    .catch(() => null);
  return {
    data: {
      silenceAt: clock?.data?.timegramas?.data?.[0]?.attributes?.date ?? null,
      sheirutpendId: q.id,
      side,
      closed: q.closed,
      state: q.state,
      memberCount: q.memberIds.length,
      restime: q.restime,
      forumId: q.forumId
    }
  };
};

export const getSheirutpendQuoteConfig: ActionConfig = {
  key: 'getSheirutpendQuote',
  description: 'The price rounds of a product request and whose turn it is — for its customer or the selling rikma.',
  graphqlOperation: getHandler,
  paramSchema: { sheirutpendId: { type: 'string', required: true } },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};

// ── noteSheirutpend ──────────────────────────────────────────────────────────

const noteHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const text = String(params.text ?? '').trim();
  if (!text) throw new Error('text is required');
  const { q } = await loadForCaller(strapi, String(params.sheirutpendId), String(context.userId));
  const forumId = await postToRequestChat(strapi, q, String(context.userId), text.slice(0, 4000));
  return { data: { sheirutpendId: q.id, forumId } };
};

export const noteSheirutpendConfig: ActionConfig = {
  key: 'noteSheirutpend',
  description: "Posts a line into a product request's chat (e.g. the customer's shopping list), creating the chat if needed.",
  graphqlOperation: noteHandler,
  paramSchema: {
    sheirutpendId: { type: 'string', required: true },
    text: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
