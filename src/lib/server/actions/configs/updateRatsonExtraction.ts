/**
 * Update Ratson Extraction — PLAN_CONCIERGE §4 (review-stage editing)
 *
 * The wisher reviews Lev's breakdown on /concierge/[id] and corrects it:
 * rename a mission, fix hours, drop a resource, flip must/nice. This persists
 * the edited `extracted_missions` / `extracted_resources` components back onto
 * the Ratson via `100updateRatson`.
 *
 * Owner-only. Re-matching is left to the caller (fire `matchRatson` after a
 * meaningful edit) so a single keystroke fix doesn't trigger a match sweep.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type ExtractedMissionInput = {
  name: string;
  hoursEst?: number | null;
  importance?: 'must' | 'nice';
  notes?: string;
};

type ExtractedResourceInput = {
  name: string;
  kindOf?: string | null;
  quantityEst?: number | null;
  importance?: 'must' | 'nice';
  notes?: string;
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    ratsonId,
    extracted_missions = [],
    extracted_resources = []
  } = params as {
    ratsonId: string;
    extracted_missions?: ExtractedMissionInput[];
    extracted_resources?: ExtractedResourceInput[];
  };

  if (!ratsonId) throw new Error('ratsonId is required');

  // ── Authorization: only the wish owner may edit its breakdown ─────────────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratsonNode = ratRes?.data?.ratson?.data;
  if (!ratsonNode) throw new Error(`Ratson ${ratsonId} not found`);

  const owners = ratsonNode.attributes?.users_permissions_users?.data ?? [];
  const isOwner = owners.some((o: any) => String(o.id) === String(context.userId));
  if (!isOwner) throw new Error('Only the ratson owner may edit its breakdown');

  // ── Normalise the component payloads (drop empties) ───────────────────────
  const missions = (extracted_missions || [])
    .map((m) => ({
      name: String(m.name || '').trim(),
      hoursEst: typeof m.hoursEst === 'number' ? m.hoursEst : null,
      importance: m.importance === 'must' ? 'must' : 'nice',
      notes: m.notes || ''
    }))
    .filter((m) => m.name);

  const resources = (extracted_resources || [])
    .map((r) => ({
      name: String(r.name || '').trim(),
      kindOf: r.kindOf || null,
      quantityEst: typeof r.quantityEst === 'number' ? r.quantityEst : null,
      importance: r.importance === 'must' ? 'must' : 'nice',
      notes: r.notes || ''
    }))
    .filter((r) => r.name);

  await strapi.execute(
    '100updateRatson',
    {
      id: ratsonId,
      extracted_missions: missions,
      extracted_resources: resources
    },
    context.jwt,
    context.fetch
  );

  return {
    success: true,
    ratsonId: String(ratsonId),
    extractedMissionsCount: missions.length,
    extractedResourcesCount: resources.length
  };
};

export const updateRatsonExtractionConfig: ActionConfig = {
  key: 'updateRatsonExtraction',
  description:
    "Owner edits a wish's extracted missions/resources (review-stage corrections).",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    extracted_missions: { type: 'array', required: false },
    extracted_resources: { type: 'array', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to edit a wish' }]
};
