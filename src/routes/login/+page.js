import { safeRedirectTarget } from '$lib/auth/redirectTarget.js';

export async function load({url, data}){
    return{
        ...data,
        // Checked here rather than at each use: after sign-in this value goes
        // straight into `window.location.href`, so an unfiltered one would make
        // /login an open redirect. See $lib/auth/redirectTarget.js.
        // `redirect` is what /oauth/authorize sends (the consent page of an
        // agent connecting); it was never read, so a guest who logged in from
        // the OAuth window landed on /onboard instead of the consent.
        from: safeRedirectTarget(url.searchParams.get('from') ?? url.searchParams.get('redirect'), ''),
        // /confirm-email lands here after a successful email confirmation when
        // there is no session cookie to continue (a different browser/device).
        confirmed: url.searchParams.get('confirmed') === '1',
        // hooks.server.js and the error screens add `expired=1` when they found a
        // dead session, so the page can say why the visitor is here again.
        expired: url.searchParams.get('expired') === '1'
    }
}
