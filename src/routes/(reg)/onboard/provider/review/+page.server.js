// Loads the authenticated user's EXISTING profile vocabulary so the AI review
// save MERGES with it instead of replacing it. updateUsersPermissionsUser
// overwrites each relation wholesale, so without folding the existing ids into
// the saved payload an existing user would lose their current skills/values/etc
// the moment they confirm the AI's findings.

import { loadProfileVocabIds } from '$lib/server/onboard/profileVocab.js';

export async function load({ locals, fetch }) {
  const existingIds = await loadProfileVocabIds(fetch, locals.tok, locals.uid);
  return { existingIds };
}
