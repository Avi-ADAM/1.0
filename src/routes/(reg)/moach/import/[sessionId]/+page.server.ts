import { error, redirect } from '@sveltejs/kit';
import { loadImportSession } from '$lib/assistant/loadImportSession';
import type { PageServerLoad } from './$types';

/** Review a drafted NEW rikma (docs/PLAN_AI_SIGNUP_CONCIERGE §4.5). */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const session = await loadImportSession(fetch, params.sessionId);
  if (!session) throw error(404, 'Not found');
  // Once the rikma exists the draft lives under it.
  if (session.projectId) throw redirect(303, `/moach/${session.projectId}/import/${session.sessionId}`);
  return { session };
};
