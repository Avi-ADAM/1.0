/**
 * The heart's "my requests" cards: the candidacies I sent — a mission I offered
 * to take, a resource I offered to bring — while the rikma has not answered.
 *
 * They are not a to-do (the next move is the rikma's), so they are never in the
 * ordinary deck: the lev page reads them only for `?focus=myapp`, the hub's
 * "my requests" button. Each card says where the candidacy stands and offers
 * the one move that is mine — withdrawing it (`withdrawCandidacy`).
 *
 * Read by `getMyApplications` on the server: most sit in rikmas I am not a
 * member of yet, which the main heart query never walks.
 */
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { MyApplication } from '$lib/candidacy/myApplications';
import { createProjectInfo } from '$lib/utils/projectHelpers.js';
import { PRIORITY_BAND, itemWhen, type DisplayItem } from './levProcessors';
import { projectsStore } from '$lib/stores/levStores';

export const MY_APPLICATION_ANI = 'myapp';

export const myApplicationsStore: Writable<MyApplication[]> = writable([]);

/** Drop a candidacy from the deck once it was withdrawn. */
export function forgetMyApplication(kind: MyApplication['kind'], applicationId: string) {
  myApplicationsStore.update((list) =>
    list.filter((a) => !(a.kind === kind && String(a.applicationId) === String(applicationId)))
  );
}

/** Pure: MyApplication[] → DisplayItem[], newest first. Never throws on missing data. */
export function processMyApplications(items: MyApplication[] | null | undefined): DisplayItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map((a, i) => {
    // A rikma I am not in yet is not in projectsStore: fall back to the row's own name.
    const info = (a.projectId ? createProjectInfo(a.projectId) : null) as Record<string, any> | null;
    return {
      ...(info ?? {}),
      projectId: a.projectId ?? '',
      projectName: info?.projectName || a.rikmaName,
      src: info?.src2 || info?.src || '',
      ...a,
      ani: MY_APPLICATION_ANI,
      azmi: MY_APPLICATION_ANI,
      pl: PRIORITY_BAND.OTHER + Math.min(i, 99) * 0.1,
      coinlapach: `myapp-${a.kind}-${a.applicationId}`,
      when: itemWhen(a.createdAt),
      // The row and the coin count down to the silence deadline, like any consent clock.
      timegramaDate: a.deadline ?? null
    };
  });
}

export const processedMyApplications: Readable<DisplayItem[]> = derived(
  [myApplicationsStore, projectsStore],
  ([$items]) => processMyApplications($items)
);
