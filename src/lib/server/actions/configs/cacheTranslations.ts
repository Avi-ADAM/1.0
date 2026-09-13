/**
 * `cacheTranslations` — the write half of the UGC translation cache
 * (§5.4 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * Per CLAUDE.md every write goes through the Action System, and this is the
 * only door into `text-translation`. Three properties it has to hold:
 *
 * 1. **Service principal only.** `access: ['serviceAdmin']`. A member who
 *    could write this cache could put words in another member's mouth on every
 *    page that renders their text — and an API key must not reach it at all.
 * 2. **The validator runs here too, not only at the caller.** `/api/translate/warm`
 *    already refuses a bad row, but the gate belongs at the boundary that
 *    stores, so no future caller can route around it.
 * 3. **A row is written once.** The cache is content-addressed: the same key
 *    always means the same source string and the same language pair, so a
 *    second answer for it is a duplicate, not a correction. Existing keys are
 *    skipped, and a `reviewed` row is never overwritten by a machine run.
 *
 * Failure is per row and never fatal: a batch where three rows fail validation
 * stores the rest and reports the three. The reader sees source text for those,
 * which is the same thing they saw before the request was made.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { cacheKey, normalizeForHash as normalizeIdentity } from '$lib/translation/normalize.js';
import { validateTranslation } from '$lib/server/translation/validate.js';
import type { Locale, TranslationMode } from '$lib/translation/types.js';

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

const ENGINES = ['gemini', 'human', 'identity', 'glossary'] as const;
type Engine = (typeof ENGINES)[number];

/** Strapi's `pagination.limit` on qid 313, and the batch cap for one call. */
const MAX_ROWS = 300;

export interface CacheRowInput {
    hash: string;
    srcLang: string;
    tgtLang: string;
    source: string;
    text: string;
    mode?: string;
    engine?: string;
    model?: string | null;
    quality?: string;
    hits?: number;
    firstSeenOn?: string | null;
}

interface CleanRow {
    key: string;
    hash: string;
    srcLang: Locale;
    tgtLang: Locale;
    source: string;
    text: string;
    mode: TranslationMode;
    engine: Engine;
    model: string | null;
    quality: 'machine' | 'reviewed';
    hits: number;
    firstSeenOn: string | null;
}

export interface CacheTranslationsResult {
    created: number;
    /** Already in the cache. Not an error — the common case under concurrency. */
    skipped: number;
    /** Failed validation or the write. Each carries a reason for the log. */
    rejected: Array<{ key: string; reason: string }>;
}

/**
 * Coerce and validate one row. Returns a reason string when the row must not
 * be stored — the caller collects those rather than throwing, so one bad
 * answer in a batch of twenty-five does not discard the other twenty-four.
 */
