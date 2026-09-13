/**
 * The page half of the UGC translation read path (§4 of
 * docs/PLAN_UGC_TRANSLATION.md) — what every surface's `+page.svelte` did by
 * hand, in one place.
 *
 * A loader that called `translateSurface` hands the page two things:
 * `translations` (the hits of its single batched cache read) and `pending`
 * (the misses, for warming). Every page then needs the same four moves, and
 * the first two pages to get them wrote them out inline. By the third it was
 * a pattern, and a pattern copied into seven pages is seven chances for one of
 * them to call an identity row a translation.
 *
 * 1. **Resolve a row** — one sync hash of a string already in memory. No
 *    query, no await; a miss is simply absent and the source renders.
 * 2. **Warm, fire-and-forget** — and only for an `always` reader (warm.js).
 *    Nothing is awaited before render; a warm that never resolves leaves the
 *    page showing what the author wrote, which is correct.
 * 3. **Pick a group's provenance row** — the first *real* translation, never
 *    simply the first row (§9.1; see the header of hits.js).
 * 4. **Say which text to show** where `<Translated>` cannot be used — a string
 *    handed to a component that only takes a string (a `Tile`'s `word`), or a
 *    rich-text field whose translation is flat (§12).
 *
 * Call it once, during component initialisation — it creates an `$effect`.
 *
 * @example
 *   const tr = pageTranslations(() => data, () => $locale);
 *   <Translated text={m.name} hit={tr.hitFor(m.name)} showNote={false} />
 *   <TranslatedNote hit={tr.firstReal(m.name, m.excerpt)} />
 */

import { fromStore } from 'svelte/store';
import { hashSource } from './normalize.js';
import { isRealTranslation } from './hits.js';
import { warmTranslations } from './warm.js';
import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';
import type {
    TranslatableString,
    TranslationHit,
    TranslationMap,
    TranslationPayload
} from './types.js';

/** The two fields a surface's loader adds to its page data. */
export interface SurfaceData {
    translations?: TranslationPayload | null;
    pending?: TranslatableString[] | null;
}

type Text = string | null | undefined;

export interface PageTranslations {
    /** The cache row for this exact string, or undefined. May be an identity row. */
    hitFor(text: Text): TranslationHit | undefined;
    /**
     * The first *real* translation among these strings — the row a group's one
     * provenance line is about. An identity row never qualifies: its text is
     * the source, and a note under it would claim a translation nobody made.
     */
    firstReal(...texts: Text[]): TranslationHit | undefined;
    /** Should this string be shown translated right now? */
    showsTranslation(text: Text): boolean;
    /** The text to render for this string: the translation when it should show, else the source. */
    textFor(text: Text): string;
}

export function pageTranslations(
    data: () => SurfaceData | null | undefined,
    locale: () => string | null | undefined
): PageTranslations {
    const pref = fromStore(autoTranslate);
    const originals = fromStore(showOriginals);

    let extra = $state<TranslationMap>({});
    const hits = $derived<TranslationMap>({ ...(data()?.translations?.hits ?? {}), ...extra });

    $effect(() => {
        const pending = data()?.pending;
        const target = locale();
        if (!pending?.length || !target) return;
        void warmTranslations(pending, target).then((filled: TranslationMap) => {
            if (filled && Object.keys(filled).length) extra = { ...extra, ...filled };
        });
    });

    const hitFor = (text: Text) => (text ? hits[hashSource(text)] : undefined);

    // `off` and "show originals" are honoured here as well as in the read path,
    // so a payload fetched before the reader changed their mind does not keep
    // rendering translations. Same rule `<Translated>` applies.
    const showsTranslation = (text: Text) =>
        isRealTranslation(hitFor(text)) && pref.current !== 'off' && !originals.current;

    return {
        hitFor,
        firstReal: (...texts: Text[]) => texts.map(hitFor).find((h) => isRealTranslation(h)),
        showsTranslation,
        textFor: (text: Text) => (showsTranslation(text) ? (hitFor(text)?.text ?? '') : (text ?? ''))
    };
}
