/**
 * Action: getSiteSharePayables
 *
 * Read-only. The current member's site-share contributions that are committed
 * (`decided & amount>0`) but not yet transferred — i.e. they still owe the money
 * (PLAN_SITE_SHARE_PER_MEMBER §5, M4). Each item carries the income Sheirut and
 * its volunteers so the UI can offer "pay <volunteer> now" (→ createSiteShareTransfer).
 *
 * Identity from the session (`context.userId`). The 0/skip invariant holds by the
 * query (`des_status='decided'`) + the amount>0 / no-existing-haluka filter here.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const userId = String(context.userId);

  const res = await strapi.execute(
    '215getSiteSharePayables',
    { user: userId },
    context.jwt,
    context.fetch,
  );

  const rows = res?.data?.siteShareContributions?.data ?? [];
  const payables = [] as Array<Record<string, unknown>>;

  for (const row of rows) {
    const a = row.attributes ?? {};
    const amount = Number(a.amount) || 0;
    if (amount <= 0) continue; // 0/skip never owes a transfer
    if (a.haluka?.data?.id) continue; // already transferred

    const sheirut = a.sheirut?.data ?? null;
    const volunteers = (sheirut?.attributes?.iCanGetMonay?.data ?? []).map((u: any) => ({
      id: String(u.id),
      username: u.attributes?.username ?? '',
      profilePic: u.attributes?.profilePic?.data?.attributes?.url ?? null,
    }));

    const sourceRikma = a.tosplit?.data?.attributes?.project?.data ?? null;

    payables.push({
      contributionId: String(row.id),
      amount,
      projectId: a.project?.data?.id ? String(a.project.data.id) : null,
      reciveProjectId: a.recive_project?.data?.id ? String(a.recive_project.data.id) : null,
      sheirutId: sheirut?.id ? String(sheirut.id) : null,
      volunteers,
      rikmaName: sourceRikma?.attributes?.projectName ?? '',
      rikmaLogo: sourceRikma?.attributes?.profilePic?.data?.attributes?.url ?? null,
    });
  }

  return {
    data: { payables },
    updateStrategy: { type: 'none' },
  };
};

export const getSiteSharePayablesConfig: ActionConfig = {
  key: 'getSiteSharePayables',
  description:
    "List the current member's committed-but-unpaid site-share contributions (decided & amount>0, no transfer yet) with the income Sheirut's volunteers.",
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read site share payables' },
  ],
  updateStrategy: { type: 'none' },
};
