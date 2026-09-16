import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { githubAppConfig } from '$lib/server/github/config.js';
import { STATE_COOKIE, STATE_TTL_MS, createState, stateKey } from '$lib/server/github/state.js';
import { isProjectMember } from '$lib/server/github/service.js';
import { isAllowedFrontendOrigin } from '$lib/server/corsOrigins.js';

/**
 * GET /api/v1/github/connect?intent=link
 * GET /api/v1/github/connect?intent=install&projectId=…
 *
 * Starts one of the two GitHub flows (PLAN_CODE_RIKMA §3). Identity comes from
 * the signed JWT (`locals.uid`), never from the query string; the rikma is
 * checked for membership here and again on the way back. What the callback
 * may trust is written into a signed, short-lived cookie before leaving.
 *
 * **Both intents go to OAuth, not to the install screen.** Sending a member
 * straight to `installations/new` works once: after that GitHub shows the
 * App's settings page for the existing installation, and someone who has
 * nothing to change there has no button that returns them to 1lev1 — they
 * press back and never reach the repository picker. So the flow asks GitHub
 * who they are first; the callback then either offers the repositories of the
 * installations they already have, or sends them on to install the App.
 */
export const GET: RequestHandler = async ({ url, locals, cookies, fetch }) => {
  if (!locals.uid) throw error(401, 'Sign in to connect GitHub');
  const cfg = githubAppConfig();
  if (!cfg) throw error(503, 'The GitHub integration is not configured on this server');

  const uid = String(locals.uid);
  const intent = url.searchParams.get('intent') === 'install' ? 'install' : 'link';
  let projectId: string | undefined;

  if (intent === 'install') {
    projectId = url.searchParams.get('projectId') ?? '';
    if (!/^\d+$/.test(projectId)) throw error(400, 'projectId is required');
    if (!(await isProjectMember(projectId, uid, fetch))) {
      throw error(403, 'Only members of the rikma can connect its code');
    }
  }

  // In production this route runs on api.1lev1.com while the member came from
  // www.1lev1.com. `return` names that origin; only an allowed frontend origin
  // is kept, so the callback cannot be turned into an open redirect.
  const ret = url.searchParams.get('return');
  const returnOrigin = ret && isAllowedFrontendOrigin(ret) ? new URL(ret).origin : undefined;

  const { value, state } = createState(
    { uid, intent, projectId, returnOrigin },
    stateKey(cfg.clientSecret)
  );
  cookies.set(STATE_COOKIE, value, {
    path: '/api/v1/github',
    httpOnly: true,
    // `lax` is sent on GitHub's top-level redirect back to the callback.
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: Math.floor(STATE_TTL_MS / 1000)
  });

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', cfg.clientId);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/v1/github/callback`);
  authorize.searchParams.set('state', state.nonce);
  throw redirect(303, authorize.toString());
};
