/**
 * The one plain-text rendering of a tiptap/`descrip` HTML field that the UGC
 * translation cache is allowed to key on (§5.5 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * Why plain text at all: the cache stores plain strings on purpose. The output
 * validator strips markup precisely because a model handed tags invents more of
 * them — closing what it did not open, "translating" an attribute, wrapping the
 * answer in a `<p>` that was not there. So the *source* has to be flat too, or
 * the same sentence gets a different hash depending on whether the author
 * happened to bold a word.
 *
 * Why it lives here and not at a call site: the loader hashes this to look the
 * row up, and the page hashes it again to find the row it was handed. Those two
 * strings have to be identical, byte for byte, or the page renders source text
 * for a translation that is sitting right there in its own payload. One
 * function, imported by both — server and browser — is the only way that
 * cannot drift.
 *
 * **No truncation.** `htmlExcerpt`'s job is a card summary and it appends an
 * ellipsis; that is right for a card and wrong here, because a truncated
 * translation shown beside an untruncated original is a lie about the author's
 * words. A description longer than the manifest's `max` is simply not
 * translated — `collect()` drops it — and the reader sees Hebrew, which is
 * the honest failure.
 */

import { htmlExcerpt } from '$lib/text/htmlExcerpt.js';

/**
 * @param {unknown} html tiptap HTML as Strapi stored it
 * @returns {string} the flattened text, or '' when there is nothing to translate
 */
export function plainForTranslation(html) {
    return htmlExcerpt(html, Number.POSITIVE_INFINITY);
}