export function prepareRow(raw: CacheRowInput): { row: CleanRow } | { reason: string; key: string } {
    const hash = typeof raw?.hash === 'string' ? raw.hash.trim() : '';
    const srcLang = raw?.srcLang;
    const tgtLang = raw?.tgtLang;
    const source = typeof raw?.source === 'string' ? raw.source : '';
    const text = typeof raw?.text === 'string' ? raw.text : '';

    if (!hash || !isLocale(srcLang) || !isLocale(tgtLang)) {
        return { key: hash || '?', reason: 'missing hash or unknown language pair' };
    }

    const key = cacheKey(srcLang, tgtLang, hash);
    if (!source || !text) return { key, reason: 'empty source or text' };

    const mode: TranslationMode = raw.mode === 'transliterate' ? 'transliterate' : 'translate';
    const engine: Engine = ENGINES.includes(raw.engine as Engine) ? (raw.engine as Engine) : 'gemini';

    // An identity row is the author's own text stored against its own language
    // (§2.2). `validateTranslation` exists because *model output* is untrusted;
    // there is no model here, and running it anyway rejects perfectly good rows:
    // a Hebrew source containing an inflected glossary term (`רקמות`, `רקמת`)
    // fails the glossary check against the canonical `רקמה`, so exactly the
    // corpus P3 fills for free would be the corpus that could not be stored.
    // What *is* checked is the claim itself — an "identity" row whose text is
    // not the source, or whose languages differ, is a lie about provenance.
    if (engine === 'identity' || srcLang === tgtLang) {
        if (engine !== 'identity') return { key, reason: 'same-language row must declare engine:identity' };
        if (srcLang !== tgtLang) return { key, reason: 'identity row across two languages' };
        if (normalizeIdentity(text) !== normalizeIdentity(source)) {
            return { key, reason: 'identity row whose text is not its source' };
        }
    } else {
        const verdict = validateTranslation({ source, output: text, target: tgtLang, srcLang, mode });
        if (!verdict.ok) {
            return { key, reason: `${verdict.reasons.join(',')} — ${verdict.detail ?? ''}`.trim() };
        }
    }

    return {
        row: {
            key,
            hash,
            srcLang,
            tgtLang,
            source,
            text,
            mode,
            engine,
            model: typeof raw.model === 'string' && raw.model ? raw.model : null,
            // `reviewed` is a human's word and is only ever set by
            // `reviewTranslation` (P5). A machine run cannot claim it.
            quality: 'machine',
            // 1 means "a reader asked for this and got source text while it was
            // being fetched"; the backfill worker passes 0. It is the only
            // demand signal the priority queue has (§8.2).
            hits: Number.isFinite(raw.hits) ? Number(raw.hits) : 0,
            firstSeenOn:
                typeof raw.firstSeenOn === 'string' && raw.firstSeenOn ? raw.firstSeenOn.slice(0, 120) : null
        }
    };
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
    const raw = Array.isArray(params.rows) ? (params.rows as CacheRowInput[]) : [];
    const result: CacheTranslationsResult = { created: 0, skipped: 0, rejected: [] };
    if (raw.length === 0) return result;

    if (raw.length > MAX_ROWS) {
        throw new Error(`cacheTranslations: ${raw.length} rows exceeds the ${MAX_ROWS} cap`);
    }

    /** Deduplicate within the batch — the same key twice is one write. */
    const rows = new Map<string, CleanRow>();
    for (const item of raw) {
        const prepared = prepareRow(item);
        if ('reason' in prepared) {
            result.rejected.push({ key: prepared.key, reason: prepared.reason });
            continue;
        }
        rows.set(prepared.row.key, prepared.row);
    }
    if (rows.size === 0) return result;

    // One query for every key, not one per row.
    const existing = new Set<string>();
    try {
        const res = await strapi.execute(
            '313translationsByKeys',
            { keys: [...rows.keys()], limit: MAX_ROWS },
            context.jwt,
            context.fetch
        );
        for (const node of res?.data?.textTranslations?.data ?? []) {
            const key = node?.attributes?.key;
            if (typeof key === 'string') existing.add(key);
        }
    } catch (err) {
        // Cannot establish what is already there ⇒ do not write. Duplicating
        // every row of a batch is worse than filling the cache a run later.
        throw new Error(
            `cacheTranslations: existence check failed — ${err instanceof Error ? err.message : String(err)}`
        );
    }

    for (const row of rows.values()) {
        if (existing.has(row.key)) {
            result.skipped++;
            continue;
        }
        try {
            await strapi.execute(
                '314createTextTranslation',
                {
                    key: row.key,
                    hash: row.hash,
                    srcLang: row.srcLang,
                    tgtLang: row.tgtLang,
                    source: row.source,
                    text: row.text,
                    mode: row.mode,
                    engine: row.engine,
                    model: row.model,
                    quality: row.quality,
                    hits: row.hits,
                    firstSeenOn: row.firstSeenOn
                },
                context.jwt,
                context.fetch
            );
            result.created++;
        } catch (err) {
            // A unique-constraint collision here is another instance winning
            // the race, which is a skip, not a failure. Either way the reader
            // is unaffected: the row exists or the source is rendered.
            const message = err instanceof Error ? err.message : String(err);
            if (/unique|duplicate/i.test(message)) result.skipped++;
            else result.rejected.push({ key: row.key, reason: message.slice(0, 200) });
        }
    }

    if (result.rejected.length > 0) {
        console.warn(
            `[translation] ${result.rejected.length} row(s) not stored:`,
            result.rejected.slice(0, 5)
        );
    }

    return result;
};

export const cacheTranslationsConfig: ActionConfig = {
    key: 'cacheTranslations',
    description:
        'Store a batch of machine translations in the content-addressed text-translation cache. Service principal only; rows are written once and never overwrite a human-reviewed row.',
    graphqlOperation: handler,
    paramSchema: {
        rows: {
            type: 'array',
            required: true,
            description:
                'Rows to store: { hash, srcLang, tgtLang, source, text, mode?, engine?, model?, hits?, firstSeenOn? }'
        },
        userId: {
            type: 'string',
            required: false,
            description: 'The calling principal, for the audit trail. Not used for authorization.'
        }
    },
    // The whole authorization. No user and no API key may reach this — see the
    // file header. `authRules` is empty because there is no *entity* to own:
    // the cache belongs to the platform, not to a member.
    access: ['serviceAdmin'],
    authRules: []
};
