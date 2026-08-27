import { redirect } from '@sveltejs/kit';
import { actionViaProxy } from '$lib/server/actionViaProxy.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch, depends }) => {
  depends(`app:forum:${params.forumId}`);

  if (!locals.uid || !locals.tok) {
    throw redirect(302, `/login?from=${encodeURIComponent(`/forum/${params.forumId}`)}`);
  }

  // Through /api/action: the identity comes from the cookie the proxy reads,
  // so this load never handles the JWT or addresses Strapi.
  const result = await actionViaProxy(fetch, 'getForumThread', {
    forumId: String(params.forumId)
  });

  if (!result.success || !result.data?.forum) {
    throw redirect(302, '/forum?forum=blocked');
  }

  return {
    forum: result.data.forum,
    uid: String(locals.uid),
    un: String(locals.un || '')
  };
};
