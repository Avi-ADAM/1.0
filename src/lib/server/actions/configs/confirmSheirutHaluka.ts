import type { ActionConfig, ActionExecutionHandler } from '../types.js';

// The platform (1💗1) product that site-share income is recorded against.
// Hardcoded for now per spec (PLAN_SITE_SHARE_PER_MEMBER §5) — to be made
// data-driven later.
const SITE_SHARE_PRODUCT_ID = '13';

/**
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
    }
    return { confirmed: true, role: 'sender', halukaId, complete: nowComplete, saleId };
  } else {
    if (String(userId) !== receiverId) {
      throw new Error('Only the receiver can confirm receiving');
    }
    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, confirmed: true },
      context.jwt,
      context.fetch
    );
    if (updateRes?.errors) {
      throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);
    }
    // This confirmation completes the pair iff the sender already confirmed
    // AND the receiver hadn't already confirmed (so the sale fires exactly once).
    let saleId: string | null = null;
    const nowComplete = haluka.senderconf === true && haluka.confirmed !== true;
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
