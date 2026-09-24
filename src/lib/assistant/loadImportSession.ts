/**
 * Loader half shared by the two import review routes
 * (/moach/import/[sessionId] and /moach/[projectId]/import/[sessionId]).
 *
 * Runs in a `+page.server.ts`, which on www is Vercel: it may only call
 * `/api/*` — `handleFetch` sends that to api.1lev1.com with the caller's
 * cookies — never Strapi or a `$lib/server` module (docs/PLAN_AI_SIGNUP_CONCIERGE §1).
 * The action checks ownership; anything but the owner's own rikma draft reads
 * as "not found".
 */

export interface ImportSessionView {
  sessionId: string;
  kind: string;
  version: number;
  projectId: string | null;
  projectName: string | null;
  fields: Record<string, any>;
  items: any[];
}

export async function loadImportSession(
  fetchFn: typeof fetch,
  sessionId: string
): Promise<ImportSessionView | null> {
  const res = await fetchFn('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'getAssistantSession', params: { sessionId } })
  });
  const body = await res.json().catch(() => null);
  const session = body?.success ? body.data?.session : null;
  return session && session.kind === 'rikma' ? session : null;
}
