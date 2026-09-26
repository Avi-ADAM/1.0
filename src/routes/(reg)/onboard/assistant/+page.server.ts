import type { PageServerLoad } from './$types';

/**
 * The profile, as a conversation (docs/PLAN_AI_SIGNUP_CONCIERGE §6).
 *
 *   /onboard/assistant?s=<id>  — a session (e.g. the one an agent prepared
 *                                before signup; it is read and seeded here)
 *   /onboard/assistant          — the latest profile session, or a new one
 *                                seeded from the profile as it is now
 *
 * On www this runs on Vercel: /api only (PLAN §1.2).
 */
async function action(fetchFn: typeof fetch, actionKey: string, params: Record<string, unknown>) {
  const res = await fetchFn('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey, params })
  });
  const body = await res.json().catch(() => null);
  return body?.success ? body.data : null;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
  const sessionId = url.searchParams.get('s') || undefined;
  const started = await action(fetch, 'startAssistantSession', { kind: 'profile', ...(sessionId ? { sessionId } : {}), via: 'site' });
  if (!started?.sessionId) return { session: null };
  const full = await action(fetch, 'getAssistantSession', { sessionId: started.sessionId });
  return { session: full?.session ?? started };
};
