/**
 * Turning one engine answer into cache rows (§5.1 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * Sits between `gemini.ts` (which asks) and `cacheTranslations` (which stores),
 * and owns the two decisions neither of them should:
 *
 * 1. **Identity rows.** When the detected source language *is* a target, the
 *    row is written with `engine:'identity'` and `text = source`. Skipping it
 *    would be the expensive mistake: an English project description shown to an
 *    English reader is the most common string on this site, and without the row
 *    every such render is a permanent miss that keeps re-asking the governor
 *    forever.
 * 2. **What the caller gets back.** The reader who triggered the miss is still
 *    on the page, so the fill returns the hits for *their* locale and the
 *    component swaps them in without a navigation.
 *
 * Engine-agnostic: it is handed a `TranslateEngine`, so a second free-quota
 * provider is a constructor argument, not an edit here.
 */

import { hashSource } from '$lib/translation/normalize.js';
import { detectLang } from '$lib/translation/detect.js';
import type { Locale, TranslationHit, TranslationMap, TranslationMode } from '$lib/translation/types.js';
import type { TranslateEngine, TranslateItem } from './gemini.js';
import type { CacheRowInput } from '$lib/server/actions/configs/cacheTranslations.js';

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

export interface FillInput {
    /** The normalized source string, as the collector produced it. */
    source: string;
    mode: TranslationMode;
    /** `openMission.descrip` — telemetry only, never part of a key. */
    firstSeenOn?: string;
}

export interface FillOutput {
    /** Rows to hand to `cacheTranslations`. */
    rows: CacheRowInput[];
    /** `hash → hit` for `forLocale`, so the waiting reader can be served now. */
    hits: TranslationMap;
    /** Sources the engine returned nothing usable for. They stay misses. */
    unfilled: string[];
}

export interface FillOptions {
    engine: TranslateEngine;
    targets?: Locale[];
    /** The locale of the reader who is waiting, if any. */
    forLocale?: Locale;
    model?: string;
    /**
     * `hits` on the created rows. 1 for the on-demand path (a reader asked and
     * got source text), 0 for the backfill worker. It is the only demand signal
     * the priority queue has (§8.2).
     */
    hits?: number;
}

/**
 * Ask the engine about `inputs` and turn the answer into rows.
 *
 * One request, every locale (§5.1): when a Spanish reader triggers a miss we
 * buy Arabic, Russian, English and Hebrew in the same breath, because the
 * request — the scarce resource — has already been spent.
 *
 * Never throws on a bad answer for one string; it simply does not produce a row
 * for it, and the reader keeps seeing the author's own words. Engine transport
 * failures *do* propagate, so the caller can log and back off.
 */
export async function fillTranslations(
    inputs: FillInput[],
    { engine, targets = LOCALES, forLocale, model, hits = 0 }: FillOptions
): Promise<FillOutput> {
    const out: FillOutput = { rows: [], hits: {}, unfilled: [] };
    if (inputs.length === 0) return out;

    // Deduplicate by hash before spending anything: a list page routinely shows
    // the same rikma name on thirty cards, and the cache is content-addressed,
    // so those thirty are one string and one row.
    const byHash = new Map<string, FillInput>();
    for (const input of inputs) {
        const hash = hashSource(input.source);
        if (!byHash.has(hash)) byHash.set(hash, input);
    }

    const items: TranslateItem[] = [...byHash].map(([hash, input]) => ({
        id: hash,
        mode: input.mode,
        text: input.source
    }));

    const results = await engine(items, targets);
    const answered = new Map(results.map((r) => [r.id, r]));

    for (const [hash, input] of byHash) {
        const result = answered.get(hash);
        if (!result) {
            out.unfilled.push(hash);
            continue;
        }

        // The engine's `detected` is authoritative — it read the sentence. The
        // local guess is the fallback for a model that omitted it, and
        // `unknown` means no rows: a row whose `srcLang` is a guess would put a
        // confident "translated from Hebrew" label on text that was not Hebrew.
        const declared = isLocale(result.detected) ? result.detected : detectLang(input.source).lang;
        if (!isLocale(declared)) {
            out.unfilled.push(hash);
            continue;
        }

        let produced = 0;
        for (const target of targets) {
            if (target === declared) {
                out.rows.push({
                    hash,
                    srcLang: declared,
                    tgtLang: target,
                    source: input.source,
                    text: input.source,
                    mode: input.mode,
                    engine: 'identity',
                    model: null,
                    hits,
                    firstSeenOn: input.firstSeenOn ?? null
                });
                produced++;
                continue;
            }

            const text = result.out[target];
            if (typeof text !== 'string' || !text.trim()) continue;

            out.rows.push({
                hash,
                srcLang: declared,
                tgtLang: target,
                source: input.source,
                text: text.trim(),
                mode: input.mode,
                engine: 'gemini',
                model: model ?? null,
                hits,
                firstSeenOn: input.firstSeenOn ?? null
            });
            produced++;
        }

        if (produced === 0) out.unfilled.push(hash);
    }

    if (forLocale && isLocale(forLocale)) {
        for (const row of out.rows) {
            if (row.tgtLang !== forLocale) continue;
            const hit: TranslationHit = {
                text: row.text,
                srcLang: row.srcLang as Locale,
                mode: (row.mode as TranslationMode) ?? 'translate',
                engine: row.engine === 'identity' ? 'identity' : 'gemini',
                quality: 'machine'
            };
            out.hits[row.hash] = hit;
        }
    }

    return out;
}
