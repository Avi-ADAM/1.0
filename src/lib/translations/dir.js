/**
 * The page's writing direction, from its locale — the only list of RTL locales.
 *
 * Pure (no store) so the server can stamp `<html dir>` in `transformPageChunk`
 * and the client can keep it in sync from the root layout with the same answer.
 * See docs/done/PLAN_LTR_LAYOUT.md.
 */

/** Locales that read right-to-left. Every other supported locale is LTR. */
export const RTL_LOCALES = /** @type {const} */ (['he', 'ar']);

/**
 * @param {string | null | undefined} locale
 * @returns {'rtl' | 'ltr'}
 */
export function dirOf(locale) {
  const base = String(locale ?? '').toLowerCase().split(/[-_]/)[0];
  return /** @type {readonly string[]} */ (RTL_LOCALES).includes(base) ? 'rtl' : 'ltr';
}
