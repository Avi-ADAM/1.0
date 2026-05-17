import { redirect, error } from '@sveltejs/kit';
import { fetchDealsForUser } from '$lib/server/deals/dealsQueries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, '/login?from=deals');
  }

  try {
    const result = await fetchDealsForUser(fetch, tok, String(uid));
    return {
      purchases: result.purchases,
      sales: result.sales,
      pendingBuy: result.pendingBuy,
      pendingSell: result.pendingSell,
      user: {
        username: result.username,
        profilePic: result.profilePic
      }
    };
  } catch (e: any) {
    console.error('[deals/+page.server] Failed to load deals:', e);
    throw error(500, e?.message || 'Failed to load deals');
  }
};
