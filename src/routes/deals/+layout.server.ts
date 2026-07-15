import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Shared auth guard for /deals and its children (sales-center, request, [id]).
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const tok = (locals as any).tok as string | undefined;
  const uid = (locals as any).uid as string | undefined;

  if (!tok || !uid) {
    throw redirect(302, `/login?from=${url.pathname}`);
  }

  return { tok, uid };
};
