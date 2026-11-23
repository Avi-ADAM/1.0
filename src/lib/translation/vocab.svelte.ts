/**
 * The shared catalog (skills, roles, work-ways, values) for readers Strapi has
 * no row for — `ar`, `ru`, `es` (PLAN_UGC_TRANSLATION §19).
 *
 * `he` reads Strapi's Hebrew localization and `en` the English base, as
 * before; nothing here changes either. For the other three the base name is
 * looked up in a map `/api/translate/vocab` serves (filled by the daily
 * backfill), and falls back to the English base name when there is no row.
 *
 * The map is loaded once per locale and kept in localStorage, so a returning
 * reader has it synchronously on the first render; a fresh one sees English
 * for a moment and then the store's `version` bump re-renders what reads it.
 *
 * This is catalog text, not something a member wrote: a skill chip is not
 * marked "machine translation" the way `<Translated>` marks a member's
 * sentence. The catalog is ours, short, and reviewable as a list (§19).
 */

import { browser } from '$app/environment';
import { normalizeForHash } from './normalize.js';

const LOCALES = ['ar', 'ru', 'es'] as const;
type CatalogLocale = (typeof LOCALES)[number];

const STORE_KEY = (l: string) => `vocabT:${l}`;

const maps: Partial<Record<CatalogLocale, Record<string, string>>> = {};
const loading = new Set<string>();

/** Bumped whenever a map arrives; read it in a `$derived` to re-render. */
export const vocabState = $state({ version: 0 });

export function isCatalogLocale(l: unknown): l is CatalogLocale {
    return (LOCALES as readonly unknown[]).includes(l);
}

function fromStorage(l: CatalogLocale): Record<string, string> | null {
    try {
        const raw = localStorage.getItem(STORE_KEY(l));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Make sure the map for `lang` is loaded (or loading). Cheap to call on every
 * language change; a no-op for `he` / `en` and on the server.
 */
export function ensureVocab(lang: unknown): void {
    if (!browser || !isCatalogLocale(lang)) return;
    if (!maps[lang]) {
        const stored = fromStorage(lang);
        if (stored) {
            maps[lang] = stored;
            vocabState.version++;
        }
    }
    if (loading.has(lang)) return;
    loading.add(lang);
    fetch(`/api/translate/vocab?locale=${lang}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
            const map = body?.map;
            if (!map || typeof map !== 'object') return;
            maps[lang] = map;
            vocabState.version++;
            try {
                localStorage.setItem(STORE_KEY(lang), JSON.stringify(map));
            } catch {
                /* quota / private mode — the in-memory map still serves */
            }
        })
        .catch(() => {
            loading.delete(lang);
        });
}

/**
 * The catalog name for a reader in `lang`, given the English base name.
 * Returns `base` unchanged for `he`/`en`, for an unknown name, and before the
 * map has loaded — never an empty string.
 */
export function vocabName(base: unknown, lang: unknown): string {
    if (typeof base !== 'string') return (base as string) ?? '';
    if (!isCatalogLocale(lang)) return base;
    return maps[lang]?.[normalizeForHash(base)] ?? base;
}

/** Test hook. */
export function _setVocabMap(lang: CatalogLocale, map: Record<string, string> | undefined) {
    if (map) maps[lang] = map;
    else delete maps[lang];
}
