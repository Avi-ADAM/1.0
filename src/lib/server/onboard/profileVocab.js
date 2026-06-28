// Shared server helper: loads the authenticated user's EXISTING profile
// vocabulary (skills, roles, methods, values) as plain id lists.
//
// Used by the onboarding manual and review pages so an existing user editing
// their profile never starts from an empty selection — and, in the AI review
// flow, so saving the AI's findings MERGES with (never wipes) what the profile
// already holds. Returns ids keyed by the names the wizard stores use:
// skills / roles / methods / vallues.

const PROFILE_VOCAB_QUERY = `query ProfileVocabIds($uid: ID!) {
  usersPermissionsUser(id: $uid) {
    data {
      attributes {
        skills { data { id } }
        tafkidims { data { id } }
        vallues { data { id } }
        work_ways { data { id } }
      }
    }
  }
}`;

const ids = (rel) => (rel?.data ?? []).map((r) => String(r.id));

const empty = () => ({ skills: [], roles: [], methods: [], vallues: [] });

/**
 * @param {typeof fetch} fetch  SvelteKit's event.fetch
 * @param {string|false} tok    JWT from locals.tok
 * @param {string|false} uid    user id from locals.uid
 * @returns {Promise<{skills: string[], roles: string[], methods: string[], vallues: string[]}>}
 */
export async function loadProfileVocabIds(fetch, tok, uid) {
  // Not logged in (e.g. mid-registration) — nothing to pre-load.
  if (!tok || tok === false || !uid || uid === false) return empty();

  try {
    const res = await fetch(import.meta.env.VITE_URL + '/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({
        query: PROFILE_VOCAB_QUERY,
        variables: { uid: String(uid) }
      })
    });
    const json = await res.json();
    const attrs = json?.data?.usersPermissionsUser?.data?.attributes;
    if (!attrs) return empty();

    return {
      skills: ids(attrs.skills),
      roles: ids(attrs.tafkidims),
      methods: ids(attrs.work_ways),
      vallues: ids(attrs.vallues)
    };
  } catch (e) {
    console.error('[onboard] failed to load existing profile vocab', e);
    return empty();
  }
}
