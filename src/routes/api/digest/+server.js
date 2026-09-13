/**
 * `GET /api/digest` — the daily digest run (docs/PLAN_DAILY_DIGEST.md §3.4).
 *
 * **Dry only, for now.** Sending needs the `user-digest` collection (§3.3):
 * without `lastSentAt` a retried cron sends twice, and without `cursor` every
 * morning is a "first digest". Until it exists this endpoint computes and
 * reports, and refuses to send.
 *
 *   GET /api/digest?dry=1                     one page of the audience, summarised
 *   GET /api/digest?dry=1&page=2&pageSize=20  the next page
 *   GET /api/digest?dry=1&uid=123             one user: the full payload + decision
 *   … &force=1                                decide as if forced (skips window + 20h gap)
 *
 * Auth is **required**, not optional like the older cron routes: this walks
 * the site's users. `x-cron-secret` header (or `?key=`), fails closed when
 * CRON_SECRET is unset. The VPS timer calls it on loopback; nginx should not
 * publish the path at all.
 */

import { json } from '@sveltejs/kit';
import { checkCron } from '$lib/server/cronAuth.js';
import { audiencePage, dryRunUser, pool, summarize } from '$lib/server/digest/run.js';

const MAX_PAGE_SIZE = 50;
const CONCURRENCY = 4;

/** @param {string | null} raw @param {number} fallback @param {number} max */
function intParam(raw, fallback, max) {
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

export async function GET({ request, url, fetch }) {
	const auth = checkCron(request, url, { required: true });
	if (!auth.ok) return json({ error: auth.error }, { status: auth.status });

	if (!url.searchParams.has('dry')) {
		return json(
			{
				error: 'sending is not built yet — it needs the user-digest collection (PLAN_DAILY_DIGEST §3.3). Use ?dry=1.'
			},
			{ status: 501 }
		);
	}

	const force = url.searchParams.has('force');
	const now = new Date();
	const started = Date.now();
	const uid = url.searchParams.get('uid');

	try {
		if (uid) {
			if (!/^\d+$/.test(uid)) return json({ error: 'uid must be numeric' }, { status: 400 });
			const result = await dryRunUser(uid, { fetch, now, force, withPayload: true });
			return json({ mode: 'dry', ranAt: now.toISOString(), state: 'none (user-digest not deployed)', ...result });
		}

		const page = intParam(url.searchParams.get('page'), 1, 100000);
		const pageSize = intParam(url.searchParams.get('pageSize'), 20, MAX_PAGE_SIZE);
		const audience = await audiencePage(fetch, page, pageSize);
		const results = await pool(audience.ids, CONCURRENCY, (id) => dryRunUser(id, { fetch, now, force }));
		const summary = summarize(results);

		// One structured line per run — `vector` ships it to Axiom (§8).
		console.log(
			'[digest]',
			JSON.stringify({ mode: 'dry', page, pageSize, ...summary, durationMs: Date.now() - started })
		);

		return json({
			mode: 'dry',
			ranAt: now.toISOString(),
			state: 'none (user-digest not deployed)',
			audience: {
				page: audience.page,
				pageSize: audience.pageSize,
				pageCount: audience.pageCount,
				total: audience.total
			},
			summary,
			users: results.map((r) => ({
				uid: r.uid,
				lang: r.lang,
				isEmpty: r.isEmpty,
				send: r.decision.send,
				reason: r.decision.send ? null : r.decision.reason,
				channels: r.decision.channels,
				counts: r.counts,
				failed: Object.keys(r.failed)
			})),
			durationMs: Date.now() - started
		});
	} catch (err) {
		// A cron that 500s is a cron that gets muted — the failure is data.
		console.error('[digest] dry run failed:', err);
		return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
	}
}
