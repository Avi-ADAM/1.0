/**
 * Update / publish a wish draft — the concierge customer track.
 *
 * A draft is an ordinary Ratson with `status_ratson: 'draft'` (created by
 * `createRatson`). It is private — `109listOpenRatsons` never lists it and
 * /wish/[id] refuses it — and it is where a wish written before registration
 * lands once the account exists, so the customer can come back to it from
 * /concierge or the profile instead of finding it only in one browser.
 *
 * This action rewrites the draft's content and, with `publish: true`, turns it
 * into an open wish in the same write — the same Ratson id, so nothing that
 * already points at it (the profile badge, a shared link) goes stale. The
 * caller fires `matchRatson` afterwards, exactly as after `createRatson`.
 *
 * Owner-only, and only while the Ratson is still a draft: a published wish is
 * edited on /concierge/[id], never rewritten from the composer.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const VALID_ACCESS = new Set(['personal', 'free_threshold', 'pay_to_access']);

type ImportanceInput = { name: string; importance?: 'must' | 'nice' };

function cleanComponents(list: unknown): { name: string; importance: 'must' | 'nice' }[] {
  if (!Array.isArray(list)) return [];
  return (list as ImportanceInput[])
    .map((m) => ({
      name: String(m?.name || '').trim(),
      importance: (m?.importance === 'must' ? 'must' : 'nice') as 'must' | 'nice'
    }))
    .filter((m) => m.name);
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const p = params as Record<string, any>;
  const ratsonId = p.ratsonId ? String(p.ratsonId) : '';
  if (!ratsonId) throw new Error('ratsonId is required');

  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const node = ratRes?.data?.ratson?.data;
  if (!node) throw new Error(`Ratson ${ratsonId} not found`);

  const owners = node.attributes?.users_permissions_users?.data ?? [];
  const isOwner = owners.some((o: any) => String(o.id) === String(context.userId));
  if (!isOwner) throw new Error('Only the wish owner may edit its draft');
  if (node.attributes?.status_ratson !== 'draft') {
    throw new Error('This wish is already published');
  }

  const publish = p.publish === true;
  const vars: Record<string, unknown> = { id: ratsonId };

  // Only the fields the composer actually sent — an omitted one keeps its value.
  if (typeof p.name === 'string') {
    const name = p.name.trim();
    if (publish && !name) throw new Error('Ratson name is required');
    if (name) {
      vars.name = name;
      vars.desc = typeof p.desc === 'string' ? p.desc : name;
    }
  }
  if (typeof p.longDes === 'string') vars.longDes = p.longDes;
  for (const key of ['startDate', 'finnishDate'] as const) {
    if (key in p) vars[key] = p[key] || null;
  }
  for (const key of ['allowJoin', 'bounti', 'isOnline'] as const) {
    if (typeof p[key] === 'boolean') vars[key] = p[key];
  }
  if (typeof p.totalbounti === 'number') vars.totalbounti = p.totalbounti;
  if (VALID_ACCESS.has(p.access_mode)) vars.access_mode = p.access_mode;
  for (const key of ['lat', 'lng', 'radius'] as const) {
    if (key in p) vars[key] = typeof p[key] === 'number' ? p[key] : null;
  }
  if ('location_hint' in p) vars.location_hint = p.location_hint || null;
  if (p.ai_meta && typeof p.ai_meta === 'object') vars.ai_meta = p.ai_meta;
  if ('extracted_missions' in p) vars.extracted_missions = cleanComponents(p.extracted_missions);
  if ('extracted_resources' in p) vars.extracted_resources = cleanComponents(p.extracted_resources);
  if (publish) vars.status_ratson = 'open';

  await strapi.execute('100updateRatson', vars, context.jwt, context.fetch);

  return {
    success: true,
    ratsonId,
    status: publish ? 'open' : 'draft'
  };
};

export const updateRatsonDraftConfig: ActionConfig = {
  key: 'updateRatsonDraft',
  description:
    "Owner saves a wish draft's content, or publishes it (status draft → open).",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    publish: { type: 'boolean', required: false },
    name: { type: 'string', required: false },
    desc: { type: 'string', required: false },
    longDes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finnishDate: { type: 'string', required: false },
    allowJoin: { type: 'boolean', required: false },
    bounti: { type: 'boolean', required: false },
    totalbounti: { type: 'number', required: false },
    access_mode: { type: 'string', required: false },
    isOnline: { type: 'boolean', required: false },
    lat: { type: 'number', required: false },
    lng: { type: 'number', required: false },
    radius: { type: 'number', required: false },
    location_hint: { type: 'string', required: false },
    ai_meta: { type: 'object', required: false },
    extracted_missions: { type: 'array', required: false },
    extracted_resources: { type: 'array', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to edit a wish' }]
};
