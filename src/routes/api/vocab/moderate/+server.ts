/**
 * POST /api/vocab/moderate
 *
 * The standalone moderation check. Two modes:
 *   { label }              → dry-run: returns the screen verdict, no side effects
 *   { kind, id, label }    → screens an existing item; archives + alerts the
 *                            owner if flagged (idempotent, safe to re-run)
 *
 * Intended for cron sweeps or a manual owner re-check, complementing the inline
 * screening done by /api/vocab/create.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isVocabKind } from '$lib/vocab/vocabKinds';
import { screenLabel, moderateVocabItem } from '$lib/server/vocab/moderation';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const body = await request.json().catch(() => ({}));
	const label = String(body?.label ?? '').trim();
	if (!label) throw error(400, 'Missing label');

	// dry-run
	if (body?.id == null) {
		return json({ ...screenLabel(label), dryRun: true });
	}

	if (!isVocabKind(body.kind)) throw error(400, 'Invalid or missing kind');

	const outcome = await moderateVocabItem(fetch, {
		kind: body.kind,
		id: String(body.id),
		label,
		createdBy: body?.createdBy ? String(body.createdBy) : undefined
	});
	return json(outcome);
};
