/**
 * Action: draftDirectOffer — a provider writes a wish *for* a customer.
 * docs/inprogress/PLAN_DIRECT_OFFER.md P3.
 *
 * Built from what a wish already is, not beside it:
 *   - a Ratson in `draft`, with no owner yet (`users_permissions_users` empty) and
 *     `offered_by` = the provider — so it is in nobody's "my wishes" until she takes it;
 *   - the parts of the plan (`extracted_*`), one per line the provider priced;
 *   - the wish's draft product and one BOM line per part, exactly as `requestWishMission`
 *     / `requestWishResource` build them when a wisher invites a provider;
 *   - one invitation proposal per line, the provider as proposer, carrying the
 *     provider's own signature (`agree: true`, under the terms' digest). So once she
 *     takes the wish it is *her* move on every line: approve, or counter.
 *
 * Nothing runs a clock here: until she has an account and took it, nobody is silent.
 * The link is issued separately (`issueDirectOfferLink`), when the provider is ready.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { cleanLines, missionPrice, offerTotal, resourcePrice, type MissionLine, type ResourceLine } from '$lib/offer/directOffer.js';
import { termsDigest } from '$lib/server/wish/termsDigest.js';
import { emailLock } from '$lib/server/offer/offerKey.js';

type Strapi = { execute: (qid: string, vars: any, jwt?: string, fetch?: any) => Promise<any> };
type Ctx = { userId: string; jwt: string; fetch: any };

const REFUSALS: Record<string, string> = {
  none: 'An offer needs at least one part',
  tooMany: 'Too many parts in one offer',
  name: 'Every part needs a name',
  duplicate: 'Two parts of the same kind cannot share a name',
  amount: 'Hours, quantities and prices must be numbers within range, and a part cannot be empty'
};

const idOf = (res: any, path: string[]): string | null => {
  let n = res?.data;
  for (const p of path) n = n?.[p];
  return n?.id != null ? String(n.id) : null;
};

async function processAndForum(strapi: Strapi, ctx: Ctx, name: string, now: string) {
  let processId: string | null = null;
  let chatForumId: string | null = null;
  try {
    processId = idOf(await strapi.execute('91createPartof', { default: false }, ctx.jwt, ctx.fetch), ['createPartof', 'data']);
    chatForumId = idOf(await strapi.execute('2forumCrBasic', { pid: null, da: now }, ctx.jwt, ctx.fetch), ['createForum', 'data']);
    if (chatForumId && processId) {
      await strapi.execute(
        '92updateForumSubject',
        { id: chatForumId, subject: `RATSON::${processId}::${name.trim()}`, spec: 'general', done: false },
        ctx.jwt,
        ctx.fetch
      );
    }
  } catch (err) {
    console.warn('[draftDirectOffer] process/forum creation failed, continuing without:', err);
  }
  return { processId, chatForumId };
}

/** The provider's signature on the version they put on the table. */
const signature = (me: string, kind: 'covered_mission' | 'covered_resource', amount: number, price: number, digest: string, now: string) => ({
  user: me,
  item_kind: kind,
  item_idx: 0,
  agree: true,
  submittedAt: now,
  willingHours: amount,
  willingAmount: price,
  termsDigest: digest
});

