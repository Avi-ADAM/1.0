/**
 * A cheap, dependency-free guess at what language a user-written string is in.
 *
 * It exists for one reason: **identity rows** (§2.2). An English project
 * description shown to an English reader is the most common case on the site,
 * and if we cannot tell it is already English we treat it as a permanent cache
 * miss and keep re-asking the quota governor about it forever.
 *
 * It is a *guess*, and it says so: `unknown` is a first-class answer and the
 * right one whenever the evidence is thin. The authoritative source language is
 * the `detected` field the translation engine returns (§5.1), which is what
 * gets stored as `srcLang` and what the "תורגם מעברית" line is built from.
 * Nothing here is ever written to the cache as fact.
 *
 * Three scripts are decisive on this site — Hebrew, Arabic, Cyrillic map to
 * `he`, `ar`, `ru`. Latin is not: `en` and `es` share it, so Latin text is
 * separated by a small stop-word vote and falls back to `unknown`.
 */

import type { DetectedLang, Locale } from './types.js';

export type Script = 'hebrew' | 'arabic' | 'cyrillic' | 'latin' | 'unknown';

export interface Detection {
    lang: DetectedLang;
    script: Script;
    /** 0–1. Share of letters in the winning script, damped for short strings. */
    confidence: number;
}

const RANGES: Array<[Script, RegExp]> = [
    ['hebrew', /[\u0590-\u05ff\ufb1d-\ufb4f]/u],
    ['arabic', /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u],
    ['cyrillic', /[\u0400-\u052f\u2de0-\u2dff\ua640-\ua69f]/u],
    ['latin', /[A-Za-z\u00c0-\u024f]/u]
];

/** The script each locale is written in. Used by the transliteration path. */
export const SCRIPT_OF: Record<Locale, Script> = {
    he: 'hebrew',
    ar: 'arabic',
    ru: 'cyrillic',
    en: 'latin',
    es: 'latin'
};

/**
 * Stop words that are common, short, and *not* shared between the two Latin
 * locales. Deliberately tiny: this only has to separate en from es, and a
 * bigger list is a bigger surface for a false confident answer.
 */
const STOPWORDS: Record<'en' | 'es', string[]> = {
    en: ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'you', 'our', 'we', 'is', 'of', 'to', 'in', 'a', 'an', 'will', 'have'],
    es: ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'para', 'con', 'que', 'una', 'un', 'por', 'en', 'es', 'se', 'su', 'nuestro', 'nuestra']
};

/** Per-script letter counts. Everything that is not a letter is ignored. */
function countByScript(s: string): Record<Script, number> {
    const counts: Record<Script, number> = {
        hebrew: 0, arabic: 0, cyrillic: 0, latin: 0, unknown: 0
    };
    for (const ch of s) {
        if (!/\p{L}/u.test(ch)) continue;
        const hit = RANGES.find(([, re]) => re.test(ch));
        counts[hit ? hit[0] : 'unknown']++;
    }
    return counts;
}

/**
 * Which script dominates a string, and by how much.
 *
 * Exported on its own because the validator (P2) needs exactly this to catch
 * the LLM failure mode `npm run check:script` catches in the JSON files — a
 * Cyrillic `г` inside a Hebrew word, which renders as garbage and reorders the
 * whole RTL run.
 */
export function detectScript(s: string): { script: Script; share: number; letters: number } {
    const counts = countByScript(typeof s === 'string' ? s : '');
    const letters = Object.values(counts).reduce((a, b) => a + b, 0);
    if (letters === 0) return { script: 'unknown', share: 0, letters: 0 };

    let script: Script = 'unknown';
    let best = 0;
    for (const [name, n] of Object.entries(counts) as Array<[Script, number]>) {
        if (name !== 'unknown' && n > best) {
            best = n;
            script = name;
        }
    }
    return { script, share: best / letters, letters };
}

/** The stop-word vote that separates `en` from `es`. `null` when it is a tie. */
function voteLatin(s: string): 'en' | 'es' | null {
    const words = s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
    if (words.length === 0) return null;
    const set = new Set(words);
    const en = STOPWORDS.en.filter((w) => set.has(w)).length;
    const es = STOPWORDS.es.filter((w) => set.has(w)).length;
    if (en === es) return null;
    return en > es ? 'en' : 'es';
}

/**
 * Guess the language of a user-written string.
 *
 * Returns `unknown` — never a coin flip — when:
 * - there are no letters at all (`1,200 ₪`, `2026-09-07`);
 * - no script holds a clear majority (a genuinely mixed string);
 * - the script is Latin and the stop-word vote is a tie (which is most short
 *   Latin strings: a two-word product name is not evidence of a language).
 */
export function detectLang(s: string): Detection {
    const { script, share, letters } = detectScript(typeof s === 'string' ? s : '');
    if (letters === 0) return { lang: 'unknown', script: 'unknown', confidence: 0 };

    // A mixed string is not "mostly Hebrew", it is unreliable. 0.7 keeps
    // ordinary prose with a Latin brand name in it ("פיתוח אתר ל-Acme") on the
    // Hebrew side while refusing a genuine 50/50.
    if (share < 0.7) return { lang: 'unknown', script, confidence: share };

    if (script === 'hebrew') return { lang: 'he', script, confidence: share };
    if (script === 'arabic') return { lang: 'ar', script, confidence: share };
    if (script === 'cyrillic') return { lang: 'ru', script, confidence: share };

    if (script === 'latin') {
        const vote = voteLatin(s);
        if (!vote) return { lang: 'unknown', script, confidence: 0 };
        return { lang: vote, script, confidence: share };
    }

    return { lang: 'unknown', script, confidence: 0 };
}

/**
 * True when the string is already in the reader's language — the case that
 * must produce an `identity` row rather than a permanent miss.
 * A `unknown` detection is never "already right": it is unknown.
 */
export function isAlreadyIn(s: string, locale: Locale): boolean {
    return detectLang(s).lang === locale;
}
