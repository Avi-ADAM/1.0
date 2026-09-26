import { redirect } from '@sveltejs/kit';
import { claimLanding } from '$lib/assistant/claimClient';
import type { PageServerLoad } from './$types';

/**
 * The onboarding is where a confirmed signup lands when nothing else says
 * otherwise — including an agent-prepared signup whose email was opened on
 * another device (no intent cookie there). So the first visit asks, once, if
 * something prepared in a conversation is waiting (PLAN_AI_SIGNUP_CONCIERGE
 * §5.4), and goes there instead. The cookie keeps later visits from asking.
 */
const CHECKED = 'asst_checked';

export const load: PageServerLoad = async ({ fetch, cookies, locals, url }) => {
  if (!(locals as any)?.uid || cookies.get(CHECKED)) return {};
  cookies.set(CHECKED, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 60 * 60 * 24
  });
  const landing = await claimLanding(fetch);
  if (landing && !landing.startsWith('/onboard?') && landing !== '/onboard') throw redirect(303, landing);
  return {};
};
