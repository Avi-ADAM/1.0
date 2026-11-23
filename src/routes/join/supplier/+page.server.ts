import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * /join/supplier is the guest door (docs/inprogress/PLAN_SUPPLIER_GROWTH.md SG1). A
 * signed-in member already has the same analysis on /onboard/business, which
 * creates in their own name — send them there instead of preparing a signup
 * for someone who has an account.
 */
export const load: PageServerLoad = async ({ locals }) => {
  if ((locals as { tok?: string }).tok) redirect(303, '/onboard/business');
  return {};
};
