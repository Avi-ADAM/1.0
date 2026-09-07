/**
 * The translatable-field manifest — the single source of truth for *what*
 * user-written text may be translated (§3 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * Three consumers read this one table:
 *   1. the runtime collector (`collect.ts`) — what a loader hands to the cache;
 *   2. the backfill walker (P3) — what it enumerates;
 *   3. `npm run check:translatable` — asserts every `entity.field` named here
 *      still exists in `src/generated/STRAPI_SCHEMA_REFERENCE.md`, so a Strapi
 *      rename fails CI instead of silently disabling a surface.
 *
 * Plain `.js` with JSDoc types on purpose, exactly like
 * `src/lib/translations/routes.js` and `src/routes/api/send/qidsAccess.js`:
 * the checker is a dependency-free node script and imports the real module
 * rather than re-parsing it, which is the only way a manifest and its checker
 * cannot drift. App code gets the same types through JSDoc.
 *
 * @typedef {import('./types.js').TranslationMode} TranslationMode
 * @typedef {{ mode: TranslationMode, max: number, note?: string }} FieldSpec
 * @typedef {{ entity: string, fields: Record<string, FieldSpec> }} EntitySpec
 */

/**
 * Fields that may be translated, per entity.
 *
 * `max` is the length above which a value is skipped rather than truncated —
 * a 4 000-character description is one request's whole budget and almost
 * certainly a paste, not prose someone will read in five languages.
 *
 * @type {Record<string, EntitySpec>}
 */
export const TRANSLATABLE = {
    project: {
        entity: 'Project',
        fields: {
            // §4.3 open question 1: translated as prose, not treated as a brand.
            // On this site a projectName is usually descriptive Hebrew
            // ("רקמת פיתוח קהילתי"), not a trademark. A per-project
            // `nameIsBrand` override is deferred, deliberately.
            projectName: { mode: 'translate', max: 120 },
            publicDescription: { mode: 'translate', max: 1200 }
            // githublink / twiterlink / linkToWebsite / city: never. A URL has
            // no language, and Project.city is an address, not prose.
        }
    },

    openMission: {
        entity: 'OpenMission',
        fields: {
            name: { mode: 'translate', max: 160 },
            descrip: { mode: 'translate', max: 1200 },
            hearotMeyuchadot: { mode: 'translate', max: 600 }
        }
    },

    openMashaabim: {
        entity: 'OpenMashaabim',
        fields: {
            name: { mode: 'translate', max: 160 },
            descrip: { mode: 'translate', max: 1200 }
            // `spnot` is a free-text note between a rikma and one provider, not
            // public copy — it reaches no anonymous reader and is not worth a
            // request. `linkto` is a URL.
        }
    },

    user: {
        entity: 'UsersPermissionsUser',
        fields: {
            // A person's name is transliterated, never translated: בָּרוּךְ must
            // not become "Blessed" (§4.3).
            username: { mode: 'transliterate', max: 60 },
            bio: { mode: 'translate', max: 800 },
            city: { mode: 'transliterate', max: 60 }
        }
    },

    matanot: {
        entity: 'Matanot',
        fields: {
            name: { mode: 'translate', max: 160 }
            // `desc` is a JSON column (rich-text blocks), not a string. Feeding
            // structured JSON to a translator is how markup gets invented; a
            // block-aware collector is its own piece of work, not this one's.
        }
    }

    // Deliberately absent, with reasons:
    //
    // - Forum `subject` / Message bodies — §7 puts chat last and on-demand
    //   only: highest volume on the site, lowest value per string, and a
    //   backfill over it would eat the free quota for months. It gets a
    //   per-message "translate" button, not a manifest entry.
    // - Decision / negotiation claims — a counter-claim is a legal-ish
    //   statement both parties sign. A machine paraphrase next to a signature
    //   is worse than Hebrew the reader can paste elsewhere.
    // - Anything already covered by `$t()`. The inverse regression to watch
    //   for is a developer routing UI text through here to avoid adding a JSON
    //   key — that would make chrome text non-deterministic, unreviewable and
    //   billed. `$t()` stays the only path for anything the platform says.
    // - The site-share `note` and every other machine-structured string: parse
    //   it (`parseSiteShareNote`) and translate the *rendered label* through
    //   `$t()`, never the raw string.
};

/** Every manifest key, e.g. `['project', 'openMission', …]`. */
export const ENTITY_KEYS = /** @type {Array<keyof typeof TRANSLATABLE>} */ (
    Object.keys(TRANSLATABLE)
);

/**
 * The spec for one `entityKey.field`, or null when the pair is not in the
 * manifest. Every runtime path goes through this — "is this field
 * translatable" is never answered by convention at a call site.
 *
 * @param {string} entityKey
 * @param {string} field
 * @returns {FieldSpec | null}
 */
export function fieldSpec(entityKey, field) {
    const entity = TRANSLATABLE[entityKey];
    if (!entity) return null;
    return entity.fields[field] ?? null;
}

/**
 * Flat `[{ entityKey, entity, field, ...spec }]` — what the checker asserts
 * against the generated schema and what the backfill walker enumerates.
 *
 * @returns {Array<{ entityKey: string, entity: string, field: string, mode: TranslationMode, max: number }>}
 */
export function flatFields() {
    const out = [];
    for (const [entityKey, spec] of Object.entries(TRANSLATABLE)) {
        for (const [field, f] of Object.entries(spec.fields)) {
            out.push({ entityKey, entity: spec.entity, field, mode: f.mode, max: f.max });
        }
    }
    return out;
}
