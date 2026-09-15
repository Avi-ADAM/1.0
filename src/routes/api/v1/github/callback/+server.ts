import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService } from '$lib/server/actions/index.js';
import { githubAppConfig } from '$lib/server/github/config.js';
import { STATE_COOKIE, createPickToken, pickKey, readState, stateKey } from '$lib/server/github/state.js';
import { exchangeCode, getGithubUser, userCanAccessInstallation } from '$lib/server/github/client.js';
import { isProjectMember, serviceContext } from '$lib/server/github/service.js';

/**
 * GET /api/v1/github/callback — where GitHub sends the member back, for both
 * the account link (OAuth) and the App install ("Request user authorization
 * during installation" must be on, so an install also arrives with a `code`).
 *
 * Nothing in the query string is trusted by itself:
 *  - who started the flow, and for which rikma → the signed cookie, which must
 *    belong to the member who is signed in now;
 *  - which GitHub account they own → exchanging `code` and asking GitHub;
 *  - that `installation_id` is theirs → `/user/installations` with that token.
 *
 * A GitHub identity is linked only when the OAuth `state` came back matching
 * the cookie. GitHub may return from an install without `state`; the
 * installation is still verified after the checks above, but no identity is
 * linked from it. The user's token is used inside this request and never stored.
 *
 * An install attaches nothing by itself. GitHub's install screen offers "All
 * repositories", and a member who chose it used to find every repository on
 * their account connected to the rikma. The callback only verifies, then hands
 * the code tab a signed pick token; the member chooses the one repository to
 * connect there (`/api/v1/github/pick`).
 */
export const GET: RequestHandler = async ({ url, locals, cookies, fetch }) => {
  const cfg = githubAppConfig();
  const state = cfg ? readState(cookies.get(STATE_COOKIE), stateKey(cfg.clientSecret)) : null;
  cookies.delete(STATE_COOKIE, { path: '/api/v1/github' });

  if (!cfg || !state) throw redirect(303, '/me/settings?github=expired');

  // Back to the frontend the member started from (validated at /connect);
  // without one, a relative redirect stays on this host.
  const back =
    (state.returnOrigin ?? '') +
    (state.intent === 'install' ? `/moach/${state.projectId}/code` : '/me/settings');
  let pickToken = '';
  const outcome = await settle();
  const pick = pickToken ? `&pick=${encodeURIComponent(pickToken)}` : '';
  throw redirect(303, `${back}?github=${outcome}${pick}`);

  async function settle(): Promise<string> {
    if (!locals.uid || String(locals.uid) !== state!.uid) return 'wrongUser';
    if (url.searchParams.get('error')) return 'denied';

    const returned = url.searchParams.get('state');
    if (returned && returned !== state!.nonce) return 'invalid';
    const stateMatched = returned === state!.nonce;
    if (state!.intent === 'link' && !stateMatched) return 'invalid';

    const code = url.searchParams.get('code');
    if (!code) return state!.intent === 'install' ? 'noInstallation' : 'invalid';

    const ctx = serviceContext(state!.uid, fetch);
    try {
      const token = await exchangeCode(cfg!, code, `${url.origin}/api/v1/github/callback`, fetch);
      const ghUser = await getGithubUser(token, fetch);

      if (stateMatched) {
        const linked = await actionService.executeAction(
          'linkGithubAccount',
          { userId: state!.uid, githubId: ghUser.id, githubLogin: ghUser.login },
          ctx
        );
        if (!linked.success) {
          console.warn('[github/callback] identity not linked:', linked.error?.message);
          if (state!.intent === 'link') return 'taken';
        }
      }
      if (state!.intent === 'link') return 'linked';

      const installationId = url.searchParams.get('installation_id') ?? '';
      if (!/^\d+$/.test(installationId)) return 'noInstallation';
      if (!(await userCanAccessInstallation(token, installationId, fetch))) return 'invalid';
      // Membership can change in the minutes the member spent on GitHub.
      if (!(await isProjectMember(state!.projectId!, state!.uid, fetch))) return 'wrongUser';

      pickToken = createPickToken(
        { uid: state!.uid, projectId: state!.projectId!, installationId },
        pickKey(cfg!.clientSecret)
      );
      return 'pick';
    } catch (e) {
      console.error('[github/callback] failed:', e);
      return 'failed';
    }
  }
};
