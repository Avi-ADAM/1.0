import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Flip the public support-page gate (PLAN_VOLUNTEER_RIKMA §7).
 *
 *   off      → the /project/[id]/support page is not published.
 *   members  → visible only to identified site users (logged in).
 *   public   → visible to everyone (an amuta can hand the URL out as a homepage).
 *
 * This is a low-risk display gate, not a money movement, so — unlike the
 * key project fields in updateProjectDetails — it is a direct update any
 * project member can make, without a Decision. (null-legacy is treated as
 * `off` everywhere it is read.)
 */

const VALID = ['off', 'members', 'public'] as const;
type SupportPage = (typeof VALID)[number];

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId, supportPage } = params as {
    projectId: string;
    supportPage: string;
  };

  if (!(VALID as readonly string[]).includes(supportPage)) {
    throw new Error(`Invalid supportPage value: ${supportPage}`);
  }

  const res = await strapi.execute(
    'updateProjectSupportPage',
    { id: String(projectId), supportPage: supportPage as SupportPage },
    context.jwt,
    context.fetch
  );

  const updated = res?.data?.updateProject?.data?.attributes?.supportPage ?? null;
  return {
    data: { success: true, supportPage: updated },
    updateStrategy: { type: 'none' }
  };
};

export const setSupportPageConfig: ActionConfig = {
  key: 'setSupportPage',
  description:
    'Set the project support-page gate (off · members · public). Direct update, any project member.',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    supportPage: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can change the support page'
    }
  ],
  updateStrategy: { type: 'none' }
};
