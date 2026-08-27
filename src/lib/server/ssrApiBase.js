import { env } from '$env/dynamic/private';

/**
 * Where server-side rendering sends its own `/api/*` calls.
 *
 * The app is served from Vercel, but Strapi lives behind the SvelteKit API
 * instance on the VPS. As long as an SSR load talks to Strapi itself, Strapi
 * has to stay reachable from the public internet and can never be locked to
 * loopback (see docs/PLAN_PROXY_SECURITY.md §5, §9.5).
 *
 * So SSR goes through the same front door the browser uses. A load calls the
 * relative `/api/send`; `handleFetch` re-points that at `SSR_API_BASE`
 * (`https://api.1lev1.com`) and stamps the internal secret plus the caller's
 * cookies. The VPS instance leaves `SSR_API_BASE` unset, so there its own
 * `/api/*` keeps running in-process — no loop, no extra hop.
 *
 * Rollback is removing the variable: every call falls back to same-origin.
 *
 * @returns {string} base URL with no trailing slash, or '' when disabled
 */
export function ssrApiBase() {
	return (env.SSR_API_BASE || '').trim().replace(/\/+$/, '');
}

/**
 * Decide whether a server-side fetch should be re-pointed at the remote API.
 *
 * Only same-origin `/api/*` qualifies: an absolute URL is already addressed on
 * purpose, and a page route rendered remotely would be meaningless.
 *
 * @param {URL} target - URL the server is about to fetch
 * @param {URL} origin - URL of the request being served (`event.url`)
 * @param {string} base - value of {@link ssrApiBase}
 * @returns {string|null} rewritten URL, or null to leave the fetch alone
 */
export function rewriteToApiBase(target, origin, base) {
	if (!base) return null;
	if (target.origin !== origin.origin) return null;
	if (!target.pathname.startsWith('/api/')) return null;

	let baseUrl;
	try {
		baseUrl = new URL(base);
	} catch {
		return null;
	}
	// This instance *is* the API — keep it in-process rather than looping back
	// out through nginx.
	if (baseUrl.origin === origin.origin) return null;

	return baseUrl.origin + target.pathname + target.search;
}
