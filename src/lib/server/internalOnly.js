// Gate for endpoints only the server itself may call.
//
// /api/sendMail took any recipient and any HTML and sent it as
// notifications@1lev1.com — an open relay. One afternoon of someone else's
// spam through it is enough for Zoho to answer `550 5.4.6` and block the whole
// account (see $lib/server/mailer.js), which is how mail was already lost for
// two months once. The nuti* and sma endpoints were the same hole with a
// template in front, and since they call /api/sendMail through the SvelteKit
// fetch, handleFetch stamped them internal on the way: gating sendMail alone
// would have left them as a way around it.
//
// Every caller of these endpoints is server code using the SvelteKit `fetch`,
// which handleFetch stamps with the internal secret (hooks.server.js). A
// browser fetch never passes through handleFetch, so it cannot carry it.
// There is deliberately no "logged-in user" path: signing up is free, so a
// relay open to any account is still an open relay. A user-originated mail
// belongs in an action (src/lib/server/actions/) that decides the recipient
// and the words itself.

import { isInternalRequest } from '$lib/server/internalSecret.js';

/**
 * `null` when the request was made by this server; otherwise the 403 to
 * return. Never throws — a missing ADMINMONTHER fails closed.
 *
 * @param {Request} request
 * @param {string} route  for the log line
 * @returns {Response | null}
 */
export function rejectUnlessInternal(request, route) {
	let internal = false;
	try {
		internal = isInternalRequest(request);
	} catch (e) {
		console.error(`[${route}] internal secret unavailable, refusing:`, e);
	}
	if (internal) return null;
	console.warn(`[${route}] refused a request without the internal secret`);
	return new Response(JSON.stringify({ error: 'Forbidden' }), {
		status: 403,
		headers: { 'Content-Type': 'application/json' }
	});
}
