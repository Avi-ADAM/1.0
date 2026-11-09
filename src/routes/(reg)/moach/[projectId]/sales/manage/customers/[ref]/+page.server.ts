import { loadCustomerLeads } from '$lib/server/leads/pipelineLoad';
import type { PageServerLoad } from './$types';

/**
 * One customer (the customers tab, opened): everything they bought. The leads
 * are read here, the orders come with the manage layout — the same two inputs
 * the list folds, so the page finds the same person the list showed. Members
 * only: `parent()` runs the moach membership check before the admin-token read.
 */
export const load: PageServerLoad = async ({ params, parent, fetch }) => {
  await parent();
  return { customerLeads: await loadCustomerLeads(params.projectId, fetch) };
};
