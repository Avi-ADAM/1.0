#!/usr/bin/env node
/**
 * check-mixed-script — find text corrupted by characters from the wrong
 * alphabet.
 *
 * A bulk find/replace, or a paste through a tool that "helpfully" transliterates,
 * can leave a single Cyrillic `г` inside a Hebrew word (`מפгש`), an Arabic `وي`
 * at the end of one (`ליווي`), or a Latin `p` where a `פ` belongs (`pתוח`). The
 * word renders as garbage and its RTL sub-runs visually reorder, yet nothing
 * else in the repo notices: it compiles, the key is right, the length is right.
 *
 * This file is the *walker* — which files to read, and how to report. The rule
 * itself lives in `src/lib/translation/mixedScript.js`, because the UGC
 * translation validator applies exactly the same test to machine-translation
 * output (PLAN_UGC_TRANSLATION §5.5) and two copies of it would drift.
 *
 * Usage: npm run check:script
 */
import fs from 'node:fs';
import path from 'node:path';
import { corruptedWords, scriptOf } from '../src/lib/translation/mixedScript.js';

const EXT = /\.(svelte|js|ts|json|md|html)$/;
const SKIP_DIR = new Set(['node_modules', '.git', '.svelte-kit', 'build', 'dist']);
/**
 * Captured API payloads, not authored text. Real user-typed names live in
 * these (a member called `Bבר`) and must not be "corrected".
 */
const SKIP_FILE = [/utils[\\/](new|old)obj\.js$/, /routes[\\/]jenia[\\/]/];

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
        // `escapes: true` — this is source code, so `\nשעות` must not read as
        // Latin + Hebrew. User-written text has no escapes and does not need it.
        for (const c of corruptedWords(line, { escapes: true })) {
            hits.push({
                file: file.replace(/\\/g, '/'),
                line: i + 1,
                word: c.word,
                kind: c.kind,
                scripts: c.scripts,
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
