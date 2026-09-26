import { redirect } from '@sveltejs/kit';
import { claimLanding } from '$lib/assistant/claimClient';
import { clearConciergeIntent } from '$lib/concierge/regIntent.js';
import type { PageServerLoad } from './$types';

/**
 * Right after an agent-prepared signup (docs/PLAN_AI_SIGNUP_CONCIERGE §5.1):
 * claim what the conversation prepared and go there — the review screen of the
 * drafted rikma, the draft wish, or the profile assistant. Nothing waiting →
 * the ordinary onboarding.
 */
export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const landing = await claimLanding(fetch);
  // The intent cookie has done its job either way.
  clearConciergeIntent(cookies);
  throw redirect(303, landing ?? '/onboard');
};
