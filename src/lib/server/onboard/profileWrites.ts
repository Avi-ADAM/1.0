/**
 * Profile writes shared by the onboarding save (/api/onboard/save) and the
 * profile assistant's apply (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §6.1): new
 * vocabulary in the default locale, and the member's resources as `sp` rows
 * linked to their mashaabim template. Moved here unchanged from the route.
 */

import { STRAPI_URL as baseUrl } from '$lib/server/strapiUrl.js';

export type SaveItem = { name: string; existingId?: string; descrip?: string };
export type Lang = 'he' | 'en' | 'ar';
export const VALID_LANGS = new Set<Lang>(['he', 'en', 'ar']);


function sanitize(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, ' ').slice(0, 200);
}

export async function gql(query: string, jwt?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
  const res = await fetch(baseUrl + '/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  if (data.errors) {
    console.error('[onboard/save] gql errors', data.errors);
    throw new Error(data.errors[0]?.message ?? 'graphql error');
  }
  return data.data;
}

// Create a vocab record in the **default locale** (Strapi's i18n master entity).
// We never pass `locale:` here — the relation on `users-permissions-user.skills`
// (and friends) only resolves to the master entity. Creating in `he` directly
// produces an entity that the user-relation cannot see, which is exactly the
// bug that made selections "disappear" after save.
// `sourceLang` is forwarded to auto-localize so the original-language label
// is preserved as a localization and Strapi fills in the other locales.
async function createVocab(
  mutationName: string,
  dataObj: Record<string, string>,
  jwt: string,
  _sourceLang: Lang
): Promise<string | null> {
  const d = new Date().toISOString();
  const dataFields = Object.entries(dataObj)
    .map(([k, v]) => `${k}: "${sanitize(v)}"`)
    .join(', ');
  const query = `mutation { ${mutationName}(data: { ${dataFields}, publishedAt: "${d}" }) { data { id } } }`;
  try {
    const result = await gql(query, jwt);
    return result?.[mutationName]?.data?.id ?? null;
  } catch (e) {
    console.warn(`[onboard/save] ${mutationName} failed`, e);
    return null;
  }
}

const VOCAB_MAP: Record<string, { mutation: string; nameField: string }> = {
  skills:  { mutation: 'createSkill',    nameField: 'skillName' },
  roles:   { mutation: 'createTafkidim', nameField: 'roleDescription' },
  methods: { mutation: 'createWorkWay',  nameField: 'workWayName' },
  vallues: { mutation: 'createVallue',   nameField: 'valueName' }
};

export async function resolveIds(category: string, items: SaveItem[], jwt: string, lang: Lang): Promise<string[]> {
  if (!items?.length) return [];
  const cfg = VOCAB_MAP[category];
  if (!cfg) return [];
  const ids: string[] = [];
  for (const it of items) {
    if (it.existingId) {
      ids.push(String(it.existingId));
    } else if (it.name?.trim()) {
      const id = await createVocab(cfg.mutation, { [cfg.nameField]: it.name.trim() }, jwt, lang);
      if (id) {
        ids.push(String(id));
        // Fire-and-forget: auto-translate to other locales so the vocab item is
        // discoverable by users in other languages too.
        const ctMap: Record<string, string> = { skills: 'skills', roles: 'tafkidims', methods: 'work-ways', vallues: 'vallues' };
        const contentType = ctMap[category];
        if (contentType) {
          fetch(new URL('/api/auto-localize/strapi4', baseUrl).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType, entryId: id, sourceLocale: lang })
          }).catch((err) => console.warn('[onboard/save] auto-localize failed', err));
        }
      }
    }
  }
  return ids;
}

/**
 * Resolve a free-text resource name onto a `mashaabim` template, creating the
 * template when nothing matches.
 *
 * This relation is not cosmetic: `src/lib/server/matching/engine.ts` matches a
 * member to an open resource request *solely* by comparing
 * `sp.mashaabim === openMashaabim.mashaabim`. An Sp created without it can
 * never surface to any rikma looking for that exact thing — which is what
 * every resource this endpoint created used to be.
 */
async function resolveMashaabimId(
  name: string,
  jwt: string,
  catalog: Map<string, string>
): Promise<string | null> {
  const key = name.trim().toLowerCase();
  const hit = catalog.get(key);
  if (hit) return hit;
  const d = new Date().toISOString();
  const query = `mutation { createMashaabim(data: {
    name: "${sanitize(name)}",
    kindOf: total,
    publishedAt: "${d}"
  }) { data { id } } }`;
  try {
    const result = await gql(query, jwt);
    const id = result?.createMashaabim?.data?.id;
    if (id) {
      catalog.set(key, String(id));
      return String(id);
    }
  } catch (e) {
    console.warn('[onboard/save] createMashaabim failed', e);
  }
  return null;
}

async function loadMashaabimCatalog(jwt: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const result = await gql(
      `query { mashaabims(pagination: { limit: 500 }) { data { id attributes { name } } } }`,
      jwt
    );
    for (const row of result?.mashaabims?.data ?? []) {
      const n = row?.attributes?.name;
      if (n) map.set(String(n).trim().toLowerCase(), String(row.id));
    }
  } catch (e) {
    console.warn('[onboard/save] mashaabim catalog load failed', e);
  }
  return map;
}

export async function createSps(items: SaveItem[], userId: string, jwt: string, lang: Lang): Promise<string[]> {
  if (!items?.length) return [];
  const d = new Date().toISOString();
  const ids: string[] = [];
  const catalog = await loadMashaabimCatalog(jwt);
  for (const it of items) {
    if (!it.name?.trim()) continue;
    const resolved = await resolveMashaabimId(it.name, jwt, catalog);
    // Ids come back from Strapi, never from the client, but this document is
    // built by interpolation — keep it to digits so it stays that way.
    const mashaabimId = resolved && /^\d+$/.test(resolved) ? resolved : null;
    // Default locale (no `locale:` arg) so the user-relation can find it.
    const query = `mutation { createSp(data: {
      name: "${sanitize(it.name)}",
      descrip: "${sanitize(it.descrip ?? '')}",
      ${mashaabimId ? `mashaabim: ${mashaabimId},` : ''}
      users_permissions_user: ${userId},
      publishedAt: "${d}"
    }) { data { id } } }`;
    try {
      const result = await gql(query, jwt);
      const id = result?.createSp?.data?.id;
      if (id) {
        ids.push(String(id));
        // Fire-and-forget translation so the user sees the sp in their locale.
        fetch(new URL('/api/auto-localize/strapi4', baseUrl).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: 'sps', entryId: id, sourceLocale: lang })
        }).catch((err) => console.warn('[onboard/save] auto-localize sp failed', err));
      }
    } catch (e) {
      console.warn('[onboard/save] createSp failed', e);
    }
  }
  return ids;
}
