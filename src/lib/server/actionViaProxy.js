/**
 * Run an action from server code through `/api/action`, rather than calling
 * `actionService.executeAction` in-process.
 *
 * In-process execution reaches Strapi from wherever the page happens to be
 * rendered — on Vercel that means Strapi must stay open to the public
 * internet. Going through the endpoint keeps the Strapi connection on the one
 * instance that owns it; `handleFetch` decides whether that is this process or
 * `SSR_API_BASE`, and carries the internal secret plus the caller's cookies
 * either way.
 *
 * The result is the same `{ success, data, error }` shape `executeAction`
 * returns, so a call site only changes its import.
 *
 * See docs/PLAN_PROXY_SECURITY.md §11 and $lib/server/ssrApiBase.js.
 */

/**
 * @typedef {(input: any, init?: any) => Promise<Response>} FetchLike
 */

/**
 * @param {FetchLike} fetchFn - `event.fetch` from the load / action
 * @param {string} actionKey - key in the action registry
 * @param {Record<string, unknown>} [params]
 * @param {{ isSer?: boolean }} [opts]
 *   `isSer` runs the action with the admin token as `params.userId`, for
 *   server work with no user session. Honoured only because `handleFetch`
 *   stamps the internal secret; a browser cannot ask for it.
 * @returns {Promise<{ success: boolean, data?: any, updateStrategy?: any, error?: { code?: string, message?: string } }>}
 */
export async function actionViaProxy(fetchFn, actionKey, params = {}, opts = {}) {
	let res;
	try {
		res = await fetchFn('/api/action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ actionKey, params, isSer: opts.isSer === true })
		});
	} catch (e) {
		return {
			success: false,
			error: { code: 'PROXY_UNREACHABLE', message: e instanceof Error ? e.message : String(e) }
		};
	}

	// A failed action answers with its own status and an `{ success: false }`
	// body — that is a result, not a transport error. Only an unparseable body
	// has to be turned into one.
	try {
		const body = await res.json();
		if (typeof body?.success === 'boolean') return body;
		return {
			success: false,
			error: { code: 'PROXY_ERROR', message: body?.message || `/api/action ${actionKey}: ${res.status}` }
		};
	} catch {
		return {
			success: false,
			error: { code: 'PROXY_ERROR', message: `/api/action ${actionKey}: ${res.status}` }
		};
	}
}
