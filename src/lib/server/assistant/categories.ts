/**
 * The Strapi half of linking an imported product to its domains
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.6). Matching is pure
 * ($lib/assistant/categories.ts); this reads the catalog once per run and
 * creates the few names that match nothing — in the default locale, published,
 * because a relation sees only that row (feedback: Strapi i18n).
 *
 * Runs with the service token inside the materialize step, which has already
 * checked that the caller is creating into their own rikma.
 */

import { matchCategories, type CategoryEntry } from '$lib/assistant/categories.js';
import type { StrapiLike } from './session.js';

/** New domains one run may mint — a model that lists twenty is not a catalog. */
const MAX_NEW_PER_RUN = 6;

export function categoryResolver(strapi: StrapiLike, fetchFn: typeof fetch) {
  let catalog: CategoryEntry[] | null = null;
  let minted = 0;

  async function load(): Promise<CategoryEntry[]> {
    if (catalog) return catalog;
    const res = await strapi.execute('373listCategories', {}, undefined, fetchFn);
    catalog = (res?.data?.categories?.data ?? []).map((c: any) => ({
      id: String(c.id),
      names: [
        c?.attributes?.name,
        ...(c?.attributes?.localizations?.data ?? []).map((l: any) => l?.attributes?.name)
      ].filter((n: unknown): n is string => typeof n === 'string' && !!n.trim())
    }));
    return catalog!;
  }

  return async function resolveCategories(names: string[]): Promise<string[]> {
    const list = await load();
    const { ids, missing } = matchCategories(names, list);
    for (const name of missing) {
      if (minted >= MAX_NEW_PER_RUN) break;
      try {
        const r = await strapi.execute(
          '374createCategory',
          { name, publishedAt: new Date().toISOString() },
          undefined,
          fetchFn
        );
        const id = r?.data?.createCategory?.data?.id;
        if (!id) continue;
        minted++;
        ids.push(String(id));
        // The next product of this run finds it instead of minting it again.
        list.push({ id: String(id), names: [name] });
      } catch (err) {
        console.warn('[assistant/categories] could not create', name, err);
      }
    }
    return ids;
  };
}
