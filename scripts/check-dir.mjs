#!/usr/bin/env node
/**
 * check-dir — fail on layout that is written for one direction only.
 *
 * The page's direction comes from `<html dir>`, which the server sets from the
 * locale (docs/done/PLAN_LTR_LAYOUT.md §0). Everything under it has to be
 * *logical* — `ms-`/`me-`, `start-`/`end-`, `text-start`, `margin-inline-start`
 * — so the same markup lays out right-to-left in he/ar and left-to-right in
 * en/es/ru. A physical `ml-4` or `text-align: right` looks right in Hebrew and
 * mirrored-wrong in English, and nothing else notices.
 *
 * This walks the screens already converted (ROOTS / FILES) and fails on:
 *   1. a hard-coded `dir="rtl"`;
 *   2. `dir="auto"` on a layout container (one Hebrew name flips the whole form);
 *   3. physical Tailwind: `ml-/mr-/pl-/pr-`, `left-/right-`, `text-left/right`,
 *      `rounded-l/r/tl/tr/bl/br`, `border-l/r`, a bare `space-x-reverse`;
 *   4. physical CSS inside `<style>`: `margin|padding|border-left|right:`,
 *      `left:`/`right:`, `text-align: left|right`, `float: left|right`,
 *      `direction: rtl`;
 *   5. globally: `direction: rtl` on body/html in app.postcss, and an app.html
 *      `<html>` without `dir="%dir%"`.
 *
 * Not flagged: centring (`left-1/2`, `left: 50%`), `auto`, rules whose selector
 * already names a direction (`[dir='rtl'] …`, `:dir(ltr)`), `@keyframes`, and
 * anything inside `<script>`.
 *
 * A deliberate exception carries `dir-ok: <why>` in a comment on the same line
 * or the line above — a field that is `dir="ltr"` in every locale (URL, email,
 * code), a toggle whose two halves are physical, text that is Hebrew on purpose.
 *
 * Adding a screen: convert it, append it to ROOTS (or FILES), run this.
 * Usage: npm run check:dir
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The whole site. Stages 2–4 of PLAN_LTR_LAYOUT converted everything; what is
 * physical on purpose is either in SKIP below or carries a `dir-ok` comment.
 */
const ROOTS = ['src/lib', 'src/routes'];

const FILES = [];

/** Stylesheets checked as plain CSS. */
const CSS_FILES = [
    'src/app.postcss',
    'src/lib/styles/onboard.css',
    'src/lib/styles/concierge.css',
    'src/lib/styles/growth.css',
    'src/lib/styles/shop.css'
];

const OK = /dir-ok\b/;
const HALF = /(^|[-\[])(1\/2|50%|\[50%\])/;
const B = String.raw`(?:^|[\s"'\x60{(])`;
const V = String.raw`(?:[\w\[\]&:.-]+?:)*`;
// A real Tailwind value and a token end — `pl-card-name` is a custom class, not padding-left.
const END = String.raw`(?=[\s"'\x60}]|$)`;
const VAL = String.raw`(?:\d+(?:\.\d+)?|px|auto|full|\d+\/\d+|\[[^\]\s]+\])`;
const RSIZE = String.raw`(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]\s]+\]))?`;
const BVAL = String.raw`(?:-(?:\d+|\[[^\]\s]+\]|[a-z]+(?:-\d{2,3})?(?:\/\d+)?))?`;
const TW = [
    [new RegExp(B + V + String.raw`-?(?:m|p)(?:l|r)-` + VAL + END), 'physical margin/padding (use ms-/me-/ps-/pe-)'],
    [new RegExp(B + V + String.raw`-?(?:left|right)-(` + VAL + ')' + END), 'physical inset (use start-/end-)', (m) => !HALF.test(m[1])],
    [new RegExp(B + V + String.raw`text-(?:left|right)` + END), 'text-left/right (use text-start/end)'],
    [new RegExp(B + V + String.raw`rounded-(?:l|r|tl|tr|bl|br)` + RSIZE + END), 'physical rounding (use rounded-s/e/ss/se/es/ee)'],
    [new RegExp(B + V + String.raw`border-(?:l|r)` + BVAL + END), 'physical border (use border-s/e)'],
    [new RegExp(B + String.raw`(?:space|divide)-x-reverse(?![\w-])`), 'bare space-x-reverse (use rtl:space-x-reverse)']
];
const CSS = [
    [/(?<![\w-])(?:margin|padding)-(?:left|right)\s*:/, 'margin/padding-left/right (use -inline-start/end)'],
    [/(?<![\w-])border-(?:left|right)(?:-\w+)?\s*:/, 'border-left/right (use border-inline-start/end)'],
    [/(?<![\w-])(?:left|right)\s*:\s*([^;}\n]+)/, 'left:/right: (use inset-inline-start/end)', (m) => !/50%|auto/.test(m[1])],
    [/text-align\s*:\s*(?:left|right)\b/, 'text-align: left/right (use start/end)'],
    [/float\s*:\s*(?:left|right)\b/, 'float: left/right (use inline-start/end)'],
    [/direction\s*:\s*rtl/, 'direction: rtl (inherit from <html dir>)']
];

