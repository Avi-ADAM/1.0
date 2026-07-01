/**
 * Publish Wish Need To Community — PLAN_CONCIERGE §5.2.
 *
 * When a wish need has no provider, the wisher can publish it to the community
 * lev feed. Instead of a brand-new lev object type, we reuse the existing
 * **open-mission / open-mashaabim** entities (which already render as the
 * `sugestmi` / `sugestma` suggestion cards). The published row is:
 *   - project-LESS (it belongs to no weave),
 *   - linked to the source wish via `ratson` (this is what the card brands as
 *     "קונסירג'" — see processSuggestions / sugestmi),
 *   - carries the matching dimensions (skills) so it surfaces through the same
 *     skill/role → open_missions matcher every other suggestion uses.
 *
 * Optionally linked to the wish's BOM slot (`pendm`/`pmash`) so a future
 * "accept community applicant → assign slot" step can bind the volunteer to the
 * exact recipe line. Owner-only.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const RESOURCE_KINDOF = new Set(['monthly', 'perUnit', 'rent', 'total', 'yearly']);
function mapKindOf(raw?: string | null): string {
  if (raw && RESOURCE_KINDOF.has(raw)) return raw;
  switch (raw) {
    case 'subscription':
      return 'monthly';
    case 'good':
      return 'perUnit';
    default:
      return 'total';
  }
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    kind,
    name,
    descrip = '',
    hours = null,
    perhour = null,
    price = null,
    easy = null,
    quantity = null,
    kindOf = 'total',
    recurring = false,
    linkto = '',
    spnot = '',
    startDate = null,
    endDate = null,
    isMust = false,
    // Stable id of the extracted need (extracted_missions/_resources component id)
    // this row was published from. Persisted onto the open mission so a community
    // volunteer's proposal binds to the exact need regardless of later renames.
    extractedKey = null,
    skillNames = [],
    pendmId = null,
    pmashId = null,
    missionTemplateId = null,
    mashaabimTemplateId = null,
    // Optional location override (when the wisher sets a location in the
    // resource form); otherwise we fall back to the wish's own location below.
    isOnline = null,
    lat = null,
    lng = null,
    radius = null,
    location_hint = null
  } = params as {
    ratsonId: string;
    kind: 'mission' | 'resource';
    name: string;
    descrip?: string;
    hours?: number | null;
    perhour?: number | null;
    price?: number | null;
    easy?: number | null;
    quantity?: number | null;
    kindOf?: string;
    recurring?: boolean;
    linkto?: string;
    spnot?: string;
    startDate?: string | null;
    endDate?: string | null;
    isMust?: boolean;
    extractedKey?: string | null;
    skillNames?: string[];
    pendmId?: string | null;
    pmashId?: string | null;
    missionTemplateId?: string | null;
    mashaabimTemplateId?: string | null;
    isOnline?: boolean | null;
    lat?: number | null;
    lng?: number | null;
    radius?: number | null;
    location_hint?: string | null;
  };

  if (!ratsonId) throw new Error('ratsonId is required');
  if (!name) throw new Error('name is required');
  if (kind !== 'mission' && kind !== 'resource') throw new Error("kind must be 'mission' or 'resource'");

  const now = new Date().toISOString();

  // ── Owner check + wish context (location, dates, chat) ─────────────────────
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
  if (!isOwner) throw new Error('Only the wish owner may publish a need to the community');

  // Build a location component. Prefer an explicit override coming from the
  // resource form; otherwise fall back to the wish's own flat location fields.
  const hasLocOverride =
    isOnline != null ||
    lat != null ||
    lng != null ||
    radius != null ||
    (typeof location_hint === 'string' && location_hint.trim() !== '');
  const loc: Record<string, unknown> = {};
  if (hasLocOverride) {
    if (lat != null) loc.lat = lat;
    if (lng != null) loc.lng = lng;
    if (radius != null) loc.radius = Math.round(Number(radius));
    if (location_hint) loc.location_hint = location_hint;
    if (isOnline) loc.location_mode = 'online';
  } else {
    if (ratAttrs.lat != null) loc.lat = ratAttrs.lat;
    if (ratAttrs.lng != null) loc.lng = ratAttrs.lng;
    if (ratAttrs.radius != null) loc.radius = Math.round(Number(ratAttrs.radius));
    if (ratAttrs.location_hint) loc.location_hint = ratAttrs.location_hint;
    if (ratAttrs.isOnline) loc.location_mode = 'online';
  }
  const location = Object.keys(loc).length ? loc : null;

  // ── Mission ────────────────────────────────────────────────────────────────
  if (kind === 'mission') {
    // Resolve skill names → ids so the open mission carries matching dimensions
    // (this is what makes it surface in matching users' suggestion feed).
    let skillIds: string[] = [];
    if (Array.isArray(skillNames) && skillNames.length) {
      try {
        const sRes = await strapi.execute(
          '172resolveSkillsByName',
          { names: skillNames },
          context.jwt,
          context.fetch
        );
        skillIds = (sRes?.data?.skills?.data ?? []).map((s: any) => String(s.id));
      } catch (e) {
        console.warn('[publishWishNeedToCommunity] skill resolve failed (non-fatal):', e);
      }
    }

    const omRes = await strapi.execute(
      '169crWishOpenMission',
      {
        name,
        descrip: descrip || '',
        hearotMeyuchadot: '',
        noofhours: typeof hours === 'number' ? hours : 0,
        perhour: typeof perhour === 'number' ? perhour : 0,
        isMust: !!isMust,
        ratson: ratsonId,
        pendm: pendmId || null,
        mission: missionTemplateId || null,
        skills: skillIds,
        tafkidims: [],
        work_ways: [],
        // Branded as Concierge by the `source` enum (and the `ratson` relation).
        source: 'concierge',
        location,
        sqadualed: ratAttrs.startDate || null,
        publishedAt: now
      },
      context.jwt,
      context.fetch
    );
    const openMissionId = omRes?.data?.createOpenMission?.data?.id
      ? String(omRes.data.createOpenMission.data.id)
      : null;
    if (!openMissionId) throw new Error('Failed to publish the mission to the community');

    await persistExtractedKey(strapi, context, 'mission', openMissionId, extractedKey);
    await seedChat(strapi, context, ratAttrs, name);

    return {
      data: { success: true, ratsonId: String(ratsonId), kind, openMissionId, skillsMatched: skillIds.length },
      updateStrategy: { type: 'none' as const }
    };
  }

  // ── Resource ───────────────────────────────────────────────────────────────
  const omRes = await strapi.execute(
    '170crWishOpenMashaabim',
    {
      name,
      descrip: descrip || '',
      spnot: spnot || '',
      price: typeof price === 'number' ? price : 0,
      // `easy` is the project-side max/risk value; fall back to price when absent.
      easy:
        typeof easy === 'number' && easy > 0
          ? easy
          : typeof price === 'number'
            ? price
            : 0,
      hm: typeof quantity === 'number' && quantity > 0 ? quantity : 1,
      kindOf: mapKindOf(kindOf),
      isMust: !!isMust,
      ratson: ratsonId,
      pmash: pmashId || null,
      mashaabim: mashaabimTemplateId || null,
      // Branded as Concierge by the `source` enum (and the `ratson` relation).
      source: 'concierge',
      linkto: linkto || '',
      recurring: !!recurring,
      location,
      sqadualed: startDate || null,
      sqadualedf: endDate || null,
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const openMashaabimId = omRes?.data?.createOpenMashaabim?.data?.id
    ? String(omRes.data.createOpenMashaabim.data.id)
    : null;
  if (!openMashaabimId) throw new Error('Failed to publish the resource to the community');

  await persistExtractedKey(strapi, context, 'resource', openMashaabimId, extractedKey);
  await seedChat(strapi, context, ratAttrs, name);

  return {
    data: { success: true, ratsonId: String(ratsonId), kind, openMashaabimId },
    updateStrategy: { type: 'none' as const }
  };
};

/**
 * Persist the stable extracted-need id onto the freshly published open mission /
 * mashaabim, so a community volunteer's proposal binds to the exact need by id
 * (not by name). Best-effort: the `extractedKey` field may not be live in Strapi
 * yet — a failure here must never fail the publish (applyToMission falls back to
 * matching by name in that window). Reuses the generic update mutations.
 */
