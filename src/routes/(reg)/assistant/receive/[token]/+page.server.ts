import { redirect } from '@sveltejs/kit';
import { isSafeLanding } from '$lib/assistant/landing.js';
import type { PageServerLoad } from './$types';

/**
 * A rikma another member prepared for this account (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.7).
 * The token sits in the path, not the query: the (reg) guard sends a guest to
 * /login?from=<pathname>, and only the path survives that round trip.
 * www may only call /api (PLAN §1.2) — the token's key lives on the VPS.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  let received: any = null;
  try {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey: 'receivePreparedRikma', params: { t: params.token } })
    });
    const body = await res.json().catch(() => null);
    received = body?.success ? body.data?.received : null;
  } catch {
    received = null;
  }
  if (received?.ok && isSafeLanding(received.landing)) throw redirect(303, received.landing);
  const reason = ['expired', 'taken', 'otherAccount'].includes(received?.reason) ? received.reason : 'unverified';
  return { reason: reason as 'expired' | 'taken' | 'otherAccount' | 'unverified', email: typeof received?.email === 'string' ? received.email : '' };
};
