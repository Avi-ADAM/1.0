/**
 * Words corrupted by characters from the wrong alphabet.
 *
 * A single Cyrillic letter inside a Hebrew word, an Arabic ending on one, a
 * Latin `p` where a `פ` belongs — the word renders as garbage and its RTL
 * sub-runs visually reorder, yet nothing else notices: it compiles, the length
 * is right, the key is right.
 *
 * The worked examples live in `scripts/check-mixed-script.mjs` and in this
 * module's test, not here: `npm run check:script` scans `src/`, so a file
 * under it that spells a corrupted word out loud reports itself.
 *
 * Two callers, one rule, on purpose:
 *
 *   1. `scripts/check-mixed-script.mjs` (`npm run check:script`) — the repo's
 *      own JSON/Svelte text, where the corruption comes from a bulk edit;
 *   2. `src/lib/server/translation/validate.ts` (§5.5) — machine-translation
 *      output, where it comes from the model. It is *the* characteristic LLM
 *      failure for this language mix, and a row that fails is never stored.
 *
 * Plain `.js` with JSDoc for the same reason `fields.js` is: the checker is a
 * dependency-free node script and imports the real module rather than keeping
 * a second copy of the rule that can drift from this one.
 *
 * @typedef {'Hebrew'|'Arabic'|'Cyrillic'|'Greek'|'Latin'} ScriptName
 * @typedef {{ word: string, kind: 'script clash'|'stray letter', scripts: string }} Corruption
 */

/** @type {Array<[ScriptName, RegExp]>} */
const SCRIPTS = [
    // Hebrew presentation forms start at U+FB20 on purpose: U+FB1D..FB1F are
    // the pointed ligatures that appear inside character-class *ranges* in this
    // repo's own RTL helpers, and counting them as Hebrew makes a regex source
    // line look like a corrupted word.
    ['Hebrew', /[\u0590-\u05ff\ufb20-\ufb4f]/],
    ['Arabic', /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/],
    ['Cyrillic', /[\u0400-\u04ff]/],
    ['Greek', /[\u0370-\u03ff]/],
    ['Latin', /[A-Za-z\u00c0-\u00ff\u0100-\u017f]/]
];

/** A word = letters only. Hyphens, quotes and digits split it. */
const WORD = /[\p{L}\p{M}]+/gu;

/** `\n`, `\t`, `\u05d4` … — the letter belongs to the escape, not to the word. */
const ESCAPES = /\\[nrtbfv0]|\\u\{?[0-9a-fA-F]+\}?|\\x[0-9a-fA-F]{2}/g;

/**
 * One-letter Hebrew particles (בכלמשהו) prefixed to a foreign word — `לStrapi`,
 * `בapi`, `הURL` — are ordinary Hebrew, not corruption.
 */
const HE_PARTICLE = /^[בכלמשהוד][A-Za-z]{2,}$|^[A-Za-z]{2,}[בכלמשהוד]$/;

/**
 * Unicode presentation forms (U+FB00–U+FEFF) never occur in typed text; a word
 * made only of them is a regex character-class range like `יִ-ﭏﭐ-﷿`.
 */
const PRESENTATION_ONLY = /^[\ufb00-\ufeff]+$/;

/**
 * Which writing system a single character belongs to, or null for digits,
 * punctuation and everything else this rule has no opinion about.
 *
 * @param {string} ch
 * @returns {ScriptName | null}
 */
export function scriptOf(ch) {
    for (const [name, re] of SCRIPTS) if (re.test(ch)) return name;
    return null;
}

/**
 * Blank out escape sequences so `\nשעות` does not read as Latin + Hebrew.
 * Only source text needs this; a user's sentence has no escapes in it.
 *
 * @param {string} line
 * @returns {string}
 */
export function blankEscapes(line) {
    return String(line).replace(ESCAPES, (m) => ' '.repeat(m.length));
}

/**
 * Every corrupted word in `text`.
 *
 * A word is flagged when it mixes writing systems and the mix is not ordinary
 * bilingual writing:
 *   - **script clash** — two different *non-Latin* alphabets in one word. Never
 *     legitimate, in any language this site speaks.
 *   - **stray letter** — a lone letter of another script inside an otherwise
 *     clean word: a Latin `p` opening a Hebrew one, a Cyrillic homoglyph
 *     standing in for the Latin `o`.
 *
 * Deliberately allowed: a real foreign word embedded in running text
 * (`לStrapi`, `Lev-מ`). That is normal here, not damage.
 *
 * @param {string} text
 * @param {{ escapes?: boolean }} [opts] `escapes: true` for source code.
 * @returns {Corruption[]}
 */
export function corruptedWords(text, opts = {}) {
    const clean = opts.escapes ? blankEscapes(text) : String(text ?? '');
    /** @type {Corruption[]} */
    const out = [];

    for (const m of clean.matchAll(WORD)) {
        const word = m[0];
        if (HE_PARTICLE.test(word) || PRESENTATION_ONLY.test(word)) continue;

        /** @type {Map<ScriptName, number>} */
        const counts = new Map();
        for (const ch of word) {
            const s = scriptOf(ch);
            if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
        }
        if (counts.size < 2) continue;

        const ranked = [...counts].sort((a, b) => b[1] - a[1]);
        const [, topN] = ranked[0];
        const minority = ranked.slice(1);
        const nonLatin = [...counts.keys()].filter((s) => s !== 'Latin');

        const clash = nonLatin.length > 1;
        const stray = minority.every(([, n]) => n === 1) && topN >= 2;
        if (!clash && !stray) continue;

        out.push({
            word,
            kind: clash ? 'script clash' : 'stray letter',
            scripts: ranked.map(([n, c]) => `${n}×${c}`).join(' + ')
        });
    }

    return out;
}

/**
 * True when `text` contains at least one corrupted word — the shape the
 * runtime validator wants, where the list itself is only for the log line.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function hasMixedScript(text) {
    return corruptedWords(text).length > 0;
}
