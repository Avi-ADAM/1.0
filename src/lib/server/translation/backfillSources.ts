/**
 * What the backfill walks, and why exactly that (§15.3.2 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * §8.2 ranked "public / SEO surfaces" second. P3 promotes it to first and
 * *defines* it, because "the strings a guest can reach" is not a guess: it is
 * whatever the `(regandnon)` loaders hand to `translateSurface`. This file
 * derives the corpus from those same builders rather than from a fresh walk of
 * the manifest.
 *
 * **The one rule this file exists to hold.** The cache is content-addressed,
 * so a row is only ever found by a page that hashes *byte for byte* the same
 * string. A walker that flattened `descrip` even slightly differently from the
 * loader would spend the whole free quota filling rows no page can look up —
 * and it would look like it worked, because nothing errors. So every string
 * below comes out of the same function the surface uses:
 *
 *   · a directory card            → the directory's own normalizer
 *                                   (`normalizeMissionCard`, `…ResourceCard`,
 *                                   `…ProjectCard`, `…ProductCard`), which is
 *                                   where `excerptOf` cuts the 220 characters
 *   · an entity's own page        → `plainForTranslation` from `richText.js`,
 *                                   reached through the surface's builder
 *   · every surface's grouping    → the `…Groups` builders in `surfaces.ts`
 *   · the field filter and hash   → `collect()` from `collect.ts`
 *
 * Nothing here re-implements any of them. The walker makes the card the way
 * the loader makes it and hands it to the builder the loader calls, so it
 * cannot even choose a different field.
 *
 * **Hidden rikmot are not walked.** Every directory loader drops the projects
 * in `hiddenProjects.ts`; a walker that did not would fill test rikmot nobody
 * can reach from a directory.
 *
 * **One walk per entity, several surfaces per walk.** A source that feeds no
 * enabled surface is skipped (see `activeSources`): a row no enabled loader
 * will ever query is spend with no reader. Surfaces §7 has not reached yet add
 * a row here when they are turned on — and until then the demand log
 * (`demand.ts`) is what catches strings no walker reaches, because it records
 * actual misses from any surface at all.
 */

import { collect } from '$lib/translation/collect.js';
import {
    normalizeMissionCard,
    normalizeProductCard,
    normalizeProjectCard,
    normalizeResourceCard
} from '$lib/server/discovery/normalizeCards.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';
import {
    missionCardGroups,
    missionDetailGroups,
    productCardGroups,
    projectCardGroups,
    projectDetailGroups,
    resourceCardGroups,
    resourceDetailGroups
} from './surfaces.js';
import type { SurfaceKey } from './config.js';
import type { TranslatableString } from '$lib/translation/types.js';

/** Strings tagged with the surface that makes them reachable. */
export interface SourceGroup {
    surface: SurfaceKey;
    strings: TranslatableString[];
}

export interface BackfillSource {
    /** `--only` takes these. */
    key: string;
    label: string;
    /** The paged corpus query. Its filter defines "reachable with no session". */
    qid: string;
    /** Every surface this walk can feed. */
    surfaces: SurfaceKey[];
    /**
     * Priority tier, low first. 1 is public and anonymous — the readers §15
     * is for. Everything a signed-in reader sees waits.
     */
    tier: number;
    /** Where the rows live in the qid's response. */
    rowsOf(res: unknown): unknown[];
    /** Total row count, for `--status`. Null when the response carried none. */
    totalOf(res: unknown): number | null;
    /** One raw Strapi node, in the shapes the loaders would produce from it. */
    strings(node: unknown): SourceGroup[];
}

type Node = { id?: unknown; attributes?: Record<string, any> | null };

function pagedRows(key: string) {
    return (res: unknown) => {
        const data = (res as any)?.data?.[key]?.data;
        return Array.isArray(data) ? data : [];
    };
}

function pagedTotal(key: string) {
    return (res: unknown) => {
        const total = (res as any)?.data?.[key]?.meta?.pagination?.total;
        return Number.isFinite(total) ? Number(total) : null;
    };
}

/** One surface's strings, straight out of the loader's own builder. */
function group(surface: SurfaceKey, groups: Record<string, unknown[]>): SourceGroup {
    return { surface, strings: collect(groups as never) };
}

/** A card normalizer returns null for a node it would not render. */
function cardList(card: unknown): unknown[] {
    return card ? [card] : [];
}

/**
 * `/availableMission` and `/availableMission/[id]`.
 *
 * Two shapes out of one node, because they are two different strings: a card
 * shows 220 characters and the page shows all of them, and content addressing
 * lets the two coexist at the cost of one extra row (§12). Both are worth
 * having — the card row is what an anonymous reader hits first, the page row
 * is what they read once they click.
 */
