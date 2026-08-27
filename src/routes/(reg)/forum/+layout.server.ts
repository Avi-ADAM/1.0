import { redirect } from '@sveltejs/kit';
import { actionViaProxy } from '$lib/server/actionViaProxy.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, fetch, depends, url }) => {
  depends('app:forums');

  if (!locals.uid || !locals.tok) {
    throw redirect(302, `/login?from=${encodeURIComponent(url.pathname)}`);
  }

  // Through /api/action: the identity comes from the cookie the proxy reads,
  // so this load never handles the JWT or addresses Strapi.
  const result = await actionViaProxy(fetch, 'getUserForums', {});

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
