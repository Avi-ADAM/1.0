import { error } from '@sveltejs/kit';
import { loadImportSession } from '$lib/assistant/loadImportSession';
import type { PageServerLoad } from './$types';

/**
 * Review a draft that adds to an existing rikma. The /moach/[projectId]
 * layout has already refused non-members.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const session = await loadImportSession(fetch, params.sessionId);
  if (!session || session.projectId !== params.projectId) throw error(404, 'Not found');
  return { session };
};
