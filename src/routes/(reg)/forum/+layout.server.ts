import { redirect } from '@sveltejs/kit';
import { actionService } from '$lib/server/actions/index.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, fetch, depends, url }) => {
  depends('app:forums');

  if (!locals.uid || !locals.tok) {
    throw redirect(302, `/login?from=${encodeURIComponent(url.pathname)}`);
  }

  const result = await actionService.executeAction(
    'getUserForums',
    {},
    {
      userId: String(locals.uid),
      jwt: String(locals.tok),
      lang: String(locals.lang || 'he'),
      fetch
    }
  );

  if (!result.success) {
    console.error('[forum] Failed to load user forums', result.error);
    return {
      forums: [],
      uid: String(locals.uid),
      un: String(locals.un || ''),
      loadError: result.error?.message || 'Failed to load forums'
    };
  }

  return {
    forums: result.data?.forums || [],
    uid: String(locals.uid),
    un: String(locals.un || ''),
    loadError: null
  };
};
