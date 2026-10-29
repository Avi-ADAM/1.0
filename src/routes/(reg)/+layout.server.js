import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { parseSpaceSyncProjects } from '$lib/space/syncFlag';

export function load({ locals, url }) {
    const tok = locals.tok;

    // Server-side auth guard: redirect unauthenticated users to login
    // before the page renders, eliminating the login-wall flash/loop.
    if (!tok) {
        throw redirect(303, `/login?from=${url.pathname}`);
    }

    const userAgent = locals.userAgent;
    const un = locals.un;
    const from = url.pathname;
    const uid = locals.uid;
    console.log(from);
    return {
        userAgent,
        // SECURITY: expose only a boolean login flag — never the raw JWT. The
        // token stays in the HttpOnly cookie (used above for the redirect guard);
        // the client uses `tok` as a login flag and the socket authenticates from
        // the cookie.
        tok: !!tok,
        from,
        un,
        uid,
        // The session could not be checked this time (network) — not a sign-out.
        identityUnreachable: !uid && locals.identityUnreachable === true,
        // A1 (PLAN_DISTRIBUTED_EXECUTION): the pilot rikmas that run on the
        // Space. Project ids, not a secret; empty = off everywhere.
        spaceSyncProjects: parseSpaceSyncProjects(env.SPACE_SYNC_PROJECTS)
    };
}