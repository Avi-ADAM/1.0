// POST /api/onboard/save
// Persists the review-screen chip selection to the authenticated user.
// - For matched/suggestion items: uses the existingId directly.
// - For new items: creates the vocab record in Strapi (skills, vallues, tafkidims, work-ways).
// - For resources (sps): creates new sp records linked to the user.
// - Final: updateUsersPermissionsUser mutation merges all IDs into the user.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { STRAPI_URL as baseUrl } from '$lib/server/strapiUrl.js';

type SaveItem = { name: string; existingId?: string; descrip?: string };
type Lang = 'he' | 'en' | 'ar';
const VALID_LANGS = new Set<Lang>(['he', 'en', 'ar']);

type SaveBody = {
  skills?: SaveItem[];
  roles?: SaveItem[];
  methods?: SaveItem[];
  vallues?: SaveItem[];
  resources?: SaveItem[];
  lang?: string;
};

function sanitize(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, ' ').slice(0, 200);
}

async function gql(query: string, jwt?: string) {
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

async function resolveIds(category: string, items: SaveItem[], jwt: string, lang: Lang): Promise<string[]> {
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

async function createSps(items: SaveItem[], userId: string, jwt: string, lang: Lang): Promise<string[]> {
  if (!items?.length) return [];
  const d = new Date().toISOString();
  const ids: string[] = [];
  for (const it of items) {
    if (!it.name?.trim()) continue;
    // Default locale (no `locale:` arg) so the user-relation can find it.
    const query = `mutation { createSp(data: {
      name: "${sanitize(it.name)}",
      descrip: "${sanitize(it.descrip ?? '')}",
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

export const POST: RequestHandler = async ({ request, cookies }) => {
  const userId = cookies.get('id');
  const jwt = cookies.get('jwt');

  if (!userId || !jwt) {
    throw error(401, 'Authentication required');
  }

  let body: SaveBody;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const cookieLang = cookies.get('lang') as Lang | undefined;
  const lang: Lang =
    VALID_LANGS.has(body.lang as Lang)
      ? (body.lang as Lang)
      : VALID_LANGS.has(cookieLang as Lang)
        ? (cookieLang as Lang)
        : 'he';

  // Resolve IDs per category in parallel.
  const [skillIds, roleIds, workWayIds, valueIds, spIds] = await Promise.all([
    resolveIds('skills', body.skills ?? [], jwt, lang),
    resolveIds('roles', body.roles ?? [], jwt, lang),
    resolveIds('methods', body.methods ?? [], jwt, lang),
    resolveIds('vallues', body.vallues ?? [], jwt, lang),
    createSps(body.resources ?? [], userId, jwt, lang)
  ]);

  // Build the data field for updateUsersPermissionsUser — only include fields
  // that actually have items so we don't accidentally wipe other categories.
  const fields: string[] = [];
  if (skillIds.length) fields.push(`skills: [${skillIds.join(',')}]`);
  if (roleIds.length) fields.push(`tafkidims: [${roleIds.join(',')}]`);
  if (workWayIds.length) fields.push(`work_ways: [${workWayIds.join(',')}]`);
  if (valueIds.length) fields.push(`vallues: [${valueIds.join(',')}]`);

  let updated = true;
  let updateError: string | undefined;
  if (fields.length) {
    const query = `mutation { updateUsersPermissionsUser(
      id: ${userId},
      data: { ${fields.join(', ')} }
    ) { data { id } } }`;
    try {
      await gql(query, jwt);
    } catch (e) {
      console.error('[onboard/save] updateUser failed', e);
      updated = false;
      updateError = e instanceof Error ? e.message : 'updateUser failed';
    }
  } else {
    // Nothing to persist — let caller surface it via message + counts, but don't block.
    updateError = 'no_items_selected';
  }

  return json({
    ok: updated,
    message: updateError,
    counts: {
      skills: skillIds.length,
      roles: roleIds.length,
      methods: workWayIds.length,
      vallues: valueIds.length,
      resources: spIds.length
    },
    ids: {
      skills: skillIds,
      roles: roleIds,
      methods: workWayIds,
      vallues: valueIds,
      resources: spIds
    }
  });
};