async function persistExtractedKey(
  strapi: any,
  context: any,
  kind: 'mission' | 'resource',
  id: string,
  extractedKey: string | null
) {
  if (extractedKey == null || String(extractedKey) === '') return;
  const qid = kind === 'mission' ? 'negoUpdateOpenMission' : 'applyRoundToOpenMashaabim';
  try {
    await strapi.execute(
      qid,
      { id, data: { extractedKey: String(extractedKey) } },
      context.jwt,
      context.fetch
    );
  } catch (e) {
    console.warn(
      '[publishWishNeedToCommunity] extractedKey persist failed (field may not be live yet):',
      e
    );
  }
}

async function seedChat(strapi: any, context: any, ratAttrs: any, name: string) {
  const chatForumId = ratAttrs.chat_forum?.data?.id ?? null;
  if (!chatForumId) return;
  try {
    await strapi.execute(
      '1chatsend',
      {
        fid: chatForumId,
        fidn: parseInt(String(chatForumId), 10),
        idL: context.userId,
        da: new Date().toISOString(),
        mes: `פרסמתי לקהילה: "${name}". מי שמתאים יוכל להציע את עצמו מהלב.`
      },
      context.jwt,
      context.fetch
    );
  } catch {
    /* best-effort */
  }
}

export const publishWishNeedToCommunityConfig: ActionConfig = {
  key: 'publishWishNeedToCommunity',
  description:
    "Publish a wish need (mission or resource) to the community lev feed as a project-less open-mission / open-mashaabim linked to the wish (ratson). Surfaces via the existing skill/sp suggestion matcher; branded as Concierge by the ratson link. Owner-only.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    kind: { type: 'string', required: true },
    name: { type: 'string', required: true },
    descrip: { type: 'string', required: false },
    hours: { type: 'number', required: false },
    perhour: { type: 'number', required: false },
    price: { type: 'number', required: false },
    easy: { type: 'number', required: false },
    quantity: { type: 'number', required: false },
    kindOf: { type: 'string', required: false },
    recurring: { type: 'boolean', required: false },
    linkto: { type: 'string', required: false },
    spnot: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false },
    isMust: { type: 'boolean', required: false },
    extractedKey: { type: 'string', required: false },
    skillNames: { type: 'array', required: false },
    pendmId: { type: 'string', required: false },
    pmashId: { type: 'string', required: false },
    missionTemplateId: { type: 'string', required: false },
    mashaabimTemplateId: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    lat: { type: 'number', required: false },
    lng: { type: 'number', required: false },
    radius: { type: 'number', required: false },
    location_hint: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to publish a need' }],
  updateStrategy: { type: 'none' }
};
