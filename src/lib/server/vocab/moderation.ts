/**
 * Vocabulary moderation.
 *
 * New vocab items (skills / values / roles) are created immediately so the UX
 * stays instant, then screened. Anything that looks problematic is *archived*
 * (unpublished in Strapi — kept, but invisible to public published queries) and
 * the site owner gets a Telegram alert so they can re-publish or delete it.
 *
 * The screen is deterministic and dependency-free (no external LLM call), so it
 * always runs. It targets the signals that actually matter for a shared
 * catalog: links, contact details, spam/garbage, and an extensible word list.
 */

import { env } from '$env/dynamic/private';
import { VOCAB_KINDS, type VocabKind } from '$lib/vocab/vocabKinds';

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

function adminToken(): string {
	return String(env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');
}

// ─── Screening ──────────────────────────────────────────────────────────────

export interface ScreenResult {
	flagged: boolean;
	/** machine-readable reasons, e.g. ['link', 'contact'] */
	reasons: string[];
}

// Extensible block list. Keep deliberately small and obvious; structural signals
// below catch most abuse regardless of language.
const BLOCKED_WORDS = [
	// add explicit slurs / disallowed terms here (he / en / ar) as needed
];

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ru|biz|info|xyz)\b)/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /(?:\+?\d[\s-]?){7,}/;
const REPEAT_RE = /(.)\1{4,}/; // same char 5+ times → "aaaaaa"

/**
 * Screen a free-text string. Pure function — no I/O. `checkLength` is on for
 * short labels; turn it off for longer free-text like descriptions.
 */
export function screenLabel(label: string, opts: { checkLength?: boolean } = {}): ScreenResult {
	const { checkLength = true } = opts;
	const reasons: string[] = [];
	const text = (label ?? '').trim();
	const lower = text.toLowerCase();

	if (!text) reasons.push('empty');
	if (checkLength && text.length > 60) reasons.push('too_long');
	if (URL_RE.test(text)) reasons.push('link');
	if (EMAIL_RE.test(text)) reasons.push('contact');
	if (PHONE_RE.test(text)) reasons.push('contact');
	if (REPEAT_RE.test(text)) reasons.push('spam');
	if (BLOCKED_WORDS.some((w) => w && lower.includes(w.toLowerCase()))) reasons.push('blocked_word');

	return { flagged: reasons.length > 0, reasons };
}

// ─── Strapi: archive (unpublish) ──────────────────────────────────────────────

async function gql(fetchFn: typeof fetch, query: string, variables: Record<string, unknown>) {
	const res = await fetchFn(STRAPI_GRAPHQL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
		body: JSON.stringify({ query, variables })
	});
	const j = await res.json();
	if (j.errors) throw new Error(j.errors[0]?.message ?? 'GraphQL error');
	return j.data;
}

/** Unpublish an entry (publishedAt = null) without deleting it. */
export async function archiveEntry(kind: VocabKind, id: string, fetchFn: typeof fetch) {
	const meta = VOCAB_KINDS[kind];
	const updateMutation = meta.createMutation.replace(/^create/, 'update');
	const query = `mutation Archive($id: ID!) {
		${updateMutation}(id: $id, data: { publishedAt: null }) { data { id } }
	}`;
	return gql(fetchFn, query, { id });
}

// ─── Telegram owner alert ─────────────────────────────────────────────────────

const OWNER_LABELS: Record<VocabKind, string> = {
	skills: 'כישור',
	vallues: 'ערך',
	roles: 'תפקיד',
	workways: 'דרך יצירה'
};

/**
 * Notify the site owner that a flagged item was archived. Uses the existing
 * owner channel (NEW_TELEGRAM chat + TELEGRAM_BOT_TOKEN_NEW). Best-effort.
 */
export async function notifyOwnerFlagged(
	fetchFn: typeof fetch,
	args: { kind: VocabKind; id: string; label: string; reasons: string[]; createdBy?: string }
) {
	const token = String(env.TELEGRAM_BOT_TOKEN_NEW ?? '').trim();
	const chatId = String(env.NEW_TELEGRAM ?? '').trim();
	if (!token || !chatId) {
		console.warn('[vocab/moderation] Telegram owner channel not configured; skipping alert');
		return;
	}

	const kindLabel = OWNER_LABELS[args.kind];
	const text = [
		`⚠️ <b>${kindLabel} חדש סומן ועבר לארכיב</b>`,
		`"${args.label}"`,
		`סיבה: ${args.reasons.join(', ')}`,
		args.createdBy ? `נוצר ע"י: ${args.createdBy}` : '',
		`מזהה: ${args.kind}#${args.id}`,
		'',
		'בדוק ובמידת הצורך פרסם מחדש או מחק.'
	]
		.filter(Boolean)
		.join('\n');

	try {
		const res = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
		});
		if (!res.ok) console.warn('[vocab/moderation] Telegram alert failed:', res.status);
	} catch (e) {
		console.warn('[vocab/moderation] Telegram alert error:', e);
	}
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface ModerationOutcome {
	flagged: boolean;
	archived: boolean;
	reasons: string[];
}

/**
 * Screen a (possibly already-created) vocab item; archive + alert if flagged.
 * Never throws — moderation must not break the create flow.
 */
export async function moderateVocabItem(
	fetchFn: typeof fetch,
	args: { kind: VocabKind; id: string; label: string; createdBy?: string; extraText?: string }
): Promise<ModerationOutcome> {
	const labelScreen = screenLabel(args.label);
	const descScreen = args.extraText ? screenLabel(args.extraText, { checkLength: false }) : { flagged: false, reasons: [] };
	const reasons = [...new Set([...labelScreen.reasons, ...descScreen.reasons])];
	const screen = { flagged: reasons.length > 0, reasons };
	if (!screen.flagged) return { flagged: false, archived: false, reasons: [] };

	let archived = false;
	try {
		await archiveEntry(args.kind, args.id, fetchFn);
		archived = true;
	} catch (e) {
		console.error('[vocab/moderation] archive failed:', e);
	}

	await notifyOwnerFlagged(fetchFn, { ...args, reasons: screen.reasons });

	return { flagged: true, archived, reasons: screen.reasons };
}
