import { loadBell } from '$lib/server/concierge/bell';
import type { PageServerLoad } from './$types';

// Public (guest-allowed) wish composer. No auth guard — a visitor can write
// their full wish and see masked matches before an account exists. If they are
// already logged in we pass through their identity so the composer behaves like
// the authenticated /concierge/new.
export const load: PageServerLoad = async ({ locals, fetch }) => {
  const uid = (locals as any)?.uid ?? null;
  const un = (locals as any)?.un ?? null;
  // A guest has no wishes, so no bell (the composer hides it for `anon`).
  const bell = await loadBell(uid, fetch);
  return { uid, un, bell };
};
