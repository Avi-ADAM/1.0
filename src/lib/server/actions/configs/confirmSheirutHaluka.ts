import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { recordWishPaymentSale } from '$lib/server/sheirut/paymentSale.js';
import { NotADealReceiverError, receiveDealMoney } from '$lib/server/deal/dealMoney.js';

// The platform (1💗1) product that site-share income is recorded against.
// Hardcoded for now per spec (PLAN_SITE_SHARE_PER_MEMBER §5) — to be made
// data-driven later.
const SITE_SHARE_PRODUCT_ID = '13';

/**
 * A customer's payment for a deal is recorded too, as the rikma's income held by whoever
 * received it, once both sides confirmed (C-17 — `$lib/server/sheirut/paymentSale`), so the
 * rikma's split mechanism sees it.
 *
 * When a site-share transfer is fully confirmed (sender sent + receiver got)
 * we record the income as a Sale in the platform rikma, in the RECEIVER's name,
 * against the platform product. Best-effort: a failure here must not roll back
 * the confirmation (the money already moved) — it's logged, not thrown.
 */
async function recordSiteShareSale(
  strapi: any,
  context: any,
  args: { reciveProjectId: string; receiverId: string; amount: number; halukaId: string },
) {
  try {
    const res = await strapi.execute(
      '206createPlatformSale',
      {
        project: String(args.reciveProjectId),
        userId: String(args.receiverId),
        product: SITE_SHARE_PRODUCT_ID,
        amount: parseFloat(String(args.amount)) || 0,
        publishedAt: new Date().toISOString(),
        note: `site-share · paid=${args.amount} · haluka=${args.halukaId}`,
      },
      context.jwt,
      context.fetch,
    );
    if (res?.errors) {
      console.error('[confirmSheirutHaluka] site-share sale failed:', JSON.stringify(res.errors));
      return null;
    }
    return res?.data?.createSale?.data?.id ?? null;
  } catch (err) {
    console.error('[confirmSheirutHaluka] site-share sale error:', err);
    return null;
  }
}

const confirmSheirutHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { halukaId, role } = params;
  const { userId } = context;

  if (role !== 'sender' && role !== 'receiver') {
    throw new Error('Invalid role: must be "sender" or "receiver"');
  }

  const getRes = await strapi.execute(
    '71.5getHaluka',
    { id: halukaId },
    context.jwt,
    context.fetch
  );

  const haluka = getRes?.data?.haluka?.data?.attributes;
  if (!haluka) throw new Error('Haluka not found');

  const senderId = String(haluka.usersend?.data?.id);
  const receiverId = String(haluka.userrecive?.data?.id);
  const isSiteShare = !!haluka.isSiteShare;
  const reciveProjectId = haluka.recive_project?.data?.id
    ? String(haluka.recive_project.data.id)
    : null;
  const amount = Number(haluka.amount) || 0;
  // A customer's payment for a deal (as opposed to a site-share or a stipend transfer).
  const sheirutId = haluka.sheirut?.data?.id ? String(haluka.sheirut.data.id) : null;

  if (role === 'sender') {
    if (String(userId) !== senderId) {
      throw new Error('Only the sender can confirm sending');
    }
    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, senderconf: true },
      context.jwt,
      context.fetch
    );
    if (updateRes?.errors) {
      throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);
    }
    // This confirmation completes the pair iff the receiver already confirmed
    // AND the sender hadn't already confirmed (so the sale fires exactly once).
    let saleId: string | null = null;
    const nowComplete = haluka.confirmed === true && haluka.senderconf !== true;
    if (nowComplete && isSiteShare && reciveProjectId) {
      saleId = await recordSiteShareSale(strapi, context, {
        reciveProjectId,
        receiverId,
        amount,
        halukaId: String(halukaId),
      });
    } else if (nowComplete && !isSiteShare && sheirutId) {
      saleId = (await recordWishPaymentSale(strapi, context, { sheirutId, halukaId: String(halukaId), senderId, receiverId, amount })).saleId;
    }
    return { confirmed: true, role: 'sender', halukaId, complete: nowComplete, saleId };
  } else {
    if (String(userId) !== receiverId) {
      throw new Error('Only the receiver can confirm receiving');
    }
    // The receiver's word settles the transfer on its own: money that arrived was sent, so
    // `senderconf` goes with it and the sender is never asked to confirm it again.
    const nowComplete = haluka.confirmed !== true;
    let saleId: string | null = null;

    // A customer's payment on a wish deal is one fact with the deal page's "I received my
    // part" — the same write (`$lib/server/deal/dealMoney`), so neither card asks again.
    if (!isSiteShare && sheirutId) {
      try {
        let recorded: string | null = null;
        await receiveDealMoney(
          (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch),
          sheirutId,
          String(userId),
          {
            recordSale: async (t) => {
              recorded = (await recordWishPaymentSale(strapi, context, {
                sheirutId, halukaId: t.id, senderId: String(t.senderId ?? senderId), receiverId, amount: t.amount
              })).saleId ?? recorded;
            }
          }
        );
        return { confirmed: true, role: 'receiver', halukaId, complete: nowComplete, saleId: recorded };
      } catch (err) {
        // Not a wish deal: the transfer is confirmed on its own, below.
        if (!(err instanceof NotADealReceiverError)) throw err;
      }
    }

    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, confirmed: true, senderconf: true },
      context.jwt,
      context.fetch
    );
    if (updateRes?.errors) {
      throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);
    }
    // Fires exactly once: only the confirmation that settles the transfer records it.
    if (nowComplete && isSiteShare && reciveProjectId) {
      saleId = await recordSiteShareSale(strapi, context, {
        reciveProjectId,
        receiverId,
        amount,
        halukaId: String(halukaId),
      });
    }
    return { confirmed: true, role: 'receiver', halukaId, complete: nowComplete, saleId };
  }
};

export const confirmSheirutHalukaConfig: ActionConfig = {
  key: 'confirmSheirutHaluka',
  description: 'Confirm sending or receiving money in a sheirut haluka transfer',
  graphqlOperation: confirmSheirutHalukaHandler,
  paramSchema: {
    halukaId: { type: 'string', required: true, description: 'Haluka ID' },
    role: { type: 'string', required: true, description: '"sender" or "receiver"' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' }
  ],
  updateStrategy: { type: 'none' }
};