/**
 * Inside a root but deliberately physical: charts, whose left/right is data
 * (a time axis, a packed-circle layout), not reading order.
 */
const SKIP = [
    'src/lib/components/prPr/gantt/',
    'src/lib/components/prPr/graph/',
    // Mail is laid out in the *recipient's* language, not the page's; it sets
    // its own direction per message.
    'src/lib/components/mail/',
    // Hebrew on purpose: the Hebrew source fields of the translation tool, and
    // the Hebrew column of the AI guide's term table.
    'src/lib/components/main/translatehe.svelte',
    'src/routes/guid/ai/+page.svelte',
    // a developer test page
    'src/routes/searchtest/'
];

// A tag that carries dir="ltr", and everything inside it, is left-to-right in
// every locale — there `start` is left in Hebrew too, so physical is correct.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const TAG = /<\/?([a-zA-Z][\w:.-]*)((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*?)(\/?)>/g;
function ltrRanges(markup) {
    const stack = [];
    const ranges = [];
    let m;
    TAG.lastIndex = 0;
    while ((m = TAG.exec(markup))) {
        const [whole, name, attrs, selfClose] = m;
        if (whole.startsWith('</')) {
            const i = stack.map((s) => s.name).lastIndexOf(name);
            if (i >= 0) {
                const s = stack.splice(i)[0];
                if (s.ltr) ranges.push([s.start, m.index + whole.length]);
            }
            continue;
        }
        const ltr = /\bdir=["']ltr["']/.test(attrs);
        if (selfClose || VOID.has(name.toLowerCase()) || name.startsWith('svelte:')) {
            if (ltr) ranges.push([m.index, m.index + whole.length]);
            continue;
        }
        stack.push({ name, ltr, start: m.index });
    }
    for (const s of stack) if (s.ltr) ranges.push([s.start, markup.length]);
    return ranges;
}
/** Class names used inside a dir="ltr" subtree — their CSS stays physical too. */
function ltrClassesOf(markup, ranges) {
    const out = new Set();
    for (const [a, b] of ranges)
        for (const c of markup.slice(a, b).matchAll(/class(?::([\w-]+)|=\s*["'{]([^"'}]*))/g))
            (c[1] ? [c[1]] : c[2].split(/\s+/)).forEach((x) => x && out.add(x));
    return out;
}

const problems = [];
const report = (file, line, why, text) =>
    problems.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${line}  ${why}\n      ${text.trim().slice(0, 140)}`);

/** Same-length blanking keeps line numbers. */
const blank = (s) => s.replace(/[^\n]/g, ' ');

function checkCss(file, css, lines, offsetLine = 0, ltrClasses = new Set()) {
    // drop @keyframes bodies, then walk rule by rule so a selector that already
    // names a direction can scope its own physical values
    const noKf = css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, blank);
    const ruleRe = /([^{}]*)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(noKf))) {
        const selector = m[1];
        if (/\[dir|:dir\(|\.rtl\b|\.ltr\b/.test(selector)) continue;
        // a rule that sets its own direction (a code block, an LTR field)
        if (/direction\s*:\s*ltr/.test(m[2])) continue;
        if ([...selector.matchAll(/\.([\w-]+)/g)].some((c) => ltrClasses.has(c[1]))) continue;
        const bodyStart = m.index + m[1].length + 1;
        for (const [re, why, keep] of CSS) {
            const g = new RegExp(re.source, 'g');
            let h;
            while ((h = g.exec(m[2]))) {
                if (keep && !keep(h)) continue;
                const ln = noKf.slice(0, bodyStart + h.index).split('\n').length + offsetLine;
                if (OK.test(lines[ln - 1] ?? '') || OK.test(lines[ln - 2] ?? '')) continue;
                report(file, ln, why, lines[ln - 1] ?? '');
            }
        }
    }
}

function checkSvelte(file) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    // markup = no <script>, no <style>, no comments (all blanked, so lines hold)
    let markup = src
        .replace(/<script[\s\S]*?<\/script>/g, blank)
        .replace(/<style[\s\S]*?<\/style>/g, blank)
        .replace(/<!--[\s\S]*?-->/g, (c) => (OK.test(c) ? c : blank(c)));
    const ranges = ltrRanges(markup);
    const inLtr = (i) => ranges.some(([a, b]) => i >= a && i < b);
    let off = 0;
    markup.split('\n').forEach((l, i) => {
        const start = off;
        off += l.length + 1;
        if (OK.test(l) || OK.test(lines[i - 1] ?? '')) return;
        if (/\bdir=["']rtl["']/.test(l)) report(file, i + 1, 'hard-coded dir="rtl" (inherit from <html dir>)', lines[i]);
        if (/<(div|section|main|form|article|ul|ol|table|aside|header|footer)\b[^>]*\bdir=["']auto["']/.test(l))
            report(file, i + 1, 'dir="auto" on a layout container (put it on the text element)', lines[i]);
        for (const [re, why, keep] of TW) {
            const h = re.exec(l);
            if (h && (!keep || keep(h)) && !inLtr(start + h.index)) report(file, i + 1, why, lines[i]);
        }
    });
    const ltrClasses = ltrClassesOf(markup, ranges);
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let s;
    while ((s = styleRe.exec(src))) {
        const before = src.slice(0, s.index + s[0].indexOf('>') + 1).split('\n').length - 1;
        checkCss(file, s[1], lines, before, ltrClasses);
    }
}

const files = FILES.map((f) => path.join(ROOT, f));
for (const r of ROOTS) {
    const abs = path.join(ROOT, r);
    if (!fs.existsSync(abs)) {
        console.error(`✖ root does not exist: ${r} — moved or renamed?`);
        process.exit(1);
    }
    (function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (
                e.name.endsWith('.svelte') &&
                !e.name.includes('.test.') &&
                !/\.(dead|unused|backup)/.test(e.name) &&
                !SKIP.some((s) => path.relative(ROOT, p).replace(/\\/g, '/').startsWith(s))
            )
                files.push(p);
        }
    })(abs);
}
for (const f of files) checkSvelte(f);
for (const f of CSS_FILES) {
    const abs = path.join(ROOT, f);
    const src = fs.readFileSync(abs, 'utf8');
    checkCss(abs, src.replace(/\/\*[\s\S]*?\*\//g, (c) => (OK.test(c) ? c : blank(c))), src.split(/\r?\n/));
}

// global: the direction has one source
const postcss = fs.readFileSync(path.join(ROOT, 'src/app.postcss'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
if (/(^|[\s,}])(html|body)\s*\{[^}]*direction\s*:\s*rtl/m.test(postcss))
    problems.push('src/app.postcss  `direction: rtl` on html/body — the direction comes from <html dir>');
const appHtml = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8');
if (!/<html[^>]*dir="%dir%"/.test(appHtml)) problems.push('src/app.html  <html> has no dir="%dir%"');

if (problems.length) {
    console.error(`✖ ${problems.length} direction problem(s) — see docs/done/PLAN_LTR_LAYOUT.md\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}
console.log(`✓ direction OK — ${files.length + CSS_FILES.length} files are logical (start/end), <html dir> is the only source.`);
