/**
 * Shared types for UGC (T3) translation — see `docs/PLAN_UGC_TRANSLATION.md`.
 *
 * T1 (UI chrome, `$t()`) and T2 (the shared catalog, Strapi `localizations`)
 * are unaffected by anything in this folder. These types describe only the
 * content-addressed cache that fronts *user-written* text.
 */

/** The five locales the site speaks. Mirrors `LOCALES` in translations/routes.js. */
export type Locale = 'he' | 'en' | 'ar' | 'ru' | 'es';

/** What the detector answers when the script is not decisive. */
export type DetectedLang = Locale | 'unknown';

/**
 * `translate` — prose, rendered in the reader's language.
 * `transliterate` — a name, a city, a brand: rendered in the reader's *script*
 * so they can pronounce it, never semantically translated (§4.3).
 */
export type TranslationMode = 'translate' | 'transliterate';

/** Who produced the row. `identity` = source language already equals target. */
export type TranslationEngine = 'gemini' | 'human' | 'identity' | 'glossary';

/** `reviewed` rows are promoted by a human and never overwritten by a machine run. */
export type TranslationQuality = 'machine' | 'reviewed';

/** One row of the `text-translation` Strapi collection (§2.2). */
export interface TranslationRow {
    /** `${srcLang}.${tgtLang}.${hash}` — the only lookup key. */
    key: string;
    hash: string;
    srcLang: Locale;
    tgtLang: Locale;
    source: string;
    text: string;
    mode: TranslationMode;
    engine: TranslationEngine;
    model?: string | null;
    quality: TranslationQuality;
    hits?: number | null;
    /** `openMission.descrip` — telemetry only, never part of a key. */
    firstSeenOn?: string | null;
}

/**
 * One source string the read path asked about. Produced by the collector
 * (`collect.ts`) from data a loader has *already* fetched — collecting never
 * costs a query of its own.
 */
export interface TranslatableString {
    /** `${entityKey}.${field}` — telemetry and debugging, never a cache key. */
    path: string;
    field: string;
    /** The manifest entry this came from, e.g. `openMission`. */
    entityKey: string;
    /** The entity's Strapi id, so a caller can attach the result back. */
    id: string;
    mode: TranslationMode;
    /** The raw text as the author wrote it. */
    source: string;
    /** `hashSource(source)` — 32 hex chars. */
    hash: string;
}

/**
 * What the read path hands a component for one string: either a translation
 * (with the language it came from, so the provenance line can be honest), or
 * nothing at all, in which case the source is rendered.
 */
export interface TranslationHit {
    text: string;
    srcLang: Locale;
    mode: TranslationMode;
    engine: TranslationEngine;
    quality: TranslationQuality;
}

/** `hash → hit`, for one target locale. What a loader attaches to its payload. */
export type TranslationMap = Record<string, TranslationHit>;

/** The shape a loader returns alongside its data. */
export interface TranslationPayload {
    /** The locale these translations are *for*. */
    locale: Locale;
    /** Hits, keyed by source hash. */
    hits: TranslationMap;
    /**
     * Hashes that were asked for and not found. The client posts these to
     * `/api/translate/warm` (P2). In P1 there is no warm endpoint and this is
     * simply reported, never acted on.
     */
    misses: string[];
}

/** The user's preference (§4.4). `off` skips the cache read entirely. */
export type AutoTranslatePref = 'off' | 'onDemand' | 'always';
