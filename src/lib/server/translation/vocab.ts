/**
 * The shared catalog — skills, roles, work-ways, values — as a translation
 * surface (PLAN_UGC_TRANSLATION §19).
 *
 * These rows live in Strapi's default locale (English) with one Hebrew
 * localization, read through `applyLocalization` / `oneLangAdj` /
 * `langAdjast`. That covers `he` and `en`. An Arabic, Russian or Spanish
 * reader had no row and read the English base name. This module lets the
 * translation cache supply those three:
 *
 *   · the backfill walks the four catalogs (`VOCAB_SOURCES` in
 *     `backfillSources.ts`) and buys the English base name in every locale;
 *   · `/api/translate/vocab?locale=ar` returns `{ englishBase → text }` for
 *     the whole catalog in one response, which the client keeps
 *     (`$lib/translation/vocab.svelte.ts`) and the existing localization
 *     helpers consult.
 *
 * Both sides build their strings with `vocabStrings` below, so the walker and
 * the reader hash the same bytes — the one rule the content-addressed cache
 * cannot survive breaking.
 */

import { collect } from '$lib/translation/collect.js';
import type { TranslatableString } from '$lib/translation/types.js';

export interface VocabKind {
    /** Manifest key in `fields.js`. */
    entityKey: 'skill' | 'tafkidim' | 'workWay' | 'vallue';
    /** The field that names the row. */
    field: 'skillName' | 'roleDescription' | 'workWayName' | 'valueName';
    /** Paged corpus query (default locale only). */
    qid: string;
    /** Collection key in the qid's response. */
    collection: string;
}

export const VOCAB_KINDS: VocabKind[] = [
    { entityKey: 'skill', field: 'skillName', qid: '482vocabSkills', collection: 'skills' },
    { entityKey: 'tafkidim', field: 'roleDescription', qid: '483vocabRoles', collection: 'tafkidims' },
    { entityKey: 'workWay', field: 'workWayName', qid: '484vocabWorkWays', collection: 'workWays' },
    { entityKey: 'vallue', field: 'valueName', qid: '485vocabValues', collection: 'vallues' }
];

/** The strings one catalog page contributes — the base name, through the manifest. */
export function vocabStrings(kind: VocabKind, nodes: unknown[]): TranslatableString[] {
    return collect({ [kind.entityKey]: (Array.isArray(nodes) ? nodes : []) as never });
}

/** Rows in a paged catalog response. */
export function vocabRows(kind: VocabKind, res: unknown): unknown[] {
    const data = (res as any)?.data?.[kind.collection]?.data;
    return Array.isArray(data) ? data : [];
}

/** Page count in a paged catalog response, or null. */
export function vocabPageCount(kind: VocabKind, res: unknown): number | null {
    const n = (res as any)?.data?.[kind.collection]?.meta?.pagination?.pageCount;
    return Number.isFinite(n) ? Number(n) : null;
}

/** Locales the catalog cache is served for. `he`/`en` stay on Strapi's own rows. */
export const VOCAB_CACHE_LOCALES = ['ar', 'ru', 'es'] as const;
export type VocabCacheLocale = (typeof VOCAB_CACHE_LOCALES)[number];

export function isVocabCacheLocale(l: unknown): l is VocabCacheLocale {
    return (VOCAB_CACHE_LOCALES as readonly unknown[]).includes(l);
}