const openMissionSource: BackfillSource = {
    key: 'openMission',
    label: 'open missions — the public directory and each mission page',
    qid: '315backfillMissions',
    surfaces: ['availableMission', 'missionDetail'],
    tier: 1,
    rowsOf: pagedRows('openMissions'),
    totalOf: pagedTotal('openMissions'),

    strings(node: unknown): SourceGroup[] {
        const n = node as Node;
        if (!n?.attributes || isHiddenProject(n.attributes.project?.data?.id)) return [];

        return [
            group('availableMission', missionCardGroups(cardList(normalizeMissionCard(n as never)))),
            group('missionDetail', missionDetailGroups(n))
        ];
    }
};

/**
 * `/availiableResorce` and `/availiableResorce/[id]` — the same two-shape
 * split as missions. On the resource's own page `descrip` is plain text, so
 * below the card's 220-character cut the two surfaces hash the same string and
 * the second one is free.
 */
const openMashaabimSource: BackfillSource = {
    key: 'openMashaabim',
    label: 'requested resources — the public directory and each resource page',
    qid: '317backfillResources',
    surfaces: ['availableResource', 'resourceDetail'],
    tier: 1,
    rowsOf: pagedRows('openMashaabims'),
    totalOf: pagedTotal('openMashaabims'),

    strings(node: unknown): SourceGroup[] {
        const n = node as Node;
        if (!n?.attributes || isHiddenProject(n.attributes.project?.data?.id)) return [];

        return [
            group('availableResource', resourceCardGroups(cardList(normalizeResourceCard(n as never)))),
            group('resourceDetail', resourceDetailGroups(n))
        ];
    }
};

/**
 * `/project` and `/project/[id]`. The card shows the name and an excerpt; the
 * page shows the whole description and the names of the rikma's open missions
 * and products.
 */
const projectSource: BackfillSource = {
    key: 'project',
    label: 'rikmot — the public directory and each rikma page',
    qid: '318backfillProjects',
    surfaces: ['projectDirectory', 'projectDetail'],
    tier: 1,
    rowsOf: pagedRows('projects'),
    totalOf: pagedTotal('projects'),

    strings(node: unknown): SourceGroup[] {
        const n = node as Node;
        if (!n?.attributes || isHiddenProject(n.id as string | number | null)) return [];

        return [
            group('projectDirectory', projectCardGroups(cardList(normalizeProjectCard(n as never)))),
            group('projectDetail', projectDetailGroups(n))
        ];
    }
};

/** `/gift` — the products directory. One shape; the product page is not a surface yet. */
const matanotSource: BackfillSource = {
    key: 'matanot',
    label: 'products — the public directory',
    qid: '319backfillProducts',
    surfaces: ['productDirectory'],
    tier: 1,
    rowsOf: pagedRows('matanots'),
    totalOf: pagedTotal('matanots'),

    strings(node: unknown): SourceGroup[] {
        const n = node as Node;
        if (!n?.attributes || isHiddenProject(n.attributes.projectcreates?.data?.[0]?.id)) return [];

        return [group('productDirectory', productCardGroups(cardList(normalizeProductCard(n as never))))];
    }
};

/**
 * Every source, tier order. `--only` filters this list by `key`.
 *
 * All four are tier 1 — public and anonymous — and within a tier the order is
 * §7.1's: reader count over integration cost, missions first.
 */
export const BACKFILL_SOURCES: BackfillSource[] = [
    openMissionSource,
    openMashaabimSource,
    projectSource,
    matanotSource
];

export function sourceByKey(key: string): BackfillSource | null {
    return BACKFILL_SOURCES.find((s) => s.key === key) ?? null;
}

/**
 * The sources worth walking, given which surfaces actually read the cache.
 *
 * A source whose every surface is off is skipped entirely: filling rows that
 * no enabled loader will ever query is the one way this worker could spend a
 * day's free quota and change nothing on the site.
 */
export function activeSources(
    enabled: (surface: SurfaceKey) => boolean,
    only?: string[]
): BackfillSource[] {
    const wanted = only && only.length ? new Set(only) : null;
    return BACKFILL_SOURCES.filter((s) => {
        if (wanted && !wanted.has(s.key)) return false;
        return s.surfaces.some((surface) => enabled(surface));
    }).sort((a, b) => a.tier - b.tier);
}

/**
 * The distinct strings one node contributes, for the surfaces that are on.
 *
 * Deduplicated by hash across surfaces — a mission name is the same string on
 * the card and on the page, and the cache would store it once anyway.
 */
export function stringsForNode(
    source: BackfillSource,
    node: unknown,
    enabled: (surface: SurfaceKey) => boolean
): TranslatableString[] {
    const seen = new Map<string, TranslatableString>();
    for (const group of source.strings(node)) {
        if (!enabled(group.surface)) continue;
        for (const s of group.strings) {
            if (!seen.has(s.hash)) seen.set(s.hash, s);
        }
    }
    return [...seen.values()];
}
