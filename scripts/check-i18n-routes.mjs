#!/usr/bin/env node
/**
 * check-i18n-routes — catch `$t()` keys that render as an EMPTY STRING.
 *
 * A namespace is only available on a page if a loader for it was registered
 * *and* its route gate matches that page. When it isn't, `$t('ns.key')` returns
 * '' — no warning, no crash, just blank UI. That is invisible in a `svelte-check`
 * run and invisible in a key-parity check, because the key does exist in the
 * JSON file; it was simply never fetched.
 *
 * This walks the component import graph from every `+page.svelte` /
 * `+layout.svelte`, collects the namespaces reachable there, and verifies each
 * one against the real gates in `src/lib/translations/routes.js`.
 *
 * It also flags the store being used as a plain object — `t[key]`, `t.foo` —
 * which is what a deleted `const t = { he: …, en: … }` dictionary leaves behind
 * when its lookups stay. `t` still resolves (to the store), so it compiles and
 * renders nothing.
 *
 * Limits: only static `import`s are followed, and only namespaces that appear
 * as a literal prefix in `$t('ns.…')` / `t('ns.…')` are seen — a fully computed
 * key (`$t(someVar)`) is invisible to it. It under-reports, never over-reports.
 *
 * Usage: npm run check:i18n
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TR = 'src/lib/translations';
const { LOCALES, ROUTED } = await import(
    pathToFileURL(path.resolve(TR, 'routes.js')).href
);

/* ---------------- namespaces on disk ---------------- */
const nsFiles = {};
for (const l of LOCALES) {
    nsFiles[l] = new Set(
        fs.readdirSync(path.join(TR, l))
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.slice(0, -5))
    );
}
const knownNs = new Set(Object.values(nsFiles).flatMap((s) => [...s]));

/* ---------------- source files ---------------- */
const all = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            // Skip the translation config itself — its doc comments quote
            // `$t('me.…')` as an example, which would look like a real usage.
            if (e.name !== 'node_modules' && path.normalize(p) !== path.normalize(TR)) walk(p);
        } else if (/\.(svelte|js|ts)$/.test(e.name)) all.push(p);
    }
})('src');

/* ---------------- per-file: namespaces used + local imports ---------------- */
const own = new Map();
const deps = new Map();

/** `t[key]` / `t.foo` — the store used as if it were a dictionary. */
const storeMisuse = [];
// Real sveltekit-i18n store API; `t.get(…)` on the server is correct usage.
const STORE_API = new Set(['get', 'subscribe', 'set', 'update']);

for (const f of all) {
    const raw = fs.readFileSync(f, 'utf8');
    // Block comments routinely quote `$t('ns.key')` as documentation.
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '');

    // The store is often renamed on import — `import { t as trans }`,
    // `{ t as i18nT }`. Collect every local name it goes by in this file.
    const names = new Set(['t']);
    const imported = new Set();
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]\$lib\/translations['"]/g)) {
        for (const part of m[1].split(',')) {
            const alias = part.match(/^\s*t\s+as\s+([A-Za-z0-9_$]+)\s*$/);
            if (alias) {
                names.add(alias[1]);
                imported.add(alias[1]);
            } else if (/^\s*t\s*$/.test(part)) imported.add('t');
        }
    }
    const nsRe = new RegExp(`\\$?\\b(?:${[...names].join('|')})\\(\\s*[\`'"]([a-zA-Z0-9_]+)\\.`, 'g');

    const ns = new Set();
    for (const m of src.matchAll(nsRe)) if (knownNs.has(m[1])) ns.add(m[1]);
    own.set(f, ns);

    // Leftovers of a deleted `const t = { he: …, en: … }` dictionary whose
    // lookups stayed behind. `t` still resolves — to the store — so this
    // compiles cleanly and renders nothing.
    const lines = src.split('\n');
    for (const n of imported) {
        // Re-declared somewhere in the file → the identifier may be a local.
        if (new RegExp(`(?:^|[\\n;{}])\\s*(?:const|let|var|function)\\s+${n}\\b`).test(src)) continue;
        // Bound as a callback param or {#each … as n} → a bare `n.prop` is that.
        const locallyBound =
            new RegExp(`\\(\\s*${n}\\s*[,)]`).test(src) ||
            new RegExp(`\\bas\\s+${n}\\b`).test(src) ||
            new RegExp(`${n}\\s*=>`).test(src);

        lines.forEach((line, i) => {
            if (/^\s*import\b/.test(line)) return;
            const at = `${f.replace(/\\/g, '/')}:${i + 1}`;
            if (new RegExp(`(?<![\\w$.'"\`])${n}\\s*\\[`).test(line)) {
                storeMisuse.push({ at, text: line.trim().slice(0, 110) });
                return;
            }
            if (locallyBound) return;
            for (const m of line.matchAll(new RegExp(`(?<![\\w$.'"\`])${n}\\s*\\.\\s*([A-Za-z0-9_$]+)`, 'g'))) {
                if (!STORE_API.has(m[1])) storeMisuse.push({ at, text: line.trim().slice(0, 110) });
            }
        });
    }

    const d = [];
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1];
        let base;
        if (spec.startsWith('$lib/')) base = path.join('src/lib', spec.slice(5));
        else if (spec.startsWith('./') || spec.startsWith('../')) base = path.join(path.dirname(f), spec);
        else continue;
        for (const cand of [base, `${base}.svelte`, `${base}.js`, `${base}.ts`, `${base}/index.js`, `${base}/index.ts`]) {
            const norm = path.normalize(cand);
            if (fs.existsSync(norm) && fs.statSync(norm).isFile()) {
                d.push(norm);
                break;
            }
        }
    }
    deps.set(f, d);
}

