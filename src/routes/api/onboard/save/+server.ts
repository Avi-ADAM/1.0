// POST /api/onboard/save
// Persists the review-screen chip selection to the authenticated user.
// - For matched/suggestion items: uses the existingId directly.
// - For new items: creates the vocab record in Strapi (skills, vallues, tafkidims, work-ways).
// - For resources (sps): creates new sp records linked to the user.
// - Final: updateUsersPermissionsUser mutation merges all IDs into the user.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { createSps, gql, resolveIds, VALID_LANGS, type Lang, type SaveItem } from '$lib/server/onboard/profileWrites.js';
import { strapiClient } from '$lib/server/actions/index.js';
import { matchUserToOpenEntities } from '$lib/server/matching/engine';

type SaveBody = {
  skills?: SaveItem[];
  roles?: SaveItem[];
  methods?: SaveItem[];
  vallues?: SaveItem[];
  resources?: SaveItem[];
  lang?: string;
};

export const POST: RequestHandler = async ({ request, cookies, fetch, locals }) => {
  const userId = locals.uid || undefined;
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

  // Onboarding is the one path where a profile is filled in without ever going
  // through the `updateUserRelation` action, so it also has to trigger the
  // precomputed match-suggestions (PLAN_MATCH_SUGGESTIONS). Without this the
  // lev page greets a freshly onboarded user with "no suggestions, go add
  // skills" — the exact thing they just finished doing. Best effort: the save
  // itself has already succeeded and must not fail on a matching hiccup.
  if (updated && (skillIds.length || roleIds.length || workWayIds.length)) {
    try {
      await matchUserToOpenEntities(userId, 'profileUpdated', {
        strapi: strapiClient,
        fetch,
        lang
      });
    } catch (e) {
      console.error('[onboard/save] match-suggestion refresh failed', e);
    }
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
