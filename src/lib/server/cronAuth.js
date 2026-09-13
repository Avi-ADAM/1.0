// Cron endpoint authentication (PLAN_DAILY_DIGEST §3.4 / S1, TIMEGRAMA B10.2).
//
// The existing cron routes guard themselves with `CRON_SECRET` only *when it is
// set* (`/api/cron/maagad`, `/api/cron/translate-backfill`) and `/api/timegrama`
// not at all. That is survivable for a job that clusters wishes; it is not for
// one that walks every user on the site. So there are two modes:
//
//   - `required: true`  — fails closed. No CRON_SECRET configured means no
//                          access, not open access. Use it for anything that
//                          enumerates users or sends on their behalf.
//   - `required: false` — the legacy behaviour, for the existing routes to
//                          adopt without breaking a scheduler that does not
//                          send a secret yet.
//
// The secret is accepted from the `x-cron-secret` header (preferred — a query
// string ends up in access logs) or `?key=` (what scripts/scheduler sends
// today). Compared in constant time.

import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'node:crypto';

export const CRON_HEADER = 'x-cron-secret';

/** @param {string} a @param {string} b */
function safeEqual(a, b) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * @param {Request} request
 * @param {URL} url
 * @param {{ required?: boolean, secret?: string }} [opts] `secret` is for tests
 * @returns {{ ok: boolean, status: 200 | 401 | 503, error: string | null }}
 */
export function checkCron(request, url, { required = true, secret = env.CRON_SECRET || '' } = {}) {
	if (!secret) {
		return required
			? { ok: false, status: 503, error: 'CRON_SECRET is not configured on this server' }
			: { ok: true, status: 200, error: null };
	}
	const given = request.headers.get(CRON_HEADER) || url.searchParams.get('key') || '';
	if (!given || !safeEqual(given, secret)) {
		return { ok: false, status: 401, error: 'unauthorized' };
	}
	return { ok: true, status: 200, error: null };
}
