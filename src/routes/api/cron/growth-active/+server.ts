/**
 * GET /api/cron/growth-active   (x-cron-secret header or ?key=<CRON_SECRET>)
 *
 * The daily active-provider check of the Growth Agent
 * (docs/inprogress/PLAN_GROWTH_AGENT.md §10.4): every business that created a
 * rikma gets its rikma's totals recorded, and `joined` → `activeProvider` when
 * it offers something and someone dealt with it lately. Reads only totals,
 * contacts nobody. Off (204) when the Growth module has no store.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkCron } from '$lib/server/cronAuth.js';
import { growthRepository } from '$lib/server/growth/repo';
import { checkActiveProviders } from '$lib/server/growth/activeProviders';
import { strapiClient } from '$lib/server/actions/index.js';

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const auth = checkCron(request, url, { required: true });
  if (!auth.ok) return json({ error: auth.error }, { status: auth.status });
  const repo = growthRepository();
  if (!repo) return new Response(null, { status: 204 });
  const report = await checkActiveProviders(repo, strapiClient, { fetch, force: url.searchParams.get('force') === '1' });
  console.log('[growth] active check', JSON.stringify({ ...report, failed: report.failed.length }));
  return json(report);
};