/** Namespaces reachable from `file`, mapped to the file that actually uses them. */
function closure(file, seen = new Set()) {
    if (seen.has(file)) return new Map();
    seen.add(file);
    const out = new Map();
    for (const n of own.get(file) ?? []) if (!out.has(n)) out.set(n, file);
    for (const dep of deps.get(file) ?? []) {
        for (const [n, src] of closure(dep, seen)) if (!out.has(n)) out.set(n, src);
    }
    return out;
}

/* ---------------- routes ---------------- */
/** `src/routes/(reg)/moach/[projectId]/acts/+page.svelte` → `/moach/x/acts` */
function routeOf(file) {
    let p = file.replace(/\\/g, '/')
        .replace(/^src\/routes/, '')
        .replace(/\/\+(page|layout)(\.server)?\.(svelte|js|ts)$/, '');
    p = p.replace(/\/\([^)]*\)/g, '');       // (reg), (regandnon) — route groups
    p = p.replace(/\[\[?[^\]]*\]\]?/g, 'x'); // [id], [kind=votekind], [[opt]]
    return p || '/';
}

const entries = all.filter(
    (f) => /[\\/]\+(page|layout)\.svelte$/.test(f) && f.replace(/\\/g, '/').startsWith('src/routes')
);
const layouts = entries.filter((f) => f.endsWith('+layout.svelte'));

function covered(ns, route) {
    if (!knownNs.has(ns)) return true; // not ours
    const gate = ROUTED[ns];
    if (!gate) return true;            // loaded globally
    return gate.some((r) => r.test(route));
}

/* ---------------- report ---------------- */
const problems = new Map();

for (const entry of entries) {
    const route = routeOf(entry);
    // A layout's imports are mounted on every route beneath it.
    const chain = [entry, ...layouts.filter((l) => routeOf(l) === '/' || route.startsWith(routeOf(l)))];

    const reachable = new Map();
    for (const c of chain) for (const [n, src] of closure(c)) if (!reachable.has(n)) reachable.set(n, src);

    for (const [ns, srcFile] of reachable) {
        if (covered(ns, route)) continue;
        const k = `${ns}@${route}`;
        if (!problems.has(k)) problems.set(k, { ns, route, files: new Set() });
        problems.get(k).files.add(srcFile.replace(/\\/g, '/'));
    }
}

/* ---------------- single-brace placeholders ---------------- */
/**
 * The default parser interpolates `{{name}}`. A value written `{name}` is
 * emitted verbatim, so the user reads the placeholder itself. A handful of
 * call sites deliberately substitute by hand — `$t(k).replace('{name}', x)` —
 * and those are fine; anything else is a bug.
 */
const manualReplace = new Set();
for (const f of all) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\.replace\(\s*['"`]\{([A-Za-z_][A-Za-z0-9_]*)\}['"`]/g)) {
        manualReplace.add(m[1]);
    }
}

