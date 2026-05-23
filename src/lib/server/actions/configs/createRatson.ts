/**
 * Create Ratson (Wish) Action — PLAN_CONCIERGE §3.1
 *
 * Replaces the legacy direct `5crratson` mutation from `crratson.svelte`.
 * Wraps creation in a Process anchor with its main chat_forum so every
 * wish has a place for discussion and per-proposal mapping forums.
 *
 * Flow:
 *   1. Mutation `5crratson` — creates the Ratson row with all the new
 *      fields (status_ratson='draft' or 'open', extracted_*, location, etc.)
 *   2. `91createPartof`     — creates the process anchor
 *   3. `2forumCrBasic`      — creates the chat_forum (project = null)
 *   4. `92updateForumSubject` — sets a stable subject for the forum
 *   5. `100updateRatson`    — back-links chat_forum + process
 *
 * Out of scope (later milestones):
 *   - `analyzeRatson` AI extraction (M6)
 *   - automatic `matchRatson` trigger (call it separately if useAI=false)
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type ExtractedMissionInput = {
  name: string;
  hoursEst?: number;
  importance?: 'must' | 'nice';
  notes?: string;
};

type ExtractedResourceInput = {
  name: string;
  kindOf?: string;
  quantityEst?: number;
  importance?: 'must' | 'nice';
  notes?: string;
};

const VALID_STATUS = new Set([
  'draft',
  'open',
  'matching',
  'negotiating',
  'fulfilled',
  'expired',
  'cancelled'
]);

const VALID_ACCESS = new Set(['personal', 'free_threshold', 'pay_to_access']);

function buildProcessSubject(processId: string, name: string): string {
  return `RATSON::${processId}::${name.trim()}`;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    name,
    desc = '',
    longDes = '',
    startDate = null,
    finnishDate = null,
    logoId = null,
    link = null,
    allowJoin = false,
    bounti = false,
    totalbounti = 0,
    vallues = [],
    categories = [],
    missions = [],
    mashaabims = [],
    status_ratson = 'open',
    access_mode = 'personal',
    sub_category = null,
    language = null,
    lat = null,
    lng = null,
    radius = null,
    location_hint = null,
    frequency = null,
    isOnline = false,
    age_group = null,
    ai_meta = null,
    extracted_missions = [],
    extracted_resources = []
  } = params as {
    name: string;
    desc?: string;
    longDes?: string;
    startDate?: string | null;
    finnishDate?: string | null;
    logoId?: string | null;
    link?: string | null;
    allowJoin?: boolean;
    bounti?: boolean;
    totalbounti?: number;
    vallues?: string[];
    categories?: string[];
    missions?: string[];
    mashaabims?: string[];
    status_ratson?: string;
    access_mode?: string;
    sub_category?: string | null;
    language?: string | null;
    lat?: number | null;
    lng?: number | null;
    radius?: number | null;
    location_hint?: string | null;
    frequency?: string | null;
    isOnline?: boolean;
    age_group?: string | null;
    ai_meta?: unknown;
    extracted_missions?: ExtractedMissionInput[];
    extracted_resources?: ExtractedResourceInput[];
  };

  if (!name || !String(name).trim()) {
    throw new Error('Ratson name is required');
  }

  const status = VALID_STATUS.has(status_ratson) ? status_ratson : 'open';
  const access = VALID_ACCESS.has(access_mode) ? access_mode : 'personal';
  const now = new Date().toISOString();

  const extractedMissionsClean = (extracted_missions || []).map((m) => ({
    name: String(m.name || '').trim(),
    hoursEst: typeof m.hoursEst === 'number' ? m.hoursEst : null,
    importance: m.importance === 'must' ? 'must' : 'nice',
    notes: m.notes || ''
  }));
  const extractedResourcesClean = (extracted_resources || []).map((r) => ({
    name: String(r.name || '').trim(),
    kindOf: r.kindOf || null,
    quantityEst: typeof r.quantityEst === 'number' ? r.quantityEst : null,
    importance: r.importance === 'must' ? 'must' : 'nice',
    notes: r.notes || ''
  }));

  // ── 1. Create the Ratson row ──────────────────────────────────────────────
  const createVars: Record<string, unknown> = {
    name: String(name).trim(),
    des: desc,
    longDes,
    startDate,
    finnishDate,
    fulfilled: false,
    allowJoin,
    bounti,
    totalbounti: Number(totalbounti) || 0,
    vallues,
    categories,
    missions,
    mashaabims,
    users_permissions_users: [context.userId],
    link,
    publishedAt: now,
    status_ratson: status,
    access_mode: access,
    sub_category,
    language,
    lat,
    lng,
    radius,
    location_hint,
    frequency,
    isOnline,
    age_group,
    ai_meta,
    extracted_missions: extractedMissionsClean,
    extracted_resources: extractedResourcesClean
  };
  if (logoId) createVars.logo = logoId;

  const ratsonRes = await strapi.execute('5crratson', createVars, context.jwt, context.fetch);
  const ratsonId: string | null = ratsonRes?.data?.createRatson?.data?.id ?? null;
  if (!ratsonId) {
    throw new Error('Failed to create ratson');
  }

  // ── 2. Create process anchor + chat forum (best-effort) ──────────────────
  let processId: string | null = null;
  let chatForumId: string | null = null;

  try {
    const partofRes = await strapi.execute(
      '91createPartof',
      { default: false },
      context.jwt,
      context.fetch
    );
    processId = partofRes?.data?.createPartof?.data?.id ?? null;

    const forumRes = await strapi.execute(
      '2forumCrBasic',
      { pid: null, da: now },
      context.jwt,
      context.fetch
    );
    chatForumId = forumRes?.data?.createForum?.data?.id ?? null;

    if (chatForumId && processId) {
      await strapi.execute(
        '92updateForumSubject',
        {
          id: chatForumId,
          subject: buildProcessSubject(String(processId), String(name)),
          spec: 'general',
          done: false
        },
        context.jwt,
        context.fetch
      );
    }
  } catch (err) {
    console.warn('[createRatson] process/forum creation failed, continuing without:', err);
  }

  // ── 3. Back-link forum + process onto the ratson ─────────────────────────
  if (chatForumId || processId) {
    try {
      const updateVars: Record<string, unknown> = { id: ratsonId };
      if (chatForumId) updateVars.chat_forum = chatForumId;
      if (processId) updateVars.process = processId;
      await strapi.execute('100updateRatson', updateVars, context.jwt, context.fetch);
    } catch (err) {
      console.warn('[createRatson] backlink update failed:', err);
    }
  }

  return {
    success: true,
    ratsonId: String(ratsonId),
    chatForumId,
    processId,
    status,
    accessMode: access,
    extractedMissionsCount: extractedMissionsClean.length,
    extractedResourcesCount: extractedResourcesClean.length
  };
};

export const createRatsonConfig: ActionConfig = {
  key: 'createRatson',
  description:
    'Create a new Ratson (wish) wrapped in a process anchor with its chat forum',
  graphqlOperation: handler,
  paramSchema: {
    name: { type: 'string', required: true },
    desc: { type: 'string', required: false },
    longDes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finnishDate: { type: 'string', required: false },
    logoId: { type: 'string', required: false },
    link: { type: 'string', required: false },
    allowJoin: { type: 'boolean', required: false },
    bounti: { type: 'boolean', required: false },
    totalbounti: { type: 'number', required: false },
    vallues: { type: 'array', required: false },
    categories: { type: 'array', required: false },
    missions: { type: 'array', required: false },
    mashaabims: { type: 'array', required: false },
    status_ratson: { type: 'string', required: false },
    access_mode: { type: 'string', required: false },
    sub_category: { type: 'string', required: false },
    language: { type: 'string', required: false },
    lat: { type: 'number', required: false },
    lng: { type: 'number', required: false },
    radius: { type: 'number', required: false },
    location_hint: { type: 'string', required: false },
    frequency: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    age_group: { type: 'string', required: false },
    ai_meta: { type: 'object', required: false },
    extracted_missions: { type: 'array', required: false },
    extracted_resources: { type: 'array', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to create a wish' }]
};
