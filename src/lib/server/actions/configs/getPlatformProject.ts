/**
 * Action: getPlatformProject
 *
 * Read-only. Resolves the "main rikma" — the Project flagged `isPlatform = true`
 * (schema added in main) — and derives the treasury recipient for the site
 * share as its first member (`user_1s[0]`).
 *
 * Returns { configured, projectId, treasuryUserId }. `configured` is true only
 * when a platform project exists and has at least one member to receive the
 * site-share Haluka. See docs/PLAN_SITE_SHARE.md §2.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const res = await strapi.execute(
    '205getPlatformProject',
    {},
    context.jwt,
    context.fetch,
  );

  const node = res?.data?.projects?.data?.[0];
  if (!node) {
    return {
      data: { configured: false, projectId: null, treasuryUserId: null },
      updateStrategy: { type: 'none' },
    };
  }

  const members = node.attributes?.user_1s?.data ?? [];
  const treasuryUserId = members.length > 0 ? String(members[0].id) : null;

  return {
    data: {
      configured: Boolean(treasuryUserId),
      projectId: String(node.id),
      treasuryUserId,
    },
    updateStrategy: { type: 'none' },
  };
};

export const getPlatformProjectConfig: ActionConfig = {
  key: 'getPlatformProject',
  description:
    'Resolve the platform project (isPlatform=true) and its treasury recipient (first member) for the site share.',
  graphqlOperation: handler,

  paramSchema: {},

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },
};
