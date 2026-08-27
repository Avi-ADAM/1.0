/**
 * Read Strapi from server code the same way the browser does: through
 * `/api/send`, never against Strapi's GraphQL endpoint.
 *
 * This is the server-side twin of `$lib/send/sendToSer.js`. A load or form
 * action passes its own `event.fetch`; `handleFetch` then decides where that
 * relative URL actually goes — in-process on the VPS, or across to
 * `SSR_API_BASE` when the page is rendered on Vercel. Either way the request
 * carries the internal secret and the caller's cookies, so the proxy resolves
 * the same principal, runs the same static authorization and the same
 * entity-level guards a browser request would get.
 *
 * See docs/PLAN_PROXY_SECURITY.md §11 and $lib/server/ssrApiBase.js.
 */

/**
 * @typedef {(input: any, init?: any) => Promise<Response>} FetchLike
 */

/**
 * POST a whitelisted query to the /api/send proxy.
 *
 * @template [T=any]
 * @param {FetchLike} fetchFn - `event.fetch` from the load / action
 * @param {string} queId - key in src/routes/api/send/qids.js
 * @param {Record<string, unknown>} [arg] - GraphQL variables
 * @param {{ isSer?: boolean, signal?: AbortSignal }} [opts]
 *   `isSer` runs the query with the service token — for anonymous pages that
 *   have no cookie to authenticate with. It is honoured only because
 *   `handleFetch` stamps the internal secret; a browser cannot ask for it.
 * @returns {Promise<T>} the GraphQL `data` object
 * @throws {Error} when the proxy rejects the call or GraphQL reports errors
 */
export async function sendViaProxy(fetchFn, queId, arg = {}, opts = {}) {
	const res = await fetchFn('/api/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ isSer: opts.isSer === true, data: { queId, arg } }),
		signal: opts.signal
	});

	if (!res.ok) {
		// The proxy answers with SvelteKit's error shape; keep whatever detail
		// it gave, since the caller's own catch is what turns this into a page.
		let detail = '';
		try {
			const body = await res.json();
			detail = body?.message || body?.error || '';
		} catch {
			/* non-JSON body — the status is all we have */
		}
		throw new Error(`/api/send ${queId} failed: ${res.status}${detail ? ` ${detail}` : ''}`);
	}

	const body = await res.json();
	if (body?.errors?.length) {
		throw new Error(body.errors[0]?.message || `GraphQL error in ${queId}`);
	}
	return body?.data;
}
