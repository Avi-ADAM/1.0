// Loads the authenticated user's EXISTING profile vocabulary so the manual
// wizard can pre-select it. Without this, an existing user who opens onboarding
// to tweak their profile — or who skips the AI steps straight to here — lands
// on an empty selector even though their profile already holds skills/values.
// The page merges these ids with any AI-confirmed ids (onboard.cvSavedIds) when
// seeding the wizard stores, so the wizard starts from the real current state.

import { loadProfileVocabIds } from '$lib/server/onboard/profileVocab.js';

export async function load({ locals, fetch }) {
  const existingIds = await loadProfileVocabIds(fetch, locals.tok, locals.uid);
  return { existingIds };
}
