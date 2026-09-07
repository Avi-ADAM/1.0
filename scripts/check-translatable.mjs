#!/usr/bin/env node
/**
 * check-translatable — keep the UGC translation manifest honest.
 *
 * `src/lib/translation/fields.js` names entity fields by hand. A Strapi rename
 * (or a field that never existed because it was typed from memory) makes the
 * collector read `undefined` at runtime: no crash, no warning, the surface just
 * silently stops being translatable. That is the same failure class
 * `validate:qids` and `check:i18n` exist for, and it gets the same treatment —
 * a check that fails CI instead of a convention nobody re-reads.
 *
 * It asserts, against `src/generated/STRAPI_SCHEMA_REFERENCE.md`:
 *   1. every `entity` in the manifest is a real content type;
 *   2. every `field` exists on it;
 *   3. the field is a String (never a JSON, relation, enum or date column —
 *      handing structured JSON to a translator is how markup gets invented);
 *   4. `mode` and `max` are sane.
 *
 * Regenerate the reference with `npm run types:update` before trusting a
 * failure here — a stale reference reports a field that does exist.
 *
 * Usage: npm run check:translatable
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const REF = path.join(ROOT, 'src/generated/STRAPI_SCHEMA_REFERENCE.md');
const MANIFEST = path.join(ROOT, 'src/lib/translation/fields.js');

/* ── the generated schema, as `entity → field → type` ───────────────────── */

/** @returns {Map<string, Map<string, string>>} */
function loadSchema(file) {
    const entities = new Map();
    let current = null;

    for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
        const heading = line.match(/^### (\w+)\s*$/);
        if (heading) {
            current = new Map();
            entities.set(heading[1], current);
            continue;
        }
        if (!current) continue;

        // | `fieldName` | `Maybe<Scalars['String']['output']>` |
        const row = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/);
        if (row) current.set(row[1], row[2]);
    }
    return entities;
}

const isStringField = (type) => /Scalars\['String'\]/.test(type);

/* ── run ────────────────────────────────────────────────────────────────── */

if (!fs.existsSync(REF)) {
    console.error(`✖ missing ${path.relative(ROOT, REF)} — run \`npm run types:update\` first.`);
    process.exit(1);
}

const schema = loadSchema(REF);
const { TRANSLATABLE, flatFields } = await import(pathToFileURL(MANIFEST).href);

const MODES = new Set(['translate', 'transliterate']);
const errors = [];
const warnings = [];

for (const [entityKey, spec] of Object.entries(TRANSLATABLE)) {
    if (!spec?.entity) {
        errors.push(`${entityKey}: no \`entity\` — which Strapi content type is this?`);
        continue;
    }
    if (!schema.has(spec.entity)) {
        errors.push(
            `${entityKey}: content type \`${spec.entity}\` is not in the generated schema. ` +
                `Renamed in Strapi, or a typo?`
        );
        continue;
    }
    if (!spec.fields || Object.keys(spec.fields).length === 0) {
        warnings.push(`${entityKey}: no fields — the entry does nothing.`);
    }
}

for (const { entityKey, entity, field, mode, max } of flatFields()) {
    const fields = schema.get(entity);
    if (!fields) continue; // already reported above

    const type = fields.get(field);
    if (!type) {
        errors.push(`${entityKey}.${field}: \`${entity}.${field}\` does not exist in the schema.`);
        continue;
    }
    if (!isStringField(type)) {
        errors.push(
            `${entityKey}.${field}: \`${entity}.${field}\` is \`${type}\`, not a String. ` +
                `Only plain text is translatable — a JSON/rich-text column needs a block-aware ` +
                `collector, not a manifest entry.`
        );
    }
    if (!MODES.has(mode)) {
        errors.push(`${entityKey}.${field}: mode \`${mode}\` is not translate|transliterate.`);
    }
    if (!Number.isInteger(max) || max <= 0) {
        errors.push(`${entityKey}.${field}: \`max\` must be a positive integer, got ${max}.`);
    }
}

const total = flatFields().length;

for (const w of warnings) console.warn(`⚠ ${w}`);

if (errors.length) {
    console.error(`\n✖ check:translatable — ${errors.length} problem(s):\n`);
    for (const e of errors) console.error(`   ${e}`);
    console.error('');
    process.exit(1);
}

console.log(
    `✓ check:translatable — ${total} field(s) across ` +
        `${Object.keys(TRANSLATABLE).length} entities match the generated schema.`
);
