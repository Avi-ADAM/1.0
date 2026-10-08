/**
 * One more try when the connection to the backend never opened.
 *
 * From some networks the TLS connect to Strapi fails in bursts (`UND_ERR_CONNECT_TIMEOUT`
 * after 10 s), and every such request used to become a 500 — or, through a page load, a
 * "page not found". A request whose connection never opened has not reached Strapi at all,
 * so sending it again is safe even for a mutation. Anything later — a reset after the
 * request went out, a slow answer, an HTTP error — is NOT retried: a mutation may already
 * have run.
 */

/** Connect-phase failures only: nothing was sent. */
const CONNECT_CODES = new Set([
	'UND_ERR_CONNECT_TIMEOUT',
	'ECONNREFUSED',
	'ENOTFOUND',
	'EAI_AGAIN',
	'EHOSTUNREACH',
	'ENETUNREACH'
]);

/** @param {unknown} err */
export function isConnectFailure(err) {
	/** @type {any} */
	const e = err;
	if (!e || e.name === 'AbortError') return false;
	const code = e.cause?.code ?? e.code;
	return typeof code === 'string' && CONNECT_CODES.has(code);
}

/**
 * `fetchFn(url, init)`, sent once more when the first connection never opened.
 * @param {typeof fetch} fetchFn
 * @param {string} url
 * @param {RequestInit} init
 * @param {{ retries?: number, delayMs?: number, onRetry?: (err: unknown, attempt: number) => void }} [opts]
 */
export async function fetchWithConnectRetry(fetchFn, url, init, opts = {}) {
	const retries = opts.retries ?? 1;
	const delayMs = opts.delayMs ?? 500;
	for (let attempt = 0; ; attempt++) {
		try {
			return await fetchFn(url, init);
		} catch (err) {
			if (attempt >= retries || !isConnectFailure(err) || init?.signal?.aborted) throw err;
			opts.onRetry?.(err, attempt + 1);
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
}
