import { redirect, error } from '@sveltejs/kit';
import { fetchSingleDeal } from '$lib/server/deals/dealsQueries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;
  const un = (locals as any).un as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, '/login?from=deals/' + params.id);
  }

  try {
    const result = await fetchSingleDeal(fetch, tok, String(uid), params.id, un);
    return {
      sale: result.sale,
      kind: result.kind
    };
  } catch (e: any) {
    console.error('[deals/[id]/+page.server] Failed to load deal:', e);
    throw error(500, e?.message || 'Failed to load deal');
  }
};
