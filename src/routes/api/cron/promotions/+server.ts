/**
 * The promotions clock (PLAN_SHOP_PROMOTIONS §3.3–3.4, P3).
 *
 *   GET /api/cron/promotions?key=<CRON_SECRET>
 *
 * Starts scheduled promotions, ends them at their time or cap, and resumes an
 * emergency pause after 24 hours when no counter was opened. Schedule it every
 * 15 minutes, next to /api/cron/orders. Idempotent.
 *
 * Runs as the service account — there is no user in a cron request.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { SendToAdmin } from '$lib/server/sendToAdmin.js';
import { execFromAdmin } from '$lib/server/archive/exec.js';
import { runPromotionClock } from '$lib/server/promotions/clock';

export const GET: RequestHandler = async ({ url }) => {
  const secret = env.CRON_SECRET || '';
  // Same guard as the other cron endpoints: enforced whenever a secret is configured.
  if (secret && url.searchParams.get('key') !== secret) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const report = await runPromotionClock(execFromAdmin(SendToAdmin, env.ADMINMONTHER ?? ''));
    console.log(`[cron/promotions] moved ${report.moved.length}, errors ${report.errors.length}`);
    return json(report);
  } catch (e) {
    // Before 1.0b deploys the promotion collection the query itself fails — nothing to move.
    console.error('[cron/promotions] run failed:', e);
    return json({ error: (e as Error).message }, { status: 500 });
  }
};
