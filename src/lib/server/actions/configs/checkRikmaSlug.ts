/**
 * Action: checkRikmaSlug — is this address free for this rikma?
 * (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4.6)
 *
 * The look editor asks while the member types. It answers with one word —
 * never who holds an address — and only to a member of the rikma asking.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types';
import { slugAvailability, type Run } from '$lib/server/rikmaIdentity/identity.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const read: Run = (qid, vars) => strapi.execute(qid, vars, undefined, context.fetch);
  const a = await slugAvailability(read, params.slug, String(params.projectId));
  return {
    success: true,
    data:
      a.ok === false
        ? { slug: a.slug, status: a.reason }
        : { slug: a.slug, status: a.mine ? 'mine' : 'available' },
    updateStrategy: { type: 'none' as const }
  };
};

export const checkRikmaSlugConfig: ActionConfig = {
  key: 'checkRikmaSlug',
  description:
    "Read-only: whether an address (/r/<slug>) is available for the given rikma. Answers 'available' | 'mine' | 'taken' | 'pending' | a format problem.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    slug: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma'
    }
  ],
  updateStrategy: { type: 'none' }
};
