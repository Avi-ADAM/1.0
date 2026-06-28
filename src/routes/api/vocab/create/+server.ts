/**
 * POST /api/vocab/create   Body: { kind, label, lang, createdBy? }
 *
 * The single, server-side path for creating a new vocab item (skill / value /
 * role / workway) from anywhere in the app. Creating server-side (admin token) means it
 * works during anonymous registration, keeps Strapi off the client, and makes
 * moderation impossible to bypass.
 *
 * Flow: create → moderate (archive + owner alert if flagged) → if clean, upsert
 * the semantic vector + ping the owner channel. Translation to all locales is
 * triggered by the client after this returns (kept browser-side so the slow job
 * isn't cut short by the server response).
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { VOCAB_KINDS, isVocabKind } from '$lib/vocab/vocabKinds';
import { embedText } from '$lib/embed/gemini-embeddings';
import { upsertVectors } from '$lib/embed/pinecone';
import { moderateVocabItem } from '$lib/server/vocab/moderation';

const STRAPI_GRAPHQL = (import.meta.env.VITE_URL ?? 'http://127.0.0.1:1337') + '/graphql';

function adminToken(): string {
	return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

/** Conservative server-side sanitize: strip control chars, collapse whitespace. */
function sanitize(label: string): string {
	const stripControl = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');
	return String(label ?? '')
		.replace(stripControl, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	const body = await request.json().catch(() => ({}));
	const { kind, lang } = body;
	const label = sanitize(body?.label);
	const createdBy = body?.createdBy ? String(body.createdBy) : undefined;
	const description =
		typeof body?.description === 'string' ? body.description.replace(/\s+/g, ' ').trim().slice(0, 500) : '';
	const relations = body?.relations && typeof body.relations === 'object' ? body.relations : {};

	if (!isVocabKind(kind)) throw error(400, 'Invalid or missing kind');
	if (!label) throw error(400, 'Missing label');
	if (label.length > 80) throw error(400, 'Label too long');

	const meta = VOCAB_KINDS[kind];
	const now = new Date().toISOString();

	// 1 — create. Field/mutation/relation names come from our own config (never
	// from the client); all values are passed as GraphQL variables.
	const varDecls = ['$name: String!', '$now: DateTime!'];
	const dataFields = [`${meta.nameField}: $name`, 'publishedAt: $now'];
	const variables: Record<string, unknown> = { name: label, now };

	if (meta.descriptionField && description) {
		varDecls.push('$description: String');
		dataFields.push(`${meta.descriptionField}: $description`);
		variables.description = description;
	}

	for (const field of meta.relationFields ?? []) {
		const ids = relations[field];
		if (Array.isArray(ids) && ids.length) {
			varDecls.push(`$rel_${field}: [ID]`);
			dataFields.push(`${field}: $rel_${field}`);
			variables[`rel_${field}`] = ids.map(String);
		}
	}

	const createQuery = `mutation CreateVocab(${varDecls.join(', ')}) {
		${meta.createMutation}(data: { ${dataFields.join(', ')} }) {
			data {
				id
				attributes {
					${meta.nameField}
					localizations { data { attributes { ${meta.nameField} } } }
				}
			}
		}
	}`;

	let created;
	try {
		const res = await fetch(STRAPI_GRAPHQL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
			body: JSON.stringify({ query: createQuery, variables })
		});
		const j = await res.json();
		if (j.errors) {
			console.error('[vocab/create] GraphQL errors:', j.errors);
			throw error(502, 'Upstream error creating item');
		}
		created = j.data?.[meta.createMutation]?.data;
	} catch (e: any) {
		if (e?.status) throw e;
		console.error('[vocab/create] error:', e);
		throw error(500, 'Failed to create item');
	}

	if (!created?.id) throw error(502, 'Upstream returned no item');
	const id = String(created.id);

	// 2 — moderate (archives + alerts owner if flagged); never throws
	const moderation = await moderateVocabItem(fetch, { kind, id, label, createdBy, extraText: description });

	// 3 — clean items only: index for semantic dup-detection + ping owner channel
	if (!moderation.flagged) {
		try {
			const vector = await embedText(label);
			await upsertVectors(meta.pineconeNamespace, [
				{ id, values: vector, metadata: { label, category: meta.pineconeNamespace, strapiId: id } }
			]);
		} catch (e) {
			console.warn('[vocab/create] vector upsert failed:', e);
		}

		try {
			await fetch('/api/ste', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: createdBy || 'user', action: meta.telemetryVerb, det: label })
			});
		} catch (e) {
			console.warn('[vocab/create] owner telemetry failed:', e);
		}
	}

	return json({
		success: true,
		item: { id, label, attributes: created.attributes },
		// the client fires /api/translations only for clean items that have an
		// auto-translation content type (workways, like legacy, has none)
		translate: !moderation.flagged && meta.translationContentType
			? { contentType: meta.translationContentType, entryId: id, sourceLocale: lang }
			: null,
		moderation
	});
};
