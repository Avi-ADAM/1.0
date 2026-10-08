import { redirect } from '@sveltejs/kit';
import { loadDealNotices } from '$lib/server/deal/dealNotices';
import type { LayoutServerLoad } from './$types';

// Shared auth guard for /deals and its children (sales-center, request, [id]).
export const load: LayoutServerLoad = async ({ locals, url, fetch }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, `/login?from=${url.pathname}`);
  }

  // The header bell's notices (PLAN_SMART_NOTICES §6.2) — streamed, so the
  // page never waits for them; a read per recent deal sits behind it.
  return { tok, uid, dealNotices: loadDealNotices(uid, fetch) };
};