async function missionSlot(strapi: Strapi, ctx: Ctx, a: { ratsonId: string; matanotId: string; processId: string | null; line: MissionLine; digest: string; now: string }) {
  const { line, now } = a;
  const price = missionPrice(line);
  const pendmId = idOf(
    await strapi.execute(
      '137createPendmForRecipe',
      { name: line.name, perhour: line.ratePerHour, noofhours: line.hours, descrip: line.notes, publishedAt: now },
      ctx.jwt,
      ctx.fetch
    ),
    ['createPendm', 'data']
  );
  if (!pendmId) throw new Error(`Could not create the part "${line.name}"`);
  const recipeVars: Record<string, unknown> = {
    matanot: a.matanotId,
    pendm: pendmId,
    hoursPerUnit: line.hours,
    unitsPerProduct: 1,
    ratePerHour: line.ratePerHour,
    mode: 'createNew',
    // The name is the bridge from this line back to its part of the plan.
    notes: line.name,
    publishedAt: now
  };
  if (a.processId) recipeVars.partof = a.processId;
  const lineId = idOf(await strapi.execute('125createMatanotRecipeMission', recipeVars, ctx.jwt, ctx.fetch), ['createMatanotRecipeMission', 'data']);
  if (!lineId) throw new Error(`Could not create the line for "${line.name}"`);

  const proposalId = idOf(
    await strapi.execute(
      '101createRatsonProposal',
      {
        ratson: a.ratsonId,
        kind: 'existing_project',
        status_proposal: 'suggested',
        proposer_users: [ctx.userId],
        total_price: price,
        auto_generated: false,
        covered_missions: [{ extracted_mission_idx: lineId, hours: line.hours, price }],
        publishedAt: now
      },
      ctx.jwt,
      ctx.fetch
    ),
    ['createRatsonProposal', 'data']
  );
  if (!proposalId) throw new Error(`Could not create the proposal for "${line.name}"`);
  await strapi.execute(
    '387counterRatsonProposal',
    { id: proposalId, ratson_willingness_entry: [signature(ctx.userId, 'covered_mission', line.hours, price, a.digest, now)] },
    ctx.jwt,
    ctx.fetch
  );
  return { lineId, proposalId };
}

async function resourceSlot(strapi: Strapi, ctx: Ctx, a: { ratsonId: string; matanotId: string; line: ResourceLine; digest: string; now: string }) {
  const { line, now } = a;
  const price = resourcePrice(line);
  const pmashId = idOf(
    await strapi.execute(
      '138createPmashForRecipe',
      { name: line.name, price: line.unitPrice, easy: line.unitPrice, hm: line.quantity, kindOf: 'total', descrip: line.notes, publishedAt: now },
      ctx.jwt,
      ctx.fetch
    ),
    ['createPmash', 'data']
  );
  if (!pmashId) throw new Error(`Could not create the part "${line.name}"`);
  const lineId = idOf(
    await strapi.execute(
      '128createMatanotRecipeResource',
      { matanot: a.matanotId, pmash: pmashId, quantityPerUnit: line.quantity, pricePerUnit: line.unitPrice, mode: 'createNew', notes: line.name, publishedAt: now },
      ctx.jwt,
      ctx.fetch
    ),
    ['createMatanotRecipeResource', 'data']
  );
  if (!lineId) throw new Error(`Could not create the line for "${line.name}"`);

  const proposalId = idOf(
    await strapi.execute(
      '101createRatsonProposal',
      {
        ratson: a.ratsonId,
        kind: 'partial',
        status_proposal: 'suggested',
        proposer_users: [ctx.userId],
        total_price: price,
        auto_generated: false,
        covered_resources: [{ extracted_resource_idx: lineId, quantity: line.quantity, price }],
        publishedAt: now
      },
      ctx.jwt,
      ctx.fetch
    ),
    ['createRatsonProposal', 'data']
  );
  if (!proposalId) throw new Error(`Could not create the proposal for "${line.name}"`);
  await strapi.execute(
    '387counterRatsonProposal',
    { id: proposalId, ratson_willingness_entry: [signature(ctx.userId, 'covered_resource', line.quantity, price, a.digest, now)] },
    ctx.jwt,
    ctx.fetch
  );
  return { lineId, proposalId };
}

