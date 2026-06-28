// Internal proxy authentication.
//
// Server-side callers (load functions, the Telegram bot, mastra tools, cron)
// reach /api/send and /api/action over HTTP and need to prove the request is
// genuinely server-originated before the endpoint will honour the `isSer`
// flag (which grants the service/admin token). We cannot trust a body flag —
// any browser can set it.
//
// The proof is a header carrying a value derived from ADMINMONTHER, a secret
// that is already required for the app to run and is never exposed to the
// client. handleFetch injects this header on same-origin /api/* requests made
// with the SvelteKit server `fetch`; browser fetches never pass through
// handleFetch, so a client cannot forge it. We send a hash of the secret,
// never the secret itself.

import { ADMINMONTHER } from '$env/static/private';
import { createHash } from 'node:crypto';

export const INTERNAL_HEADER = 'x-internal-secret';

let cached = null;

function normalize(value) {
	return String(value ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

/**
 * Stable per-deployment internal secret derived from ADMINMONTHER.
 * @returns {string} hex digest used as the internal proxy header value
 */
export function getInternalSecret() {
	if (cached) return cached;
	const base = normalize(ADMINMONTHER);
	if (!base) throw new Error('ADMINMONTHER env var is not set; internal secret unavailable');
	cached = createHash('sha256').update(`${base}:internal-proxy:v1`).digest('hex');
	return cached;
}

/**
 * @param {Request} request
 * @returns {boolean} true when the request carries a valid internal secret
 */
export function isInternalRequest(request) {
	const incoming = request.headers.get(INTERNAL_HEADER);
	if (!incoming) return false;
	return incoming === getInternalSecret();
}
