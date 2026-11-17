/**
 * Where my candidacies stand, for the heart's own opening cards.
 *
 * A candidacy I sent — a mission I offered to take (Ask), a resource I offered
 * to bring (Askm) — is already on the heart as the opening's card in its
 * "already applied" state (`meData` with `alreadyi`, `huca` with `myAskId`),
 * with its chat, the rikma's counter and my reply. This module adds what that
 * card could not know from query 83: who signed, who has not answered, when
 * silence approves it, and links to the opening and (for a member) the vote.
 *
 * Read by `getMyApplications` on the server, by candidate rather than by rikma:
 * most sit in rikmas I am not a member of yet.
 *
 * `?focus=myapp` (the hub's "my requests") shows only those cards.
 */
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { MyApplication } from '$lib/candidacy/myApplications';

/** The `?focus=` value of the hub's "my requests" button. */
export const MY_REQUESTS_FOCUS = 'myapp';

export const myApplicationsStore: Writable<MyApplication[]> = writable([]);

const keyOf = (kind: MyApplication['kind'], id: unknown) => `${kind}:${String(id)}`;

/** kind:applicationId → where that candidacy stands. */
export const myApplicationsByKey: Readable<Map<string, MyApplication>> = derived(
  myApplicationsStore,
  ($items) => new Map(($items ?? []).map((a) => [keyOf(a.kind, a.applicationId), a]))
);

/** Drop a candidacy once it was withdrawn. */
export function forgetMyApplication(kind: MyApplication['kind'], applicationId: string) {
  myApplicationsStore.update((list) =>
    list.filter((a) => !(a.kind === kind && String(a.applicationId) === String(applicationId)))
  );
}

/** The kind and application id of a heart card that is my own candidacy, else null. */
export function myCandidacyRef(item: any): { kind: MyApplication['kind']; id: string } | null {
  if (!item) return null;
  if (item.ani === 'meData' && item.alreadyi && item.askId) return { kind: 'mission', id: String(item.askId) };
  if (item.ani === 'huca' && item.myAskId) return { kind: 'resource', id: String(item.myAskId) };
  return null;
}

/** Pure: the `?focus=myapp` predicate — the cards that are my own candidacies. */
export function isMyCandidacyItem(item: any): boolean {
  return myCandidacyRef(item) !== null;
}

/** Where the candidacy behind a heart card stands, when it is mine and known. */
export function candidacyFor(map: Map<string, MyApplication>, item: any): MyApplication | null {
  const ref = myCandidacyRef(item);
  return ref ? (map.get(keyOf(ref.kind, ref.id)) ?? null) : null;
}
