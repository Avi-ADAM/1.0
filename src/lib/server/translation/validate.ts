/**
 * Validation of machine-translation output (§5.5 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * **A model response is untrusted input.** It is the one place in this system
 * where text nobody wrote and nobody reviewed is about to be stored under a
 * member's name and shown to a stranger as what that member said. So the
 * prompt *suggests* and this file *decides*.
 *
 * A row that fails any check is not stored, and not retried in the same run.
 * The site renders the author's own words. That is the whole failure mode —
 * the reader sees exactly what they see today, and nobody sees an error.
 *
 * The five checks, in the order they are cheapest to run:
 *
 * 1. **shape** — a malformed batch fails whole, never half-stored;
 * 2. **mixed script** — the characteristic LLM failure for this language mix
 *    (a Cyrillic letter inside a Hebrew word). It renders as garbage, it
 *    reorders the RTL run, and nothing else on the site would catch it. The
 *    rule is shared with `npm run check:script`, not copied;
 * 3. **glossary** — the domain nouns must survive (§6);
 * 4. **length** — an output several times its source is a hallucination, an
 *    apology, or a refusal, not a translation;
 * 5. **markup** — the source is plain text, so tags came from the model.
 */

import { corruptedWords } from '$lib/translation/mixedScript.js';
import { glossaryViolations } from '$lib/translation/glossary.js';
import { normalizeForHash } from '$lib/translation/normalize.js';
import { detectScript, SCRIPT_OF } from '$lib/translation/detect.js';
import type { Locale, TranslationMode } from '$lib/translation/types.js';

export type RejectReason =
    | 'empty'
    | 'mixed-script'
    | 'glossary'
    | 'too-long'
    | 'too-short'
    | 'markup'
    | 'wrong-script'
    | 'unchanged';

export interface ValidationResult {
    ok: boolean;
    /** Every reason it failed, not just the first — one log line, whole story. */
    reasons: RejectReason[];
    /** Human-readable detail for the log. Never shown to a reader. */
    detail?: string;
}

/**
 * An output more than this many times its source is not a translation.
 *
 * Generous on purpose: Hebrew is compact and Russian is not, and `רקמה` legitimately
 * becomes `rikma (partnership)`. What this catches is the model that answered
 * with a paragraph of explanation, or apologised at length for being unable to
 * translate — both of which are otherwise perfectly well-formed strings.
 */
const MAX_GROWTH = 3;

/** Below this, "3× the source" is meaningless — `לב` may become 22 characters. */
const SHORT_SOURCE = 24;
const SHORT_SOURCE_ALLOWANCE = 80;

/** A translation that lost most of its source is a truncation, not a rendering. */
const MIN_SHRINK = 0.2;

