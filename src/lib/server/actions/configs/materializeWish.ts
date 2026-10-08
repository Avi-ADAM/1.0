/**
 * Materialize Wish — PLAN_CONCIERGE §5.3 phase 2 (the consent gate).
 *
 * When the wisher closes the consent on /concierge/[id], the composed product
 * (`ratson.derivedComplexMatanot`, a weave-less aggregator built during the
 * assembly phase) is turned into a real deal:
 *
 *   1. Verify every BOM line on the product is assigned to a provider
 *      (each invited provider already approved via `acceptWishOffer`).
 *   2. Set `pendm.rishon` / `pmash.selfProposalUser` = the assigned provider so
 *      the reused BOM activation hands each part to the right person.
 *   3. Create the **dedicated partner weave** — providers are members
 *      (`user_1s`); the customer is the *client* of the deal, NOT a member.
 *      It gets a profile picture: the customer's pick (`profilePicId`), the
 *      wish's own logo, or one made from the concierge medal + the product's
 *      name (`rikmaPicture.ts`).
 *   4. Host the product on that weave and activate it.
 *   5. Open a Sheirutpend (client = wisher) and run the tested
 *      `createSheirutFromPending` flow → Sheirut + mesimabetahalich per provider
 *      + maap per resource → surfaces in /deals/[id].
 *   6. Optionally (`openGaps`), open the parts nobody took as open missions / resources
 *      in the rikma — unassigned lines of the deal, co-signed by the customer when taken
 *      (QA C-19, `$lib/server/wish/openGaps`).
 *   7. Mark the wish fulfilled.
 *
 * Owner-only. Hard-guards readiness server-side (the UI only enables the button
 * once providers have accepted, but the action is the source of truth).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { createSheirutFromPendingConfig } from './createSheirutFromPending.js';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { resolveRikmaPictureId } from '$lib/server/concierge/rikmaPicture.js';
import { openWishGaps, type OpenGapsResult } from '$lib/server/wish/openGaps.js';

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { ratsonId, profilePicId, openGaps = false } = params as {
    ratsonId: string;
    profilePicId?: string | null;
    openGaps?: boolean;
  };
  if (!ratsonId) throw new Error('ratsonId is required');

  const now = new Date().toISOString();

  // ── 1. Load wish (owner check + derived product + dates + chat) ────────────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) throw new Error(`Ratson ${ratsonId} not found`);
  const ratAttrs = ratNode.attributes ?? {};

  const owners = ratAttrs.users_permissions_users?.data ?? [];
  const isOwner = owners.some((o: any) => String(o.id) === String(context.userId));
  if (!isOwner) throw new Error('Only the wish owner may close the consent');
  const wisherId = String(owners[0].id);

  // Idempotent: the wish is marked fulfilled only after the weave + Sheirut
  // exist (step 8), so a second click must not mint a second partnership.
  if (ratAttrs.status_ratson === 'fulfilled' || ratAttrs.fulfilled === true) {
    throw new Error('ההסכמה כבר נסגרה - הרקמה והדיל כבר נוצרו. אפשר למצוא אותם ב"עסקאות".');
  }

  const matanotId = ratAttrs.derivedComplexMatanot?.data?.id
    ? String(ratAttrs.derivedComplexMatanot.data.id)
    : null;
  if (!matanotId) {
    throw new Error('אין עדיין מוצר מורכב - צריך קודם להזמין ספקים ולהרכיב את התכנית');
  }

  const wishName = ratAttrs.name || 'משאלה';
  const startDate = ratAttrs.startDate ?? null;
  const finnishDate = ratAttrs.finnishDate ?? null;

  // ── 2. Load BOM lines + verify readiness ───────────────────────────────────
  const recRes = await strapi.execute(
    '168wishRecipeForMaterialize',
    { id: matanotId },
    context.jwt,
    context.fetch
  );
  const mAttrs = recRes?.data?.matanot?.data?.attributes ?? {};
  const recipeMissions: any[] = mAttrs.matanot_recipe_missions?.data ?? [];
  const recipeResources: any[] = mAttrs.matanot_recipe_resources?.data ?? [];
  const allLines = [...recipeMissions, ...recipeResources];
  if (allLines.length === 0) {
    throw new Error('אין חלקים בתכנית כדי לייצר - יש להוסיף משימות/משאבים קודם');
  }

  const unassigned = allLines.filter((l) => !l.attributes?.assignedMember?.data?.id);
  if (unassigned.length > 0) {
    throw new Error(
      `עוד יש ${unassigned.length} חלקים ללא ספק מאושר - לא ניתן לסגור את ההסכמה עדיין`
    );
  }

  // ── 3. Collect providers, total, and bind each part to its provider ────────
  const providerIds = new Set<string>();
  let total = 0;

  for (const rm of recipeMissions) {
    const a = rm.attributes ?? {};
    const uid = a.assignedMember?.data?.id ? String(a.assignedMember.data.id) : null;
    if (uid) providerIds.add(uid);
    total +=
      (Number(a.hoursPerUnit) || 0) *
      (Number(a.ratePerHour) || 0) *
      (Number(a.unitsPerProduct) || 1);

    // Bind the mission to the provider so BOM activation assigns the
    // mesimabetahalich to them (createSheirutFromPending reads pendm.rishon).
    const pendmId = a.pendm?.data?.id ? String(a.pendm.data.id) : null;
    if (pendmId && uid) {
      try {
        await strapi.execute('negoUpdatePendm', { id: pendmId, data: { rishon: uid } }, context.jwt, context.fetch);
      } catch (e) {
        console.warn('[materializeWish] set pendm.rishon failed (non-fatal):', e);
      }
    }
  }

  for (const rr of recipeResources) {
    const a = rr.attributes ?? {};
    const uid = a.assignedMember?.data?.id ? String(a.assignedMember.data.id) : null;
    if (uid) providerIds.add(uid);
    total += (Number(a.pricePerUnit) || 0) * (Number(a.quantityPerUnit) || 1);

    const pmashId = a.pmash?.data?.id ? String(a.pmash.data.id) : null;
    if (pmashId && uid) {
      try {
        await strapi.execute('negoUpdatePmash', { id: pmashId, data: { selfProposalUser: uid } }, context.jwt, context.fetch);
      } catch (e) {
        console.warn('[materializeWish] set pmash.selfProposalUser failed (non-fatal):', e);
      }
    }
  }

  const providers = [...providerIds];
  if (providers.length === 0) throw new Error('לא נמצאו ספקים מאושרים לתכנית');

  // ── 4. Create the dedicated partner weave (members = providers) ─────────────
  // A face for it: the customer's pick, the wish's own logo, or the concierge
  // medal over a word or two of the product. Best-effort — never blocks the weave.
  const profilePic = await resolveRikmaPictureId({
    chosenId: profilePicId,
    wishLogoId: ratAttrs.logo?.data?.id ? String(ratAttrs.logo.data.id) : null,
    wishName,
    baseUrl: STRAPI_URL,
    jwt: context.jwt,
    fetch: context.fetch
  });

  const weaveRes = await strapi.execute(
    '166crWishWeave',
    {
      members: providers,
      projectName: `${wishName} - רקמה`,
      descripFor: `רקמת שותפים שנוצרה מהמשאלה "${wishName}".`,
      isOt: true,
      ...(profilePic ? { profilePic } : {}),
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const weaveId = weaveRes?.data?.createProject?.data?.id
    ? String(weaveRes.data.createProject.data.id)
    : null;
  if (!weaveId) throw new Error('יצירת רקמת השותפים נכשלה');

  // ── 5. Host the composed product on the weave + activate it ────────────────
  try {
    await strapi.execute(
      '167hostWishMatanot',
      // Made for one customer: never in the public discovery, priced at the deal.
      { id: matanotId, projectcreates: weaveId, publishedAt: now, price: total, hideFromDiscovery: true },
      context.jwt,
      context.fetch
    );
  } catch (e) {
    console.error('[materializeWish] hosting product on weave failed:', e);
    throw new Error('שיוך המוצר לרקמה נכשל');
  }

  // ── 6. Open a Sheirutpend (client = wisher) for the composed product ───────
  const spRes = await strapi.execute(
    '71createSheirutpend',
    {
      project: weaveId,
      userId: wisherId,
      matanots: [matanotId],
      price: total,
      quant: 1,
      total,
      startDate,
      finnishDate,
      appruved: false
    },
    context.jwt,
    context.fetch
  );
  const sheirutpendId = spRes?.data?.createSheirutpend?.data?.id
    ? String(spRes.data.createSheirutpend.data.id)
    : null;
  if (!sheirutpendId) throw new Error('פתיחת ההסכמה (Sheirutpend) נכשלה');

  // ── 7. Produce the Sheirut + activate the BOM (reuse the tested flow) ───────
  let serviceId: string | null = null;
  try {
    const out = await (createSheirutFromPendingConfig.graphqlOperation as ActionExecutionHandler)(
      { sheirutpendId, projectId: weaveId, clientId: wisherId, recipientIds: providers, oneTime: true },
      context,
      util
    );
    serviceId = (out as any)?.data?.serviceId ?? null;
  } catch (e) {
    console.error('[materializeWish] createSheirutFromPending failed:', e);
    throw new Error('הרקמה נוצרה אך פתיחת הדיל נכשלה - אפשר לנסות שוב מתוך הדילים');
  }

  // ── 7b. The parts nobody took go on in the rikma, when she chose so (C-19) ──
  let gaps: OpenGapsResult | null = null;
  if (openGaps === true) {
    try {
      gaps = await openWishGaps(strapi, context, {
        ratsonId: String(ratsonId),
        ratAttrs,
        proposals: ratRes?.data?.ratsonProposals?.data ?? [],
        recipeMissions,
        recipeResources,
        matanotId,
        weaveId
      });
    } catch (e) {
      console.error('[materializeWish] opening the remaining parts failed (the deal stands):', e);
    }
  }

  // ── 8. Mark the wish fulfilled ─────────────────────────────────────────────
  try {
    await strapi.execute('100updateRatson', { id: ratsonId, status_ratson: 'fulfilled' }, context.jwt, context.fetch);
  } catch (e) {
    console.warn('[materializeWish] ratson status update failed (non-fatal):', e);
  }

  // ── 9. Seed the wish chat ──────────────────────────────────────────────────
  const chatForumId = ratAttrs.chat_forum?.data?.id ?? null;
  if (chatForumId) {
    try {
      await strapi.execute(
        '1chatsend',
        {
          fid: chatForumId,
          fidn: parseInt(String(chatForumId), 10),
          idL: context.userId,
          da: now,
          mes: 'המעגל נסגר - נוצרה רקמת שותפים והדיל יצא לדרך. 💗'
        },
        context.jwt,
        context.fetch
      );
    } catch {
      /* best-effort */
    }
  }

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      weaveId,
      matanotId,
      sheirutpendId,
      serviceId,
      providerCount: providers.length,
      gapsOpened: gaps ? gaps.opened + gaps.moved : 0,
      gapsFailed: gaps?.failed ?? 0
    },
    recipientIds: providers,
    updateStrategy: { type: 'none' as const }
  };
};

export const materializeWishConfig: ActionConfig = {
  key: 'materializeWish',
  description:
    'Close the wish consent: create the dedicated partner weave (providers=members, customer=client), host the composed product on it, and run createSheirutFromPending to produce the Sheirut + activate the BOM. Owner-only; requires every BOM slot assigned.',
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    openGaps: {
      type: 'boolean',
      required: false,
      description: 'Open the parts nobody took as open missions / resources in the new rikma (QA C-19)'
    },
    profilePicId: {
      type: 'string',
      required: false,
      description: "Strapi media id the customer chose for the new rikma (omit → the wish's logo, else a generated one)"
    }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to close a wish' }],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'המשאלה יצאה לדרך 💗',
        en: 'The wish is live',
        ar: 'تحققت الأمنية 💗'
      },
      body: {
        he: 'נוצרה רקמת שותפים והדיל נפתח - אפשר להתחיל לעבוד.',
        en: 'A partner weave was created and the deal opened - you can start working.',
        ar: 'تم إنشاء نسيج شركاء وفُتحت الصفقة - يمكنكم البدء.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'high', type: 'sheirutCreated', url: '/deals' }
  },
  updateStrategy: { type: 'none' }
};
