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
import { ActionError } from '../errors.js';
import { matchOpenMissionToUsers, matchOpenMashaabimToUsers } from '$lib/server/matching/engine';
import { resolveMissionSpec } from '$lib/server/mission/resolveMissionSpec.js';

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
    // Catalogue ids the form already resolved (QA C-8): roles and work ways were
    // never sent, so a need reached people by skill alone.
    skillIds: givenSkillIds = [],
    roleIds = [],
    workwayIds = [],
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
    skillIds?: string[];
    roleIds?: string[];
    workwayIds?: string[];
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

  // ── Already published? (QA C-10) ──────────────────────────────────────────
  // A second press — a reload brought the button back — opened a second open
  // mission for the same need, and a second fan-out of suggestions and mails.
  // The same need (by its extracted id, else by name) is answered with the row
  // that is already out there.
  const existing = await findPublishedNeed(strapi, context, ratsonId, kind, extractedKey, name);
  if (existing) {
    return {
      data: {
        success: true,
        ratsonId: String(ratsonId),
        kind,
        alreadyPublished: true,
        ...(kind === 'mission' ? { openMissionId: existing } : { openMashaabimId: existing })
      },
      updateStrategy: { type: 'none' as const }
    };
  }

  // ── Mission ────────────────────────────────────────────────────────────────
  if (kind === 'mission') {
    // Resolve skill names → ids so the open mission carries matching dimensions
    // (this is what makes it surface in matching users' suggestion feed). Throws
    // rather than publish a skill-less mission nobody will ever be matched to.
    const idList = (v: unknown) => (Array.isArray(v) ? v.map(String).filter((x) => /^\d+$/.test(x)) : []);
    const skills = await resolveNeedSkills(strapi, context, {
      names: Array.isArray(skillNames) ? skillNames : [],
      givenIds: idList(givenSkillIds),
      missionName: name
    });
    const skillIds = skills.ids;

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
        tafkidims: idList(roleIds),
        work_ways: idList(workwayIds),
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

    // Tag matching community members with a suggestion + email.
    const matched = await matchOpenMissionToUsers(openMissionId, 'missionCreated', {
      strapi,
      fetch: context.fetch,
      lang: context.lang
    });

    return {
      data: {
        success: true,
        ratsonId: String(ratsonId),
        kind,
        openMissionId,
        skillsMatched: skillIds.length,
        // What the wisher is shown in the publish modal: the skills the mission
        // really carries (canonical names, `created` for a new catalogue entry)
        // and the ones that could not be attached at all.
        skills: skills.attached,
        skillsMissing: skills.missing,
        usersMatched: matched?.created ?? 0
      },
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

  // Tag users who offer this resource with a suggestion + email.
  const matched = await matchOpenMashaabimToUsers(openMashaabimId, 'resourceCreated', {
    strapi,
    fetch: context.fetch,
    lang: context.lang
  });

  return {
    data: {
      success: true,
      ratsonId: String(ratsonId),
      kind,
      openMashaabimId,
      // A resource is matched by its catalogue template, as a mission is by its
      // skills: without one nobody holding the resource is ever told, so the
      // modal says so instead of reporting a plain success.
      templateId: mashaabimTemplateId ? String(mashaabimTemplateId) : null,
      usersMatched: matched?.created ?? 0
    },
    updateStrategy: { type: 'none' as const }
  };
};

// ── Skill resolution ─────────────────────────────────────────────────────────

/**
 * Extra attempts on top of StrapiClient's own read retry (~0.7s of backoff),
 * which the 2026-10-07 outage outlasted — open mission 286 went out with none
 * of its five skills and matched nobody.
 */
export const READ_RETRY_DELAYS_MS = [1000, 3000];

async function retryRead<T>(label: string, read: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= READ_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await read();
    } catch (e) {
      lastErr = e;
      if (attempt === READ_RETRY_DELAYS_MS.length) break;
      console.warn(`[publishWishNeedToCommunity] ${label} failed (attempt ${attempt + 1}), retrying:`, e);
      await new Promise((r) => setTimeout(r, READ_RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastErr;
}

export interface AttachedSkill {
  id: string;
  name: string;
  /** Not in the catalogue before this publish — created now, in the default locale. */
  created?: boolean;
}

/**
 * Skill names (the AI's suggestions, or the chips the wisher kept) → ids.
 *
 * 1. Exact name lookup (`172resolveSkillsByName`), retried — it is a read.
 *    A lookup that still fails is `SKILLS_UNAVAILABLE`: nothing was written yet,
 *    so the client simply offers to try again.
 * 2. Names the catalogue does not hold go through `resolveMissionSpec` — the same
 *    path the mission form uses: a vector match catches a different spelling,
 *    and what is really new is created via /api/vocab/create (default locale,
 *    moderated, `createdBy: 'ai'`).
 * 3. Whatever is still without an entry is returned as `missing`. If that leaves
 *    the mission with no skill at all it is `SKILLS_NOT_ATTACHED` — never a
 *    silent skill-less publish.
 */
export async function resolveNeedSkills(
  strapi: any,
  context: any,
  { names, givenIds, missionName }: { names: unknown[]; givenIds: string[]; missionName: string }
): Promise<{ ids: string[]; attached: AttachedSkill[]; missing: string[] }> {
  const wanted: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const n = String(raw ?? '').trim();
    const key = n.toLowerCase();
    if (!n || seen.has(key)) continue;
    seen.add(key);
    wanted.push(n);
  }
  if (wanted.length === 0) return { ids: [...new Set(givenIds)], attached: [], missing: [] };

  let rows: any[];
  try {
    rows = await retryRead('skill lookup', async () => {
      const res = await strapi.execute('172resolveSkillsByName', { names: wanted }, context.jwt, context.fetch);
      const list = res?.data?.skills?.data;
      // No list at all is a failed read, not "none of these exist".
      if (!Array.isArray(list)) throw new Error('172resolveSkillsByName returned no skills list');
      return list;
    });
  } catch (e) {
    console.error('[publishWishNeedToCommunity] skill lookup failed after retries:', e);
    throw new ActionError('SKILLS_UNAVAILABLE', 'Could not read the skill catalogue; nothing was published', {
      skills: wanted
    });
  }

  const attached: AttachedSkill[] = [];
  const found = new Set<string>();
  for (const row of rows) {
    const label = String(row?.attributes?.skillName ?? '').trim();
    if (row?.id == null || !label) continue;
    found.add(label.toLowerCase());
    attached.push({ id: String(row.id), name: label });
  }

  const rest = wanted.filter((n) => !found.has(n.toLowerCase()));
  let missing: string[] = [];
  if (rest.length) {
    try {
      const lang = context.lang === 'en' || context.lang === 'ar' ? context.lang : 'he';
      const r = await resolveMissionSpec({ name: missionName, skills: rest, lang }, context.fetch);
      for (const t of r.skills.resolved) {
        attached.push(t.created ? { id: t.id, name: t.name, created: true } : { id: t.id, name: t.name });
      }
      missing = r.skills.unresolved;
    } catch (e) {
      console.warn('[publishWishNeedToCommunity] creating new skills failed:', e);
      missing = rest;
    }
  }

  const unique = attached.filter((t, i) => attached.findIndex((o) => o.id === t.id) === i);
  const ids = [...new Set([...givenIds, ...unique.map((t) => t.id)])];
  if (ids.length === 0) {
    throw new ActionError('SKILLS_NOT_ATTACHED', 'None of the skills could be attached; nothing was published', {
      skills: missing
    });
  }
  return { ids, attached: unique, missing };
}

/**
 * The open mission / mashaabim this wish already published for the same need, or
 * null. Best-effort: a failed read publishes (the pre-check never blocks a publish).
 */
async function findPublishedNeed(
  strapi: any,
  context: any,
  ratsonId: string,
  kind: 'mission' | 'resource',
  extractedKey: string | null,
  name: string
): Promise<string | null> {
  try {
    const res = await retryRead<any>('published-need check', () =>
      strapi.execute('416wishPublishedNeeds', { ratson: String(ratsonId) }, context.jwt, context.fetch)
    );
    const list: any[] = (kind === 'mission' ? res?.data?.openMissions?.data : res?.data?.openMashaabims?.data) ?? [];
    const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
    const hit =
      (extractedKey != null && String(extractedKey) !== ''
        ? list.find((n) => String(n?.attributes?.extractedKey ?? '') === String(extractedKey))
        : null) ?? list.find((n) => norm(n?.attributes?.name) === norm(name));
    return hit?.id != null ? String(hit.id) : null;
  } catch (e) {
    console.warn('[publishWishNeedToCommunity] could not check for an earlier publish:', e);
    return null;
  }
}

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
    skillIds: { type: 'array', required: false },
    roleIds: { type: 'array', required: false },
    workwayIds: { type: 'array', required: false },
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
