#!/usr/bin/env node
/**
 * check-ui-hebrew — fail on Hebrew that is written straight into markup.
 *
 * `check:i18n` proves a key exists and is loaded on the route that asks for it.
 * It says nothing about text that never went through `$t()` at all: a label
 * typed into the template is invisible to it, renders in Hebrew for every
 * reader, and no other check notices — `check:script` only looks for words that
 * mix alphabets.
 *
 * Stages 1–3 of docs/inprogress/PLAN_EN_READINESS.md cleaned these screens by
 * hand. This is what keeps them clean: the walker below reads only the markup
 * half of each `.svelte` file (a Hebrew string inside `<script>` is a data
 * comparison — `status === 'הושלם'` — or a value that is indexed by the
 * *recipient's* language, which the i18n section of CLAUDE.md allows), drops
 * comments, and fails on any Hebrew letter that is left.
 *
 * Adding a screen: append its folder to ROOTS and run the script — a screen
 * that is not localised yet will fail, which is the point. Delete the failure
 * by moving its text into `src/lib/translations/<locale>/<namespace>.json`.
 *
 * Usage: npm run check:ui-hebrew
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Screens localised in stages 1–3 of PLAN_EN_READINESS. */
const ROOTS = [
    'src/routes/(reg)/concierge',
    'src/routes/(regandnon)/wish',
    'src/routes/(reg)/moach',
    'src/routes/(reg)/lev',
    'src/routes/(reg)/timers',
    // The public product and open-offer pages (stage 3 §5).
    'src/routes/(regandnon)/gift',
    'src/routes/(regandnon)/availableMission',
    'src/routes/(regandnon)/availiableResorce',
    'src/routes/deals',
    'src/routes/negotiation',
    'src/lib/components/concierge',
    'src/lib/components/products',
    'src/lib/components/process',
    'src/lib/components/deals',
    'src/lib/components/sales',
    'src/lib/components/timers',
    'src/lib/negotiation',
    // Stages 4–5: the order/delivery notes are rendered here (§4.2), and the
    // public about page is now translated word for word (§5.1).
    'src/lib/components/shop',
    // The assistant's rich cards are mounted by the global bot popup.
    'src/lib/chat',
    'src/routes/about',
    // "Supplier in a minute" (PLAN_SUPPLIER_GROWTH SG1), born localised.
    'src/routes/join'
];

/**
 * Single components localised inside a folder that is not clean yet. Adding a
 * whole folder would fail on its other screens; a finished file can still be
 * locked down on its own.
 */
const FILES = [
    'src/lib/components/main/tikunolam.svelte',
    // The full-repo sweep after stages 4–5: screens an English reader reaches
    // (the 404, the hub, /me, /forum, a rikma's join page, the agreement modal).
    'src/lib/components/screens/NotFoundScreen.svelte',
    'src/lib/celim/switch.svelte',
    'src/lib/components/main/amana.svelte',
    'src/routes/(reg)/forum/+page.svelte',
    'src/routes/(reg)/hub/+page.svelte',
    'src/routes/(reg)/me/+page.svelte',
    'src/routes/(regandnon)/project/[id]/join/+page.svelte'
];

/**
 * Lines that are deliberately Hebrew in the markup.
 *
 * A language's own name is not translated: the AI-translation preview labels
 * each draft with the language it is in (`עברית:` / `English:` / `العربية:`),
 * so a reader knows which text is which even when it is not their own.
 */
const ALLOW = [
    {
        file: 'src/lib/components/prPr/mission.svelte',
        match: />(עברית|العربية):</,
        why: 'a language endonym labels its own translation preview'
    }
];

const HEBREW = /[\u0590-\u05FF]/;

/** Markup only: everything after the last `</script>` (or the whole file). */
function markupOf(src) {
    const at = src.lastIndexOf('</script>');
    let out = at === -1 ? src : src.slice(at + '</script>'.length);
    out = out.replace(/<!--[\s\S]*?-->/g, ''); // HTML comments
    out = out.replace(/\/\*[\s\S]*?\*\//g, ''); // CSS/JS block comments
    out = out.replace(/^\s*\/\/.*$/gm, ''); // JS line comments
    return out;
}

const files = [...FILES.map((f) => path.join(ROOT, f))];
for (const root of ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) {
        console.error(`✖ root does not exist: ${root} — moved or renamed?`);
        process.exit(1);
    }
    (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.svelte') && !e.name.includes('.test.')) files.push(p);
        }
    })(abs);
}

const hits = [];
for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const allow = ALLOW.filter((a) => a.file === rel);
    markupOf(fs.readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((line, i) => {
            if (!HEBREW.test(line)) return;
            if (allow.some((a) => a.match.test(line))) return;
            hits.push({ rel, text: line.trim().slice(0, 120) });
        });
}

if (hits.length) {
    console.error(`\n✗ ${hits.length} line(s) of Hebrew written straight into markup:\n`);
    for (const h of hits) console.error(`  ${h.rel}\n      ${h.text}`);
    console.error(
        '\n  Fix: move the text into src/lib/translations/<locale>/<namespace>.json\n' +
            '       and read it with $t(). A literal inside <script> may be fine —\n' +
            '       a data comparison, or a value indexed by the recipient language.\n'
    );
    process.exit(1);
}

console.log(
    `✓ no hard-coded Hebrew in markup — ${files.length} component(s) across ` +
        `${ROOTS.length} roots and ${FILES.length} single file(s).`
);
