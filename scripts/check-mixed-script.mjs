#!/usr/bin/env node
/**
 * check-mixed-script — find text corrupted by characters from the wrong
 * alphabet.
 *
 * A bulk find/replace, or a paste through a tool that "helpfully" transliterates,
 * can leave a single Cyrillic `г` inside a Hebrew word (`מפгש`), an Arabic `وي`
 * at the end of one (`ליוوي`), or a Latin `p` where a `פ` belongs (`pתוח`). The
 * word renders as garbage and its RTL sub-runs visually reorder, yet nothing
 * else in the repo notices: it compiles, the key is right, the length is right.
 *
 * Flags a *word* (an unbroken run of letters) when it mixes writing systems:
 *   - two non-Latin scripts (Hebrew+Arabic, Hebrew+Cyrillic, …) — never legitimate;
 *   - a *single* stray letter of another script inside an otherwise clean word
 *     (`pתוח`, homoglyph swaps like Cyrillic `о` in a Latin word).
 *
 * Deliberately allowed: a real foreign word embedded in running text
 * (`לStrapi`, `Lev-מ`) — that is normal bilingual writing, not corruption.
 *
 * Usage: npm run check:script
 */
import fs from 'node:fs';
import path from 'node:path';

const SCRIPTS = [
    ['Hebrew', /[֐-׿ﬠ-ﭏ]/],
    ['Arabic', /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/],
    ['Cyrillic', /[Ѐ-ӿ]/],
    ['Greek', /[Ͱ-Ͽ]/],
    ['Latin', /[A-Za-zÀ-ÿĀ-ſ]/]
];

/** A word = letters only. Hyphens, quotes and digits split it. */
const WORD = /[\p{L}\p{M}]+/gu;
/** `\n`, `\t`, `ሴ` … — the letter belongs to the escape, not to the word. */
const ESCAPES = /\\[nrtbfv0]|\\u\{?[0-9a-fA-F]+\}?|\\x[0-9a-fA-F]{2}/g;

const EXT = /\.(svelte|js|ts|json|md|html)$/;
const SKIP_DIR = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist']);
/**
 * Captured API payloads, not authored text. Real user-typed names live in
 * these (a member called `Bבר`) and must not be "corrected".
 */
const SKIP_FILE = [/utils[\\/](new|old)obj\.js$/, /routes[\\/]jenia[\\/]/];

/**
 * One-letter Hebrew particles (בכלמשהו) prefixed to a foreign word — `לStrapi`,
 * `בapi`, `הURL` — are ordinary Hebrew, not corruption.
 */
const HE_PARTICLE = /^[בכלמשהוד][A-Za-z]{2,}$|^[A-Za-z]{2,}[בכלמשהוד]$/;

/**
 * Unicode presentation forms (U+FB00–U+FEFF) never occur in typed text; a word
 * made only of them is a regex character-class range like `יִ-ﭏﭐ-﷿`.
 */
const PRESENTATION_ONLY = /^[ﬀ-﻿]+$/;

function scriptOf(ch) {
    for (const [name, re] of SCRIPTS) if (re.test(ch)) return name;
    return null;
}

const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (!SKIP_DIR.has(e.name)) walk(path.join(dir, e.name));
        } else if (EXT.test(e.name)) {
            const p = path.join(dir, e.name);
            if (!SKIP_FILE.some((re) => re.test(p))) files.push(p);
        }
    }
})('src');

const hits = [];

for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        // Blank out escape sequences so `\nשעות` doesn't read as Latin+Hebrew.
        const clean = line.replace(ESCAPES, (m) => ' '.repeat(m.length));

        for (const m of clean.matchAll(WORD)) {
            const word = m[0];
            if (HE_PARTICLE.test(word) || PRESENTATION_ONLY.test(word)) continue;

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

            // Two different non-Latin alphabets in one word is never intentional.
            const clash = nonLatin.length > 1;
            // A lone foreign letter in an otherwise clean word = a swapped glyph.
            const stray = minority.every(([, n]) => n === 1) && topN >= 2;

            if (!clash && !stray) continue;

            hits.push({
                file: file.replace(/\\/g, '/'),
                line: i + 1,
                word,
                kind: clash ? 'script clash' : 'stray letter',
                scripts: ranked.map(([n, c]) => `${n}×${c}`).join(' + '),
                context: line.trim().slice(0, 100)
            });
        }
    });
}

if (hits.length) {
    console.error(`\n✗ ${hits.length} corrupted word(s):\n`);
    for (const h of hits) {
        const marked = [...h.word]
            .map((c) => {
                const s = scriptOf(c);
                return s ? `${c}[${s[0]}]` : c;
            })
            .join('');
        console.error(`  ${h.file}:${h.line}  ${h.kind} — ${h.scripts}`);
        console.error(`      ${h.word}   →   ${marked}`);
        console.error(`      ${h.context}\n`);
    }
    console.error('  Fix: retype the word in a single alphabet.\n');
    process.exit(1);
}

console.log(`✓ no mixed-script words — ${files.length} files scanned.`);
