import { redirect } from '@sveltejs/kit';
import { actionService } from '$lib/server/actions/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch, depends }) => {
  depends(`app:forum:${params.forumId}`);

  if (!locals.uid || !locals.tok) {
    throw redirect(302, `/login?from=${encodeURIComponent(`/forum/${params.forumId}`)}`);
  }

  const result = await actionService.executeAction(
    'getForumThread',
    { forumId: String(params.forumId) },
    {
      userId: String(locals.uid),
      jwt: String(locals.tok),
      lang: String(locals.lang || 'he'),
      fetch
    }
  );

  if (!result.success || !result.data?.forum) {
    throw redirect(302, '/forum?forum=blocked');
  }

  return {
    forum: result.data.forum,
    uid: String(locals.uid),
    un: String(locals.un || '')
  };
};
