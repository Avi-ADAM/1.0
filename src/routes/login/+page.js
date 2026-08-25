import { safeRedirectTarget } from '$lib/auth/redirectTarget.js';

export async function load({url, data}){
    return{
        ...data,
        // Checked here rather than at each use: after sign-in this value goes
        // straight into `window.location.href`, so an unfiltered one would make
        // /login an open redirect. See $lib/auth/redirectTarget.js.
        from: safeRedirectTarget(url.searchParams.get('from'), ''),
        // /confirm-email lands here after a successful email confirmation when
        // there is no session cookie to continue (a different browser/device).
        confirmed: url.searchParams.get('confirmed') === '1',
        // hooks.server.js and the error screens add `expired=1` when they found a
        // dead session, so the page can say why the visitor is here again.
        expired: url.searchParams.get('expired') === '1'
    }
}
