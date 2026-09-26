/**
 * The loader half of the claim (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.4), for
 * `+page.server` files on www: it may only call /api (PLAN §1.2), which
 * `handleFetch` sends to the VPS with the caller's session.
 *
 * Returns where to continue, or null when nothing was waiting (or the call
 * failed — a claim must never stand between a new member and the site).
 */

import { isSafeLanding } from './landing.js';

export async function claimLanding(fetchFn: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchFn('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey: 'claimAssistantSession', params: {} })
    });
    const body = await res.json().catch(() => null);
    const landing = body?.success ? body.data?.claimed?.landing : null;
    return isSafeLanding(landing) ? landing : null;
  } catch {
    return null;
  }
}
