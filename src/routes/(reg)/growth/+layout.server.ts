import { strapiClient } from '$lib/server/actions/index.js';
import { checkGrowthOperator } from '$lib/server/growth/operator';
import { growthRepository } from '$lib/server/growth/repo';
import { summarize } from '$lib/growth/prospect';
import { loadDemand } from '$lib/server/growth/demand';
import type { LayoutServerLoad } from './$types';

/**
 * Lev Growth Agent (docs/inprogress/PLAN_GROWTH_AGENT.md). Every page under
 * /growth reads the pipeline's summaries from here, and only after the same
 * operator check every growth action runs. Someone who is not an operator gets
 * the reason, never a row.
 */
export const load: LayoutServerLoad = async ({ locals, cookies, fetch, depends }) => {
  depends('growth:list');
  const check = await checkGrowthOperator(locals.uid ? String(locals.uid) : null, cookies.get('jwt'), fetch, strapiClient);
  if (!check.ok) {
    const refusal = check as Extract<typeof check, { ok: false }>;
    return { access: refusal.reason, prospects: [], demand: null, uid: String(locals.uid ?? '') };
  }
  const repo = growthRepository();
  const [all, demand] = await Promise.all([repo ? repo.list() : Promise.resolve([]), loadDemand(strapiClient, fetch)]);
  return {
    access: 'ok' as const,
    growthProjectId: check.projectId,
    uid: String(locals.uid ?? ''),
    prospects: all.map(summarize).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    // Open concierge wishes as counts only (§9.2); null = could not be read.
    demand
  };
};