const badPlaceholders = [];
/**
 * `@sveltekit-i18n/parser-default` extracts the placeholder name with a regex
 * that needs `.+?` followed by `.` — two characters minimum. `{{n}}` therefore
 * matches nothing, the payload lookup misses, and the placeholder is replaced
 * by the empty default. Names must be at least two characters long.
 */
const shortPlaceholders = [];

for (const locale of LOCALES) {
    for (const ns of nsFiles[locale]) {
        const p = path.join(TR, locale, `${ns}.json`);
        (function walk(node, trail) {
            if (typeof node === 'string') {
                for (const m of node.matchAll(/(?<!\{)\{([A-Za-z_][A-Za-z0-9_]*)\}(?!\})/g)) {
                    if (!manualReplace.has(m[1])) {
                        badPlaceholders.push(`${locale}/${ns}.json  ${trail}  →  {${m[1]}}`);
                    }
                }
                for (const m of node.matchAll(/\{\{\s*([^}:;\s]+)\s*\}\}/g)) {
                    if (m[1].length < 2) {
                        shortPlaceholders.push(
                            `${locale}/${ns}.json  ${trail}  →  {{${m[1]}}}`
                        );
                    }
                }
            } else if (node && typeof node === 'object') {
                for (const [k, v] of Object.entries(node)) walk(v, trail ? `${trail}.${k}` : k);
            }
        })(JSON.parse(fs.readFileSync(p, 'utf8')), '');
    }
}

/* namespaces that exist on disk but nothing ever asks for */
const usedAnywhere = new Set([...own.values()].flatMap((s) => [...s]));
const orphanFiles = [...knownNs].filter((n) => !usedAnywhere.has(n)).sort();

/* locale gaps: a namespace file missing from one locale */
const localeGaps = [];
for (const n of [...knownNs].sort()) {
    const missing = LOCALES.filter((l) => !nsFiles[l].has(n));
    if (missing.length) localeGaps.push(`${n}: missing in ${missing.join(', ')}`);
}

let failed = false;

if (problems.size) {
    failed = true;
    console.error(`\n✗ ${problems.size} namespace/route pair(s) would render EMPTY:\n`);
    for (const { ns, route, files } of [...problems.values()].sort((a, b) => a.ns.localeCompare(b.ns))) {
        console.error(`  ${ns.padEnd(12)} is not loaded on  ${route}`);
        for (const f of [...files].slice(0, 3)) console.error(`      used by ${f}`);
    }
    console.error(`\n  Fix: widen or drop the gate in ${TR}/routes.js\n`);
}

if (storeMisuse.length) {
    failed = true;
    console.error(`✗ ${storeMisuse.length} place(s) use the \`t\` store as a dictionary — they render EMPTY:\n`);
    for (const { at, text } of storeMisuse) console.error(`  ${at}\n      ${text}`);
    console.error(`\n  Fix: call it — \`$t('ns.key')\` / \`$t(\\\`ns.\${expr}\\\`)\`.\n`);
}

if (badPlaceholders.length) {
    failed = true;
    console.error(
        `✗ ${badPlaceholders.length} placeholder(s) written \`{x}\` — the parser wants \`{{x}}\`,\n` +
        `  so the user reads the placeholder itself:\n`
    );
    for (const b of badPlaceholders) console.error(`    ${b}`);
    console.error('');
}

if (shortPlaceholders.length) {
    failed = true;
    console.error(
        `✗ ${shortPlaceholders.length} placeholder name(s) shorter than 2 chars —\n` +
        `  the default parser cannot match them, so they render EMPTY:\n`
    );
    for (const s of shortPlaceholders) console.error(`    ${s}`);
    console.error('\n  Fix: rename it (`{{n}}` → `{{count}}`) here and at the call site.\n');
}

if (localeGaps.length) {
    failed = true;
    console.error(`✗ namespace files missing from some locales:`);
    for (const g of localeGaps) console.error(`    ${g}`);
    console.error('');
}

if (orphanFiles.length) {
    console.warn(`⚠ ${orphanFiles.length} namespace file(s) no $t() call references: ${orphanFiles.join(', ')}\n`);
}

if (!failed) {
    console.log(
        `✓ i18n routes OK — ${knownNs.size} namespaces × ${LOCALES.length} locales, ` +
        `${entries.length} route entry points, ${Object.keys(ROUTED).length} route-gated.`
    );
}

process.exit(failed ? 1 : 0);
