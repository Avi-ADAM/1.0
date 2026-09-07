/**
 * The runtime collector (§4.1) — turns data a loader has **already fetched**
 * into the list of strings worth looking up in the translation cache.
 *
 * It costs nothing: no query, no network, no LLM. It walks values that are
 * already in memory, filters them through the manifest (`fields.js`) and the
 * cheap worthlessness pre-filter (`isWorthTranslating`), and hands back hashes.
 *
 * Deliberately Strapi-shape-tolerant. A loader may hold an entity as
 * `{ id, attributes: {…} }` (raw qid response), as `{ id, …fields }` (already
 * flattened by a builder), or as a bare attributes object — all three are
 * common in this repo and none of them is worth a normalization pass at every
 * call site.
 */

import { TRANSLATABLE, fieldSpec } from './fields.js';
import { hashSource, isWorthTranslating, normalizeForHash } from './normalize.js';
import type { TranslatableString } from './types.js';

/** Anything a loader might be holding an entity in. */
type EntityLike =
    | { id?: string | number; attributes?: Record<string, unknown> }
    | Record<string, unknown>
    | null
    | undefined;

function attrs(entity: EntityLike): Record<string, unknown> {
    if (!entity || typeof entity !== 'object') return {};
    const withAttributes = entity as { attributes?: Record<string, unknown> };
    if (withAttributes.attributes && typeof withAttributes.attributes === 'object') {
        return withAttributes.attributes;
    }
    return entity as Record<string, unknown>;
}

function idOf(entity: EntityLike): string {
    if (!entity || typeof entity !== 'object') return '';
    const id = (entity as { id?: unknown }).id;
    return id == null ? '' : String(id);
}

/**
 * Collect the translatable strings of **one** entity.
 *
 * Returns at most one entry per manifest field, and none at all for a field
 * that is absent, empty, over its `max`, or not worth translating (a URL, a
 * bare number, a string with no letters in it).
 */
export function collectFromEntity(entityKey: string, entity: EntityLike): TranslatableString[] {
    const spec = TRANSLATABLE[entityKey];
    if (!spec) return [];

    const a = attrs(entity);
    const id = idOf(entity);
    const out: TranslatableString[] = [];

    for (const field of Object.keys(spec.fields)) {
        const f = fieldSpec(entityKey, field);
        if (!f) continue;

        const raw = a[field];
        if (typeof raw !== 'string') continue;

        const source = normalizeForHash(raw);
        if (!isWorthTranslating(source)) continue;
        if (source.length > f.max) continue;

        out.push({
            path: `${entityKey}.${field}`,
            field,
            entityKey,
            id,
            mode: f.mode,
            source,
            hash: hashSource(source)
        });
    }

    return out;
}

/** Collect over a list of entities of the same kind. */
export function collectFromList(entityKey: string, entities: EntityLike[]): TranslatableString[] {
    if (!Array.isArray(entities)) return [];
    return entities.flatMap((e) => collectFromEntity(entityKey, e));
}

/**
 * Collect across several kinds at once, and **deduplicate by hash**.
 *
 * The dedup is the point, not a nicety: a list page routinely shows the same
 * rikma name on thirty cards, and the cache is content-addressed, so those
 * thirty occurrences are one lookup and — later — one paid request.
 *
 * @example
 * const strings = collect({ project: projects, openMission: missions });
 */
export function collect(groups: Record<string, EntityLike[]>): TranslatableString[] {
    const seen = new Map<string, TranslatableString>();
    for (const [entityKey, entities] of Object.entries(groups ?? {})) {
        for (const s of collectFromList(entityKey, entities)) {
            if (!seen.has(s.hash)) seen.set(s.hash, s);
        }
    }
    return [...seen.values()];
}

/** The distinct hashes of a collected set, in stable order — the query input. */
export function hashesOf(strings: TranslatableString[]): string[] {
    return [...new Set((strings ?? []).map((s) => s.hash))];
}
