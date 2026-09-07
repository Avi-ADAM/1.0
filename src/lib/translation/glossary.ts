/**
 * The glossary — the thing that makes machine translation of this site not
 * embarrassing (§6 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * Left to itself, a translator turns **רקמה** into *tissue*, **מוח** into
 * *brain*, **לב** into *heart* and **חלוקה** into *division*. Those are the
 * platform's core nouns; getting them wrong is worse than not translating at
 * all. So the domain terms are not translated — they are **transliterated and
 * glossed once**: `rikma (partnership)`, `moach (project hub)`.
 *
 * It is used twice, and the second use is the one that matters:
 *
 * 1. injected into the prompt as a constraint (P2) — prompts *suggest*;
 * 2. checked after the fact (`validate.ts`, P2) — if the source contained a
 *    glossary term and the output does not contain its canonical rendering,
 *    the row is rejected and the site renders source. Checks *decide*.
 *
 * Because it is a table of canonical renderings, it is also the reference for
 * human translators and for whoever writes the next `$t()` JSON key. One file,
 * both readers — a term rendered one way in `he.json` and another way by the
 * machine is the same bug either way.
 */

import type { Locale } from './types.js';

export interface GlossaryTerm {
    /** The Hebrew source term, as authors actually type it. */
    he: string;
    /** Other spellings/inflections in the source that mean the same term. */
    aliases?: string[];
    /** Canonical rendering per locale. `he` repeats the term unchanged. */
    render: Record<Locale, string>;
    /** A term that must survive verbatim in every locale (a brand, a number). */
    invariant?: boolean;
    /** Why this is here, for the human translator reading the table. */
    note?: string;
}

/**
 * Canonical renderings. Transliteration first, a short gloss in parentheses on
 * the first occurrence — the same convention §4.3 sets for personal names, and
 * for the same reason: the reader has to be able to say the word out loud and
 * still find it in the UI, which is transliterated too.
 */
export const GLOSSARY: GlossaryTerm[] = [
    {
        he: 'רקמה',
        aliases: ['רקמות', 'הרקמה', 'רקמת'],
        render: {
            he: 'רקמה',
            en: 'rikma (partnership)',
            ar: 'ركمة (شراكة)',
            ru: 'рикма (партнёрство)',
            es: 'rikma (asociación)'
        },
        note: 'Never "tissue". A rikma is the partnership itself, not the project it runs.'
    },
    {
        he: 'מוח',
        aliases: ['המוח'],
        render: {
            he: 'מוח',
            en: 'moach (project hub)',
            ar: 'موَح (مركز المشروع)',
            ru: 'моах (центр проекта)',
            es: 'moach (centro del proyecto)'
        },
        note: 'Never "brain". The moach is a rikma’s working page.'
    },
    {
        he: 'לב',
        aliases: ['הלב'],
        render: {
            he: 'לב',
            en: 'lev (heart / feed)',
            ar: 'ليف (القلب / التدفق)',
            ru: 'лев (сердце / лента)',
            es: 'lev (corazón / muro)'
        },
        note: 'Never "heart" alone — it is the personal feed, a named surface.'
    },
    {
        he: 'חלוקה',
        aliases: ['חלוקות', 'החלוקה'],
        render: {
            he: 'חלוקה',
            en: 'haluka (profit split)',
            ar: 'حلوكة (تقسيم الأرباح)',
            ru: 'халука (распределение прибыли)',
            es: 'haluka (reparto de beneficios)'
        },
        note: 'Never "division" or "distribution" — it is a specific payout record.'
    },
    {
        he: 'משאב',
        aliases: ['משאבים', 'המשאב'],
        render: {
            he: 'משאב',
            en: 'resource',
            ar: 'مورد',
            ru: 'ресурс',
            es: 'recurso'
        },
        note: 'This one *is* an ordinary word; it is here so it stays consistent.'
    },
    {
        he: 'משימה',
        aliases: ['משימות', 'המשימה'],
        render: {
            he: 'משימה',
            en: 'mission',
            ar: 'مهمة',
            ru: 'задача',
            es: 'misión'
        }
    },
    {
        he: 'שירות',
        aliases: ['שירותים'],
        render: {
            he: 'שירות',
            en: 'sheirut (service)',
            ar: 'شيروت (خدمة)',
            ru: 'шейрут (услуга)',
            es: 'sheirut (servicio)'
        },
        note: 'A sheirut is a booked service delivery, not the generic word.'
    },
    {
        he: '1lev1',
        aliases: ['1💗1', '1lev1.com'],
        invariant: true,
        render: { he: '1lev1', en: '1lev1', ar: '1lev1', ru: '1lev1', es: '1lev1' },
        note: 'The platform name. Never translated, never transliterated.'
    }
];

/** Every source spelling that identifies a term, lowercased. */
export function sourceForms(term: GlossaryTerm): string[] {
    return [term.he, ...(term.aliases ?? [])].map((s) => s.toLowerCase());
}

/**
 * Which glossary terms appear in a source string.
 *
 * Substring matching, not word matching: Hebrew binds its prepositions to the
 * noun (`ברקמה`, `לרקמה`, `שהרקמה`), so a `\b`-anchored match would miss most
 * real occurrences. The cost is the occasional false positive, and a false
 * positive here only means the prompt is handed one extra constraint.
 */
export function termsIn(source: string): GlossaryTerm[] {
    const s = (typeof source === 'string' ? source : '').toLowerCase();
    if (!s) return [];
    return GLOSSARY.filter((term) => sourceForms(term).some((form) => s.includes(form)));
}

/** The constraint list handed to the engine for one target locale (P2). */
export function glossaryFor(source: string, target: Locale): Array<{ from: string; to: string }> {
    return termsIn(source).map((term) => ({ from: term.he, to: term.render[target] }));
}

/**
 * Post-hoc check (§6). Returns the terms whose canonical rendering is missing
 * from the output — a non-empty result means the row must not be stored.
 *
 * The comparison is on the transliterated head only (`rikma` out of
 * `rikma (partnership)`), because a model that writes the gloss differently or
 * drops it on the second mention is not making the mistake this guards against.
 */
export function glossaryViolations(
    source: string,
    output: string,
    target: Locale
): GlossaryTerm[] {
    const out = (typeof output === 'string' ? output : '').toLowerCase();
    return termsIn(source).filter((term) => {
        const head = term.render[target].split('(')[0].trim().toLowerCase();
        return head.length > 0 && !out.includes(head);
    });
}
