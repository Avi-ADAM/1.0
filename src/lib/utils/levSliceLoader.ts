/**
 * Lev Slice Loader
 *
 * Loads a quantum (incremental) slice of lev data into the stores without
 * touching other types or project-scopes.
 *
 * Usage:
 *   await loadLevSlice('sheirutpends', userId, ['42', '17'], 'he');
 *   // → only sheirutpStore items from projects 42 and 17 are replaced;
 *   //   all other stores and all other projects remain untouched.
 *
 * Passing pids=null loads all projects for that type (useful for socket
 * refetchScope when no specific project is known).
 */

import { get } from 'svelte/store';
import { projectsStore, dataMode, loadedScopes } from '$lib/stores/levStores';
import { projects } from '$lib/stores/projectStore.js';
import { extractProjects } from './levDataExtractors';
import { fetchLevSlice } from './levGraphQLQueries';
import { LEV_SLICES } from './levSliceRegistry';

/**
 * Load a single quantum slice and upsert it into the appropriate store.
 *
 * @param typeKey  - Key in LEV_SLICES (e.g. 'sheirutpends')
 * @param idL      - User ID
 * @param pids     - Project IDs to scope the load to, or null for all projects
 * @param lang     - Language code
 */
export async function loadLevSlice(
  typeKey: string,
  idL: string,
  pids: string[] | null,
  lang: string
): Promise<void> {
  const def = LEV_SLICES[typeKey];
  if (!def) {
    console.warn(`[levSliceLoader] Unknown slice type: ${typeKey}`);
    return;
  }
  if (!def.qid) {
    console.warn(`[levSliceLoader] No qid for slice type: ${typeKey} — skipping`);
    return;
  }

  console.log(`[levSliceLoader] Loading slice: ${typeKey}`, { pids });

  const res = await fetchLevSlice(def.qid, idL, pids, lang);
  const userData = res?.data?.usersPermissionsUser?.data;
  if (!userData) {
    console.warn(`[levSliceLoader] Empty response for slice: ${typeKey}`);
    return;
  }

  // Upsert the mini project list into projectsStore so processors have context
  upsertProjectsFromSlice(userData);

  // Extract fresh items using the existing extractor (unchanged)
  const fresh = def.extract(userData);

  // Scoped upsert: replace only the items belonging to the fetched projects
  const coveredPids = pids
    ? pids.map(String)
    : (userData.attributes?.projects_1s?.data ?? []).map((p: any) => String(p.id));

  if (!pids && def.source === 'user') {
    // User-scoped slice with no project filter = the full collection for this
    // user, possibly spanning projects the user is not a member of (e.g.
    // purchases). A projectId-based upsert can't express that scope — replace
    // the store wholesale instead (coveredPids would be empty/partial and the
    // merge would duplicate items).
    def.store.set(fresh);
  } else {
    def.store.update((curr: any[]) => [
      ...curr.filter((item: any) => !coveredPids.includes(String(item.projectId))),
      ...fresh
    ]);
  }

  // Mark scope as loaded (upgrade 'none' → 'partial', keep 'full' as-is)
  dataMode.update((mode) => (mode === 'full' ? 'full' : 'partial'));

  loadedScopes.update((scopes) => {
    const existing = scopes[typeKey] ?? [];
    const merged = Array.from(new Set([...existing, ...coveredPids]));
    return { ...scopes, [typeKey]: merged };
  });

  console.log(`[levSliceLoader] Slice loaded: ${typeKey} (${fresh.length} items)`);
}

/**
 * Upsert projects from a slice response into projectsStore.
 *
 * Merges by id — only adds/updates projects that appear in the slice,
 * does not remove projects that are already in the store.
 */
function upsertProjectsFromSlice(userData: any): void {
  const sliceProjects = extractProjects(userData);
  if (!sliceProjects.length) return;

  const sliceIds = new Set(sliceProjects.map((p: any) => p.id));

  projectsStore.update((curr) => {
    const filtered = curr.filter((p) => !sliceIds.has(p.id));
    const merged = [...filtered, ...sliceProjects];
    // Sync legacy store so projectHelpers.js stays consistent
    projects.set(merged);
    return merged;
  });
}
