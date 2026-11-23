/**
 * Who may operate the Growth Agent (docs/inprogress/PLAN_GROWTH_AGENT.md §8.1).
 *
 * The platform has no "site admin" role; the platform team is the central
 * rikma. So an operator is a member of the growth rikma — checked with the
 * same `65checkProjectMembership` query the action system's `projectMember`
 * rule uses, under the person's own JWT — optionally narrowed by
 * GROWTH_OPERATOR_IDS. The page loader and every growth action run this one
 * function, so the screen and the writes cannot disagree.
 */

import { growthOperatorIds, growthProjectId, growthStateDir } from './config';

export type OperatorCheck =
  | { ok: true; projectId: string }
  | { ok: false; reason: 'not_configured' | 'not_signed_in' | 'not_operator' | 'check_failed' };

type Execute = (qid: string, vars: Record<string, unknown>, jwt: string | undefined, fetchFn: any) => Promise<any>;

export async function checkGrowthOperator(
  userId: string | null | undefined,
  jwt: string | null | undefined,
  fetchFn: typeof fetch,
  strapi: { execute: Execute }
): Promise<OperatorCheck> {
  if (!growthStateDir()) return { ok: false, reason: 'not_configured' };
  if (!userId || !jwt) return { ok: false, reason: 'not_signed_in' };
  const allow = growthOperatorIds();
  if (allow.length && !allow.includes(String(userId))) return { ok: false, reason: 'not_operator' };
  const projectId = growthProjectId();
  try {
    const res = await strapi.execute('65checkProjectMembership', { uid: String(userId), projectId }, jwt, fetchFn);
    const projects = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
    return projects.length > 0 ? { ok: true, projectId } : { ok: false, reason: 'not_operator' };
  } catch (e) {
    console.error('[growth] operator check failed:', e);
    return { ok: false, reason: 'check_failed' };
  }
}