/** The wish's terms, normalised as `updateWishTerms` writes them. */
export function offerTerms(p: Record<string, any>) {
  const name = String(p.name ?? '').trim();
  if (!name) throw new Error('An offer needs a name');
  return {
    name,
    desc: name,
    longDes: typeof p.longDes === 'string' ? p.longDes : '',
    startDate: p.startDate || null,
    finnishDate: p.finnishDate || null,
    isOnline: p.isOnline === true,
    location_hint: p.isOnline === true ? null : String(p.location_hint ?? '').trim() || null
  };
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const p = params as Record<string, any>;
  const ctx = context as unknown as Ctx;
  const me = String(context.userId);

  const terms = offerTerms(p);
  const recipientHint = String(p.recipientHint ?? '').trim();
  if (!recipientHint) throw new Error('Say who the offer is for — only you will see it');
  const email = String(p.recipientEmail ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email address does not look right');

  const cleaned = cleanLines({ missions: p.missions, resources: p.resources });
  if ('refusal' in cleaned) throw new Error(REFUSALS[cleaned.refusal]);
  const { lines } = cleaned;

  const now = new Date().toISOString();
  const digest = termsDigest(terms);

  // ── 1. The wish, with no owner yet ─────────────────────────────────────────
  const ratsonId = idOf(
    await strapi.execute(
      '432createDirectOffer',
      {
        data: {
          ...terms,
          status_ratson: 'draft',
          access_mode: 'personal',
          fulfilled: false,
          users_permissions_users: [],
          offered_by: me,
          offer_recipient_hint: recipientHint,
          offer_email_lock: email ? emailLock(email) : null,
          terms_digest: digest,
          extracted_missions: lines.missions.map((m) => ({ name: m.name, hoursEst: m.hours, importance: 'must', notes: m.notes })),
          extracted_resources: lines.resources.map((r) => ({ name: r.name, quantityEst: r.quantity, importance: 'must', notes: r.notes })),
          publishedAt: now
        }
      },
      ctx.jwt,
      ctx.fetch
    ),
    ['createRatson', 'data']
  );
  if (!ratsonId) throw new Error('Could not create the offer');

  // ── 2. Its conversation, as every wish has ─────────────────────────────────
  const { processId, chatForumId } = await processAndForum(strapi as any, ctx, terms.name, now);

  // ── 3. The draft product the parts are lines of ────────────────────────────
  const matanotId = idOf(
    await strapi.execute(
      '139createWishMatanot',
      { name: `${terms.name} - חבילה`, desc: '', pricingMode: 'quote', estimatedPrice: offerTotal(lines), status_of_voting: 'draft', process: processId, publishedAt: now },
      ctx.jwt,
      ctx.fetch
    ),
    ['createMatanot', 'data']
  );
  if (!matanotId) throw new Error('Could not create the offer’s product');
  await strapi.execute(
    '434updateDirectOffer',
    {
      id: ratsonId,
      data: { derivedComplexMatanot: matanotId, ...(processId ? { process: processId } : {}), ...(chatForumId ? { chat_forum: chatForumId } : {}) }
    },
    ctx.jwt,
    ctx.fetch
  );

  // ── 4. One line and one signed proposal per part ───────────────────────────
  const slots: { lineId: string; proposalId: string }[] = [];
  for (const line of lines.missions) {
    slots.push(await missionSlot(strapi as any, ctx, { ratsonId, matanotId, processId, line, digest, now }));
  }
  for (const line of lines.resources) {
    slots.push(await resourceSlot(strapi as any, ctx, { ratsonId, matanotId, line, digest, now }));
  }

  return {
    success: true,
    data: { ratsonId, matanotId, total: offerTotal(lines), slots: slots.length },
    updateStrategy: { type: 'none' as const }
  };
};

export const draftDirectOfferConfig: ActionConfig = {
  key: 'draftDirectOffer',
  description:
    'A provider writes a wish for a customer: the terms, and the parts they will do at their price. The customer takes it from a link (issueDirectOfferLink → claimDirectOffer) and it becomes her wish, with every part a version she approves or counters.',
  graphqlOperation: handler,
  paramSchema: {
    name: { type: 'string', required: true },
    longDes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finnishDate: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    location_hint: { type: 'string', required: false },
    recipientHint: { type: 'string', required: true, description: 'Who the offer is for — shown to the provider only' },
    recipientEmail: { type: 'string', required: false, description: 'When set, only the account with this email may take the offer (stored as an HMAC)' },
    missions: { type: 'array', required: false, description: '[{ name, hours, ratePerHour, notes? }]' },
    resources: { type: 'array', required: false, description: '[{ name, quantity, unitPrice, notes? }]' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to write an offer' }],
  updateStrategy: { type: 'none' }
};
