import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * "This is how your partnership would look" — a shared rikma draft
 * (docs/PLAN_AI_SIGNUP_CONCIERGE §4.4). On www this runs on Vercel, so it only
 * calls /api; the projection and the key check happen on the VPS.
 */
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const res = await fetch(`/api/assistant/preview?k=${encodeURIComponent(params.shareKey)}`);
  if (res.status === 404) throw error(404, 'Not found');
  if (!res.ok) throw error(res.status === 429 ? 429 : 502, 'Preview unavailable');
  const body = await res.json().catch(() => null);
  if (!body?.ok) throw error(404, 'Not found');
  setHeaders({ 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'private, no-store' });
  return { view: body.view, expiresAt: body.expiresAt as string, projectId: (body.projectId as string | null) ?? null };
};
