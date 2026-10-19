/**
 * What the "Fulfilment" tab of the sales screen reads (PLAN_SHOP_OPERATIONS
 * §2.1, A1): the rikma's steps, and who they can land on.
 *
 * Called from a `sales/manage/*` loader after the moach layout's membership
 * check, so it reads with the service token. Until `1.0b` deploys the
 * `fulfillment-step` collection the steps query fails; that is `ready: false`,
 * and the tab says so instead of erroring.
 */
import { strapiClient } from '$lib/server/actions';
import { stepTargetUsers } from '$lib/fulfillment/plan';
import { missionsMapOf, stepOf, type FulfillmentSetup, type StepRowView, type StepView } from '$lib/fulfillment/rows';

export type { FulfillmentSetup, StepRowView };

type FetchFn = typeof fetch;

export async function loadFulfillmentSetup(projectId: string, fetchFn?: FetchFn): Promise<FulfillmentSetup> {
  const run = (qid: string, vars: Record<string, unknown>) => strapiClient.execute(qid, vars, undefined, fetchFn);
  let stepNodes: any[];
  try {
    const res = await run('fulfillmentSteps', { pid: projectId });
    stepNodes = res?.data?.fulfillmentSteps?.data ?? [];
  } catch (e) {
    console.warn('[fulfillment] steps unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    return { ready: false, steps: [], missions: [], roles: [], members: [] };
  }
  const [missionsRes, membersRes] = await Promise.all([
    run('fulfillmentMissions', { pid: projectId }),
    run('128getProjectMembersAndRestime', { pid: projectId })
  ]);
  const missions = missionsMapOf(missionsRes?.data?.mesimabetahaliches?.data ?? []);

  const steps: StepRowView[] = stepNodes
    .map(stepOf)
    .filter((s): s is StepView => !!s && !s.archived)
    .map((s) => {
      const targetIds = stepTargetUsers(s, missions);
      return { ...s, targetIds, waitingFor: targetIds.filter((id) => !s.consentedBy.includes(id)) };
    });

  const open = [...missions.values()].filter((m) => !m.closed);
  const roles = new Map<string, string>();
  for (const m of open) for (const r of m.roles) if (!roles.has(r.id)) roles.set(r.id, r.name);

  return {
    ready: true,
    steps,
    missions: open
      .filter((m) => m.holderId)
      .map((m) => ({ id: m.id, name: m.name, holderId: m.holderId, holderName: m.holderName })),
    roles: [...roles].map(([id, name]) => ({ id, name })),
    members: (membersRes?.data?.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => ({
      id: String(u.id),
      name: u.attributes?.username ?? ''
    }))
  };
}
