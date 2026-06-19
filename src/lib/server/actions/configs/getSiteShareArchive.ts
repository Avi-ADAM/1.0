/**
 * Action: getSiteShareArchive (M5, PLAN_SITE_SHARE_PER_MEMBER §6)
 *
 * Read-only standing archive for the moach split screen. The SAME action serves
 * both sides — it decides which by comparing `projectId` to the resolved platform
 * project:
 *
 *  - PLATFORM (main rikma) view → the *receiving* archive: total income, who
 *    received how much (by the transfer Haluka's `userrecive`), and a per-source-
 *    rikma breakdown (by the giving `project`).
 *  - any REGULAR rikma view → the *giving* archive: what that rikma gave to 1💗1,
 *    per member, all-time.
 *
 * Two values everywhere (user decision):
 *  - committed = `des_status='decided' AND amount>0` (the obligation),
 *  - received  = the transfer Haluka is SETTLED (`senderconf && confirmed`).
 *
 * 0/skip invariant (§5) holds for free: the query filters `des_status='decided'`
 * and we additionally drop `amount<=0`, so a skipped / 0 record never appears.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { resolvePlatformProject } from '$lib/server/revenue/platformProject.js';

interface Receiver {
  userId: string;
  username: string;
  pic: string | null;
  received: number;
  inTransit: number;
}

interface RikmaRow {
  rikmaId: string | null;
  rikmaName: string;
  pic: string | null;
  committed: number;
  received: number;
}

interface MemberRow {
  userId: string;
  username: string;
  pic: string | null;
  committed: number;
  received: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const picOf = (node: any): string | null =>
  node?.attributes?.profilePic?.data?.attributes?.url ?? null;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId } = params as { projectId: string };
  const exec = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);

  // Is this project the platform / main rikma? Decides which side we render.
  const platform = await resolvePlatformProject(strapi, context.jwt, context.fetch);
  const isPlatformView =
    !!platform.projectId && String(platform.projectId) === String(projectId);

  const qid = isPlatformView
    ? '217getSiteShareContributionsByReciveProject'
    : '216getSiteShareContributionsByGivingProject';
  const vars = isPlatformView ? { recive: String(projectId) } : { project: String(projectId) };

  const res = await exec(qid, vars);
  const rows = res?.data?.siteShareContributions?.data ?? [];

  let totalCommitted = 0;
  let totalReceived = 0;

  // Grouping accumulators (keyed by id, '-' bucket for missing relations).
  const receivers = new Map<string, Receiver>();
  const rikmas = new Map<string, RikmaRow>();
  const members = new Map<string, MemberRow>();

  for (const row of rows) {
    const a = row.attributes ?? {};
    const amount = Number(a.amount) || 0;
    if (amount <= 0) continue; // 0/skip never counts (§5)

    const h = a.haluka?.data?.attributes ?? null;
    const settled = !!h?.senderconf && !!h?.confirmed;
    const transferAmount = h ? Number(h.amount) || amount : 0;
    const inTransit = !!h && !settled ? transferAmount : 0;
    const received = settled ? transferAmount : 0;

    totalCommitted += amount;
    totalReceived += received;

    if (isPlatformView) {
      // Who received — group the transfer Haluka by its chosen volunteer.
      const recNode = h?.userrecive?.data ?? null;
      if (recNode && (settled || inTransit > 0)) {
        const rid = String(recNode.id);
        const cur =
          receivers.get(rid) ??
          {
            userId: rid,
            username: recNode.attributes?.username ?? '',
            pic: picOf(recNode),
            received: 0,
            inTransit: 0,
          };
        cur.received += received;
        cur.inTransit += inTransit;
        receivers.set(rid, cur);
      }

      // Per source rikma — group by the giving project.
      const projNode = a.project?.data ?? null;
      const pid = projNode?.id ? String(projNode.id) : '-';
      const curR =
        rikmas.get(pid) ??
        {
          rikmaId: projNode?.id ? String(projNode.id) : null,
          rikmaName: projNode?.attributes?.projectName ?? '',
          pic: picOf(projNode),
          committed: 0,
          received: 0,
        };
      curR.committed += amount;
      curR.received += received;
      rikmas.set(pid, curR);
    } else {
      // Giving view — group by the member who gave.
      const userNode = a.users_permissions_user?.data ?? null;
      const uid = userNode?.id ? String(userNode.id) : '-';
      const curM =
        members.get(uid) ??
        {
          userId: userNode?.id ? String(userNode.id) : '',
          username: userNode?.attributes?.username ?? '',
          pic: picOf(userNode),
          committed: 0,
          received: 0,
        };
      curM.committed += amount;
      curM.received += received;
      members.set(uid, curM);
    }
  }

  const norm = <T>(rowsArr: T[], keys: (keyof T)[]): T[] =>
    rowsArr.map((r) => {
      const out = { ...r };
      for (const k of keys) (out as Record<keyof T, unknown>)[k] = round2(Number(r[k]) || 0);
      return out;
    });

  return {
    data: {
      isPlatformView,
      totalCommitted: round2(totalCommitted),
      totalReceived: round2(totalReceived),
      byReceiver: isPlatformView
        ? norm([...receivers.values()], ['received', 'inTransit']).sort(
            (x, y) => y.received + y.inTransit - (x.received + x.inTransit),
          )
        : undefined,
      bySourceRikma: isPlatformView
        ? norm([...rikmas.values()], ['committed', 'received']).sort(
            (x, y) => y.committed - x.committed,
          )
        : undefined,
      byMember: !isPlatformView
        ? norm([...members.values()], ['committed', 'received']).sort(
            (x, y) => y.committed - x.committed,
          )
        : undefined,
    },
    updateStrategy: { type: 'none' },
  };
};

export const getSiteShareArchiveConfig: ActionConfig = {
  key: 'getSiteShareArchive',
  description:
    "Standing site-share archive for a project's split screen: platform view (who received / total in / per source rikma) or giving view (what this rikma gave, per member), with committed vs received.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read the site share archive' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to read its site share archive',
    },
  ],
  updateStrategy: { type: 'none' },
};
