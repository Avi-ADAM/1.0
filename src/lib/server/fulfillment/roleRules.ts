/**
 * A role's automation rules as part of the assignment terms
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.3, like the shift commitment of
 * PLAN_SHIFTS §3.8): whoever applies for a mission sees the rules that come
 * with its roles before signing, and applying says yes to the ones shown.
 *
 *   loadRoleRules   — the live rules that land on a mission's roles.
 *   acceptRoleRules — the applicant's yes, written into `consentedBy`.
 *
 * The yes is recorded at application time and is inert until the applicant
 * holds the role: the planner only assigns work to holders who consented
 * (`plan.ts`), and a rule edited meanwhile asks everyone again (saving a rule
 * resets `consentedBy`), so a yes never outlives the version it was given to.
 * Paths that did not show the rules (a heart suggestion, an agent) send no
 * ids — those holders still get the `fulfillRule` card and answer there.
 */
import { stepOf } from '$lib/fulfillment/rows';
import type { RoleRuleView } from '$lib/fulfillment/ruleTerms';

export type { RoleRuleView };
export type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

/** The live (not paused, not archived) role rules of a rikma for these roles; [] when not deployed. */
export async function loadRoleRules(run: Run, input: { projectId: string; roleIds: string[] }): Promise<RoleRuleView[]> {
  const roles = new Set(input.roleIds.map(String));
  if (roles.size === 0) return [];
  let res: any;
  try {
    res = await run('fulfillmentSteps', { pid: input.projectId });
  } catch {
    return [];
  }
  const out: RoleRuleView[] = [];
  for (const node of res?.data?.fulfillmentSteps?.data ?? []) {
    const s = stepOf(node);
    if (!s || s.archived || s.consentState === 'paused' || s.target !== 'role' || !s.roleId || !roles.has(s.roleId)) continue;
    out.push({
      stepId: s.id,
      name: s.name,
      roleId: s.roleId,
      roleName: s.roleName,
      target: s.target,
      missionName: s.missionName,
      per: s.per,
      effect: s.effect,
      when: s.when,
      dueHours: s.dueHours,
      batching: s.batching,
      waveAt: s.waveAt,
      routing: s.routing
    });
  }
  return out;
}

/**
 * An application from a page that showed the rules (`acceptedRuleIds`):
 * the roles come from the open mission when the caller does not have them.
 */
export async function acceptShownRoleRules(
  run: Run,
  userId: string,
  input: { projectId: string; openMissionId: string; roleIds?: string[]; ruleIds: unknown }
): Promise<string[]> {
  if (!Array.isArray(input.ruleIds) || input.ruleIds.length === 0) return [];
  let roleIds = input.roleIds;
  if (!roleIds) {
    const om = await run('51GetOpenMissionById', { id: input.openMissionId }).catch(() => null);
    roleIds = (om?.data?.openMission?.data?.attributes?.tafkidims?.data ?? []).map((t: any) => String(t.id));
  }
  return acceptRoleRules(run, { projectId: input.projectId, userId, roleIds: roleIds ?? [], ruleIds: input.ruleIds });
}

/**
 * The applicant agrees to the rules they were shown. Only ids that are still
 * live rules of these roles count — a stale page or a forged id adds nothing.
 * Best effort: a failure leaves the heart card to ask instead.
 */
export async function acceptRoleRules(
  run: Run,
  input: { projectId: string; userId: string; roleIds: string[]; ruleIds: unknown }
): Promise<string[]> {
  const wanted = new Set(Array.isArray(input.ruleIds) ? input.ruleIds.map(String) : []);
  if (wanted.size === 0) return [];
  const accepted: string[] = [];
  try {
    const res = await run('fulfillmentSteps', { pid: input.projectId });
    const roles = new Set(input.roleIds.map(String));
    for (const node of res?.data?.fulfillmentSteps?.data ?? []) {
      const s = stepOf(node);
      if (!s || !wanted.has(s.id) || s.archived || s.consentState === 'paused') continue;
      if (s.target !== 'role' || !s.roleId || !roles.has(s.roleId)) continue;
      if (s.consentedBy.includes(input.userId)) {
        accepted.push(s.id);
        continue;
      }
      await run('fulfillmentStepUpdate', { id: s.id, data: { consentedBy: [...s.consentedBy, input.userId] } });
      accepted.push(s.id);
    }
  } catch (err) {
    console.warn('[fulfillment] could not record the applicant’s yes to the role rules:', (err as Error)?.message ?? err);
  }
  return accepted;
}
