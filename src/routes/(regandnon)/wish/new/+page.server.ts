import type { PageServerLoad } from './$types';

// Public (guest-allowed) wish composer. No auth guard — a visitor can write
// their full wish and see masked matches before an account exists. If they are
// already logged in we pass through their identity so the composer behaves like
// the authenticated /concierge/new.
export const load: PageServerLoad = async ({ locals }) => {
  const uid = (locals as any)?.uid ?? null;
  const un = (locals as any)?.un ?? null;
  return { uid, un };
};
