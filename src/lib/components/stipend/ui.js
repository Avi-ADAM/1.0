/**
 * One palette for every stipend surface.
 *
 * Appearance here is **two independent axes**, not one switch (see
 * `$lib/stores/theme.js`): the identity `personal | business` and the
 * brightness `light | dark`. That is four combinations, and a class that only
 * looks right in one of them is a bug in the other three — which is exactly
 * what the first pass of these components shipped: bare `text-gray-500` labels
 * (2.9:1 on a dark panel), `bg-transparent` inputs whose ink came from whatever
 * page they happened to sit on, and a hard-coded teal accent that has nothing
 * to do with the business identity.
 *
 * Two rules make the four combinations answerable without four palettes:
 *
 *  1. **Every neutral is a `light dark:` pair.** `dark` is a class on <html>
 *     in *both* identities, so one pair covers day and night for both.
 *  2. **Every accent goes through a theme token**, never a literal colour.
 *     `--goldink` is the readable-ink member of the gold/barbi pair and is
 *     defined for all four combinations (app.postcss, "THE GOLD / BARBI
 *     CONTRACT"); `bg-barbi text-gold` is the legible fill pair for the same
 *     reason. So the stipend blocks read as gold in the personal theme and as
 *     blue in the business one, with contrast guaranteed by the contract
 *     rather than by hand.
 *
 * Kept as string constants in a `.js` file — which Tailwind's content glob
 * scans — so the classes are still statically extractable and a future
 * contrast fix is one edit, not eighty.
 */

/** Card surface: an explicit ground, because these blocks sit on gradients. */
export const SURFACE =
    'rounded-2xl border border-gray-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 text-gray-900 dark:text-gray-50';

/** A quieter well *inside* a surface (previews, totals, tradeoffs). */
export const WELL =
    'rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60';

/** Heading ink on a surface. */
export const TITLE = 'font-bold text-gray-900 dark:text-gray-50';

/** Body ink. Explicit, so it never inherits a host page's colour. */
export const BODY = 'text-gray-800 dark:text-gray-100';

/** Field label — small caps. gray-600/300, not gray-500, which fails at night. */
export const LABEL =
    'text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300';

/** Secondary/explanatory text. */
export const MUTED = 'text-xs text-gray-600 dark:text-gray-300';

/** The faintest legible tier — captions under a number. */
export const FAINT = 'text-xs text-gray-500 dark:text-gray-400';

/**
 * Inputs carry their own ground and ink. `bg-transparent` was the single worst
 * offender: on the mission form's dark pink panel the typed number was dark
 * ink on a dark wash.
 */
export const INPUT =
    'rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 px-3 py-2 outline-none focus:border-goldink';

/** The stipend accent — gold in personal, blue in business, readable in both modes. */
export const ACCENT = 'text-goldink';

/**
 * Accent edge. Full strength on purpose: `goldink` is declared as a plain
 * `var(--goldink)` in tailwind.config.cjs, so Tailwind has no channel triplet
 * to inject an alpha into and `border-goldink/40` compiles to *nothing*. Use
 * a neutral (`WELL`) when a wash is wanted, never `bg-goldink/10`.
 */
export const ACCENT_EDGE = 'border border-goldink';

/** Primary action. `bg-barbi text-gold` is the contract's legible fill pair. */
export const BTN_PRIMARY =
    'rounded-xl bg-barbi text-gold font-bold shadow-md transition-all hover:shadow-lg disabled:opacity-60';

/** Secondary action. */
export const BTN_GHOST =
    'rounded-xl border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 transition-colors hover:border-goldink';

/** Warning / validation block. amber-900 on amber-50, amber-100 on amber-950. */
export const WARN =
    'rounded-xl border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100';
