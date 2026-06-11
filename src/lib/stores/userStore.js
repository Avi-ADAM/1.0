import { writable, derived } from 'svelte/store';

/**
 * Central client-side cache of the logged-in user's profile.
 *
 * Goal: fetch the heavy profile once (in /me's server load) and let any other
 * page read it from here instead of re-querying. It is reactive, so updates
 * made anywhere — including a single socket listener in +layout.svelte — flow
 * to every component that reads it, without each page opening its own socket
 * listener.
 *
 * Shape: the `attributes` object of usersPermissionsUser (username, bio,
 * profilePic, skills, ...) or `null` before hydration.
 */
export const userStore = writable(null);

/** Replace the whole profile (called after a fresh server load). */
export function hydrateUser(profile) {
  userStore.set(profile ?? null);
}

/**
 * Merge a partial `attributes` patch into the cached profile. Used by the
 * layout socket listener so e.g. a new profile picture or username reflects
 * instantly on every open page. No-op if nothing is cached yet.
 */
export function patchUser(partial) {
  if (!partial) return;
  userStore.update((u) => (u ? { ...u, ...partial } : { ...partial }));
}

/** Clear on logout. */
export function clearUser() {
  userStore.set(null);
}

/** Convenience derived stores for the most-read fields. */
export const userName = derived(userStore, ($u) => $u?.username ?? '');
export const userPic = derived(
  userStore,
  ($u) =>
    $u?.profilePic?.data?.attributes?.formats?.small?.url ||
    $u?.profilePic?.data?.attributes?.url ||
    ''
);
