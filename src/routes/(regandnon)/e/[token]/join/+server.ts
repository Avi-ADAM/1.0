import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminToken } from '$lib/server/adminToken.js';

/**
 * The "join" button (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.1): records that the
 * registrant came and sends them to the room — the Zoom link, or a guest link
 * into our meetings app minted for their email. Outside the session's window
 * it sends them back to their page, which says why.
 */
export const GET: RequestHandler = async ({ params, fetch, locals, setHeaders }) => {
  setHeaders({ 'cache-control': 'private, no-store' });
  const { actionService } = await import('$lib/server/actions/index.js');
  const res: any = await actionService.executeAction(
    'joinEventSession',
    { token: params.token },
    { userId: '', jwt: adminToken(), lang: (locals as any).lang ?? 'he', fetch }
  );
  const back = `/e/${encodeURIComponent(params.token)}`;
  if (!res?.success) redirect(303, back);
  const target = res.data?.url;
  if (typeof target === 'string' && /^https?:\/\//.test(target)) redirect(303, target);
  redirect(303, `${back}?notYet=${encodeURIComponent(String(res.data?.reason ?? 'upcoming'))}`);
};
