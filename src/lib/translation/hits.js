/**
 * What counts as *a translation to tell the reader about* (§9.1, §15.3 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * The cache deliberately stores **identity rows**: when the detected source
 * language is already the reader's language, a row is written with
 * `engine:'identity'` and `text = source` (§2.2). That row is not decoration —
 * it is what stops the most common render on the site (Hebrew content read in
 * Hebrew) from being a permanent cache miss that re-asks the quota governor
 * forever. So it has to stay in the payload, and `misses` has to keep excluding
 * it.
 *
 * But it is **not a translation**, and the display layer used to treat it as
 * one, because the only test anywhere was `!!hit.text` — and an identity row's
 * `text` *is* the source. A Hebrew reader was told "תורגם מעברית · תרגום מכונה"
 * underneath a sentence nobody translated, and offered to "show the original"
 * of text that already was the original. That is precisely the dishonesty §9.1
 * exists to prevent, in the one direction nobody thinks to check.
 *
 * One predicate, imported by every consumer, because the rule has three call
 * sites now (`<Translated>`, `<TranslatedNote>`, and any surface that swaps a
 * rich-text block for a flat translation) and a rule copied three times is a
 * rule that will be right in two of them.
 */

/**
 * @typedef {import('./types.js').TranslationHit} TranslationHit
 */

/**
 * Does this cache row carry text the reader could not otherwise read?
 *
 * @param {TranslationHit | null | undefined} hit
 * @returns {boolean} false for a miss, and false for an identity row
 */
export function isRealTranslation(hit) {
    return !!hit && typeof hit.text === 'string' && !!hit.text && hit.engine !== 'identity';
}