/** Tags, entities and the fenced blocks a model wraps JSON in. */
const MARKUP = /<\/?[a-z][^>]*>|&(?:[a-z]+|#\d+);|```/i;

export interface ValidateInput {
    source: string;
    output: string;
    target: Locale;
    /** The detected source language, when the engine reported one. */
    srcLang?: Locale;
    mode?: TranslationMode;
}

/**
 * Is this one output allowed to become a cache row?
 *
 * Pure and synchronous — the backfill worker runs it thousands of times per
 * run, and it must never be the reason a request is slow.
 */
export function validateTranslation({
    source,
    output,
    target,
    srcLang,
    mode = 'translate'
}: ValidateInput): ValidationResult {
    const reasons: RejectReason[] = [];
    const details: string[] = [];

    const src = normalizeForHash(source);
    const out = normalizeForHash(output);

    if (!out) {
        return { ok: false, reasons: ['empty'], detail: 'empty output' };
    }

    // A model that echoed the source back has told us nothing, and storing it
    // would put an honest "translated from Hebrew" label on Hebrew text.
    // Unless the languages genuinely match — but that is an `identity` row,
    // written by the caller, not something the engine gets to claim here.
    if (out === src && srcLang !== target) {
        reasons.push('unchanged');
        details.push('output is identical to the source');
    }

    if (MARKUP.test(output) && !MARKUP.test(source)) {
        reasons.push('markup');
        details.push('markup in the output that was not in the source');
    }

    const corrupt = corruptedWords(out);
    if (corrupt.length > 0) {
        reasons.push('mixed-script');
        details.push(
            `mixed-script word(s): ${corrupt.slice(0, 3).map((c) => `${c.word} (${c.scripts})`).join(', ')}`
        );
    }

    // A translation into Russian written in Latin letters is not a translation
    // into Russian. Only checked for `translate`: a transliteration is, by
    // definition, the source's *meaning* carried into the target's script, and
    // a name rendered `Baruch (ברוך)` legitimately holds both.
    if (mode === 'translate') {
        const want = SCRIPT_OF[target];
        const got = detectScript(out);
        if (got.letters >= 8 && got.script !== 'unknown' && got.script !== want && got.share > 0.8) {
            reasons.push('wrong-script');
            details.push(`expected ${want} for ${target}, got ${got.script}`);
        }
    }

    const allowance =
        src.length <= SHORT_SOURCE
            ? Math.max(SHORT_SOURCE_ALLOWANCE, src.length * MAX_GROWTH)
            : src.length * MAX_GROWTH;
    if (out.length > allowance) {
        reasons.push('too-long');
        details.push(`${out.length} chars from a ${src.length}-char source`);
    }

    if (src.length > SHORT_SOURCE && out.length < src.length * MIN_SHRINK) {
        reasons.push('too-short');
        details.push(`${out.length} chars from a ${src.length}-char source`);
    }

    const missing = glossaryViolations(src, out, target);
    if (missing.length > 0) {
        reasons.push('glossary');
        details.push(`glossary term(s) not carried over: ${missing.map((t) => t.he).join(', ')}`);
    }

    return reasons.length === 0
        ? { ok: true, reasons: [] }
        : { ok: false, reasons, detail: details.join('; ') };
}

// ─── Batch shape ────────────────────────────────────────────────────────────

/** One item as the engine is contracted to return it (§5.1). */
export interface EngineItem {
    id: string;
    detected?: string;
    out: Partial<Record<Locale, string>>;
}

export interface ShapeResult {
    ok: boolean;
    items: EngineItem[];
    error?: string;
}

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/**
 * Check the *whole* response before any of it is used.
 *
 * Rejecting the batch rather than salvaging the good half is deliberate: a
 * response whose shape drifted is a response whose ids may have drifted too,
 * and a translation stored against the wrong source string is worse than no
 * translation. Cheap to retry, expensive to be wrong.
 */
export function validateBatchShape(raw: unknown, expectedIds: string[]): ShapeResult {
    const items = (raw as { items?: unknown })?.items;
    if (!Array.isArray(items)) {
        return { ok: false, items: [], error: 'response has no `items` array' };
    }

    const expected = new Set(expectedIds);
    const seen = new Set<string>();
    const out: EngineItem[] = [];

    for (const item of items) {
        const id = (item as { id?: unknown })?.id;
        if (typeof id !== 'string' || !expected.has(id)) {
            return { ok: false, items: [], error: `unknown or missing id in response: ${String(id)}` };
        }
        if (seen.has(id)) {
            return { ok: false, items: [], error: `duplicate id in response: ${id}` };
        }
        seen.add(id);

        const rawOut = (item as { out?: unknown }).out;
        if (!rawOut || typeof rawOut !== 'object' || Array.isArray(rawOut)) {
            return { ok: false, items: [], error: `item ${id} has no \`out\` object` };
        }

        const cleaned: Partial<Record<Locale, string>> = {};
        for (const [lang, text] of Object.entries(rawOut as Record<string, unknown>)) {
            if (!isLocale(lang)) continue; // A locale we did not ask for is not an error, just ignored.
            if (typeof text !== 'string') {
                return { ok: false, items: [], error: `item ${id}.out.${lang} is not a string` };
            }
            cleaned[lang] = text;
        }

        const detected = (item as { detected?: unknown }).detected;
        out.push({
            id,
            detected: typeof detected === 'string' ? detected : undefined,
            out: cleaned
        });
    }

    return { ok: true, items: out };
}
