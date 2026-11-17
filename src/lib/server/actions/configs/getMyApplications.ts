/**
 * Action: getMyApplications — read-only.
 *
 * The caller's own open candidacies (Ask / Askm), for the heart's "my requests"
 * cards (`/lev?focus=myapp`, linked from the hub). Most of them sit in rikmas
 * the caller is not a member of yet, so the main heart query — which walks the
 * caller's rikmas — never sees them; this reads them by candidate instead.
 *
 * The candidate is always `context.userId`: there is no user param to forge.
 * Withdrawing one is `withdrawCandidacy`.
 */
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { shapeApplications } from '$lib/candidacy/myApplications';

const handler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const uid = String(context.userId);
  const res = await strapi.execute('mcpMyApplications', { uid }, context.jwt, context.fetch);
  if (res?.errors?.length) throw new Error(res.errors[0]?.message ?? 'Failed to read applications');
  return { applications: shapeApplications(res?.data, uid) };
};

export const getMyApplicationsConfig: ActionConfig = {
  key: 'getMyApplications',
  description:
    'Read-only. The current member’s own open candidacies: missions they offered to take and resources they offered to bring, with the terms on the table, who signed, and when silence approves.',
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to read your applications' }],
  updateStrategy: { type: 'none' }
};
