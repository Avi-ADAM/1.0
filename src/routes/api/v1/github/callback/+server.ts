import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService } from '$lib/server/actions/index.js';
import { appInstallUrl, githubAppConfig } from '$lib/server/github/config.js';
import {
  STATE_COOKIE,
  STATE_TTL_MS,
  createPickToken,
  createState,
  pickKey,
  readState,
  stateKey
} from '$lib/server/github/state.js';
import { exchangeCode, getGithubUser, listUserInstallationIds } from '$lib/server/github/client.js';
import { isProjectMember, serviceContext } from '$lib/server/github/service.js';

/**
 * GET /api/v1/github/callback — where GitHub sends the member back, for both
 * the account link and the App install (both start at OAuth; see /connect).
 *
 * Nothing in the query string is trusted by itself:
 *  - who started the flow, and for which rikma → the signed cookie, which must
 *    belong to the member who is signed in now;
 *  - which GitHub account they own → exchanging `code` and asking GitHub;
 *  - which installations are theirs → `/user/installations` with that token.
 *
 * A GitHub identity is linked only when the OAuth `state` came back matching
 * the cookie. GitHub may return from an install without `state`; the
 * installations are still verified, but no identity is linked from it. The
 * user's token is used inside this request and never stored.
 *
 * An install attaches nothing by itself. GitHub's install screen offers "All
 * repositories", and a member who chose it used to find every repository on
 * their account connected to the rikma. The callback only verifies, then hands
 * the code tab a signed pick token; the member chooses the one repository to
 * connect there (`/api/v1/github/pick`).
 *
 * A member who has no installation of the App yet is sent on to GitHub's
 * install screen — with a fresh state cookie, because this one is spent —
 * and arrives back here with an `installation_id`.
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

  if (outcome === 'needsInstall') {
    const fresh = createState(
      {
        uid: state.uid,
        intent: state.intent,
        projectId: state.projectId,
        returnOrigin: state.returnOrigin
      },
      stateKey(cfg.clientSecret)
    );
    cookies.set(STATE_COOKIE, fresh.value, {
      path: '/api/v1/github',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: Math.floor(STATE_TTL_MS / 1000)
    });
    throw redirect(303, appInstallUrl(cfg, fresh.state.nonce));
  }

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

      // Every installation this member can reach. `installation_id` — present
      // when they just came off the install screen — narrows it to that one,
      // and is only believed because it appears in this list.
      const ids = await listUserInstallationIds(token, fetch);
      const fromInstall = url.searchParams.get('installation_id') ?? '';
      let installationIds: string[];
      if (/^\d+$/.test(fromInstall)) {
        if (!ids.includes(fromInstall)) return 'invalid';
        installationIds = [fromInstall];
      } else {
        installationIds = ids;
      }
      // Nothing installed yet — that is what the install screen is for.
      if (installationIds.length === 0) return 'needsInstall';

      // Membership can change in the minutes the member spent on GitHub.
      if (!(await isProjectMember(state!.projectId!, state!.uid, fetch))) return 'wrongUser';

      pickToken = createPickToken(
        { uid: state!.uid, projectId: state!.projectId!, installationIds },
        pickKey(cfg!.clientSecret)
      );
      return 'pick';
    } catch (e) {
      console.error('[github/callback] failed:', e);
      return 'failed';
    }
  }
};
