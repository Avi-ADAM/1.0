import { loadCustomerLeads } from '$lib/server/leads/pipelineLoad';
import type { PageServerLoad } from './$types';

/**
 * Customers (docs/inprogress/PLAN_LEADS.md §5.5, L6): the won leads, read
 * here; the paid orders come with the manage layout. Members only —
 * `parent()` runs the moach membership check before the admin-token read.
 */
export const load: PageServerLoad = async ({ params, parent, fetch }) => {
  await parent();
  return { customerLeads: await loadCustomerLeads(params.projectId, fetch) };
};
