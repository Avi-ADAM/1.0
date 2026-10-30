// A2 batch 2 — Strapi's closed-interval totals for the timers the shadow
// panel is comparing ($lib/server/consent/timersExport). Read-only and
// advisory, like the genesis export beside it: it only feeds the comparison.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { adminToken, strapiGet } from '$lib/server/consent/strapiRest';
import { parseTimerIds, timersQuery, timerTotalsFromRest } from '$lib/server/consent/timersExport';

export const GET: RequestHandler = async ({ params, url, locals }) => {
  if (!locals.uid) throw error(401, 'Unauthorized');
  const projectId = params.projectId;
  if (!projectId || !/^\d+$/.test(projectId)) throw error(400, 'bad projectId');
  const ids = parseTimerIds(url.searchParams.get('ids'));
  if (ids.length === 0) return json({ ok: true, projectId, timers: [] });
  if (!adminToken()) throw error(503, 'mirror credentials not configured');

  const timers = timerTotalsFromRest(await strapiGet(timersQuery(projectId, ids)));
  return json({ ok: true, projectId, timers });
};
