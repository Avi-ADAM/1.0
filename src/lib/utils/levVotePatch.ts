/**
 * The acting card's own vote, written into the heart page's stores before the
 * server answers — so the vote sticks through re-renders, the buttons hide,
 * and a second tap can't vote twice while the request is in flight.
 *
 * Only the tab that voted uses these. Every other screen (the member's other
 * devices, the other members) re-reads the slice from the realtime bus
 * (`$lib/realtime/adapters/lev.ts`), which is why the socket patchers that
 * once lived beside these were removed (PLAN_REALTIME_MIGRATION R6).
 */

import type { Writable } from 'svelte/store';
import {
  pendsStore,
  pmashesStore,
  type PendMissionData,
  type PendResourceData
} from '$lib/stores/levStores';

/**
 * A voter id from a vote object regardless of shape
 * (nested Strapi relation, flat id, or `ide` fallback).
 */
function voterIdOf(vote: any): string | undefined {
  const id =
    vote?.users_permissions_user?.data?.id ??
    vote?.users_permissions_user?.id ??
    vote?.users_permissions_user ??
    vote?.ide;
  return id != null ? String(id) : undefined;
}

/**
 * Append a vote idempotently: drop the same voter's vote at the same `order`
 * (earlier negotiation rounds are history and stay) and append the new one.
 * Safe to apply twice, and it reflects a member changing their vote. Null when
 * the voter can't be identified — the caller then leaves the item untouched.
 */
export function mergeVote(existing: any[] | undefined, newVote: any): any[] | null {
  const voterId = voterIdOf(newVote);
  if (!voterId) return null;

  const arr = Array.isArray(existing) ? existing : [];
  const order = newVote.order ?? 0;
  const kept = arr.filter((v: any) => voterIdOf(v) !== voterId || (v.order ?? 0) !== order);
  return [...kept, newVote];
}

type Patch = { id: string; newVote?: any; patch?: Record<string, any>; _deleted?: boolean } & Record<string, any>;

function patchItem<T extends { id: string }>(store: Writable<T[]>, data: Patch): void {
  if (!data?.id) return;

  store.update((current) => {
    if (data._deleted) return current.filter((p) => p.id !== data.id);

    const index = current.findIndex((p) => p.id === data.id);
    if (index === -1) return [...current, data as unknown as T];

    const { newVote, patch } = data;
    let updated: any = current[index];
    if (newVote || patch) {
      // Targeted: the changed fields (a counter's terms) and/or one vote, so the
      // card re-derives — never the transient fields of an action response.
      if (patch && typeof patch === 'object') updated = { ...updated, ...patch };
      if (newVote) {
        const merged = mergeVote(updated.users, newVote);
        if (merged) updated = { ...updated, users: merged };
      }
    } else {
      updated = { ...updated, ...data };
    }
    const next = [...current];
    next[index] = updated;
    return next;
  });
}

/** Patch one pending-mission vote card (`pendm`). */
export function updatePendsStore(data: Partial<PendMissionData> & Patch): void {
  patchItem(pendsStore, data);
}

/** Patch one pending-resource vote card (`pmash`). */
export function updatePmashesStore(data: Partial<PendResourceData> & Patch): void {
  patchItem(pmashesStore, data);
}
