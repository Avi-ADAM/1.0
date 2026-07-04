/**
 * Maagad batch jobs — PLAN_DISCOVERY_MAP / PLAN_SHARED_PURCHASE §5, §7.3.
 *
 * Hit this on a schedule (e.g. the same cron service that pings /api/cron) to:
 *   1. clusterRatsons     — aggregate open, un-pooled wishes into demand pools
 *                           (the concierge → maagad link: Ratson IS the wish),
 *   2. expireMaagadOffers — expire offers past their sign deadline.
 *
 * Both run through /api/action with `isSer:true`; handleFetch injects the
 * internal secret on this same-origin server-side fetch, so the action layer
 * uses the admin token. Optional guard: if CRON_SECRET is set, the request must
 * carry `?key=<CRON_SECRET>` (so a public URL can't trigger clustering).
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getTreasuryUserIdStatic } from '$lib/server/revenue/platformProject.js';

// Optional — only enforced when present in the environment.
const CRON_SECRET = env.CRON_SECRET || '';

async function runAction(fetchFn, actionKey, params) {
  const res = await fetchFn('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey, params, isSer: true })
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = { success: false, error: { message: `non-JSON response (${res.status})` } };
  }
  return { ok: res.ok && body?.success !== false, body };
}

export async function GET({ url, fetch }) {
  if (CRON_SECRET) {
    const key = url.searchParams.get('key');
    if (key !== CRON_SECRET) {
      return json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  // Any non-empty userId satisfies the endpoint; the batch actions act on wish
  // owners / offers, not on this caller. Use the platform treasury user when
  // configured for a clean audit trail, else a stable sentinel.
  const userId = getTreasuryUserIdStatic() || 'system';

  const cluster = await runAction(fetch, 'clusterRatsons', { userId });
  const expire = await runAction(fetch, 'expireMaagadOffers', { userId });

  return json({
    ranAt: new Date().toISOString(),
    clusterRatsons: cluster.ok ? cluster.body?.data : { error: cluster.body?.error },
    expireMaagadOffers: expire.ok ? expire.body?.data : { error: expire.body?.error }
  });
}
