/**
 * GET /api/vocab/list?kind=skills|vallues|roles
 *
 * Returns the published catalog for a vocab kind, with `he` localizations, via
 * the server-side admin token. Public on purpose — these catalogs are read
 * during registration/onboarding before the user has a session — but routed
 * through the proxy so Strapi can be locked to localhost (no direct client
 * GraphQL). Clients cache the result in a store and call this at most once.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { VOCAB_KINDS, isVocabKind } from '$lib/vocab/vocabKinds';

const STRAPI_GRAPHQL = (import.meta.env.VITE_URL ?? 'http://127.0.0.1:1337') + '/graphql';

function adminToken(): string {
	return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const kind = url.searchParams.get('kind');
	if (!isVocabKind(kind)) throw error(400, 'Invalid or missing kind');

	const { collection, nameField } = VOCAB_KINDS[kind];

	const query = `query VocabList {
		${collection}(sort: "${nameField}", pagination: { limit: 1000 }) {
			data {
				id
				attributes {
					${nameField}
					localizations { data { attributes { ${nameField} } } }
				}
			}
		}
	}`;

	try {
		const res = await fetch(STRAPI_GRAPHQL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
			body: JSON.stringify({ query })
		});
		const j = await res.json();
		if (j.errors) {
			console.error('[vocab/list] GraphQL errors:', j.errors);
			throw error(502, 'Upstream error');
		}
		return json({ data: j.data?.[collection]?.data ?? [] });
	} catch (e: any) {
		if (e?.status) throw e;
		console.error('[vocab/list] error:', e);
		throw error(500, 'Failed to load vocab list');
	}
};
