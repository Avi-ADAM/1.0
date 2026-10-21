/**
 * What the "Fulfilment" tab of the sales screen reads (PLAN_SHOP_OPERATIONS
 * §2.1, A1–A3): the rikma's steps, who they can land on, what their
 * conditions can name, and when the waiting people's silence becomes consent.
 *
 * Called from a `sales/manage/*` loader after the moach layout's membership
 * check, so it reads with the service token. Until `1.0b` deploys the
 * `fulfillment-step` collection the steps query fails; that is `ready: false`,
 * and the tab says so instead of erroring. Each optional part (shipping, the
 * products, the resources, the rule clock) fails on its own and is simply empty.
 */
import { strapiClient } from '$lib/server/actions';
import { stepTargetUsers } from '$lib/fulfillment/plan';
import {
  EMPTY_CHOICES,
  missionsMapOf,
  stepOf,
  type FulfillmentChoices,
  type FulfillmentSetup,
  type StepRowView,
  type StepView
} from '$lib/fulfillment/rows';
import { stockResourceOf } from '$lib/fulfillment/stock';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';
import { ruleClock } from './consent';

export type { FulfillmentSetup, StepRowView };

type FetchFn = typeof fetch;
type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

const EMPTY: FulfillmentSetup = {
  ready: false,
  steps: [],
  missions: [],
  roles: [],
  members: [],
  choices: EMPTY_CHOICES,
  consentClock: false
};

/** Zones, delivery methods and pickup points of the rikma's shipping config — none until it is set up. */
async function shippingChoices(run: Run, projectId: string): Promise<Pick<FulfillmentChoices, 'zones' | 'methods' | 'pickupPoints'>> {
  try {
    const { config } = await readShippingConfig(run, projectId);
    return {
      zones: config.zones.map((z) => ({ id: z.id, name: z.name })),
      // As the order reports the buyer's choice: `m:<zone>:<method>`.
      methods: config.zones.flatMap((z) => z.methods.map((m) => ({ id: `m:${z.id}:${m.id}`, name: m.name, zoneName: z.name }))),
      pickupPoints: config.pickupPoints.map((p) => ({ id: p.id, name: p.name }))
    };
  } catch {
    return { zones: [], methods: [], pickupPoints: [] };
  }
}

/** The rikma's products, and the categories they use. */
async function catalogChoices(run: Run, projectId: string): Promise<Pick<FulfillmentChoices, 'products' | 'categories'>> {
  try {
    const res = await run('fulfillmentChoices', { pid: projectId });
    const products: FulfillmentChoices['products'] = [];
    const categories = new Map<string, string>();
    for (const m of res?.data?.matanots?.data ?? []) {
      if (m?.id == null) continue;
      products.push({ id: String(m.id), name: String(m.attributes?.name ?? '') });
      for (const c of m.attributes?.categories?.data ?? []) {
        if (c?.id != null && !categories.has(String(c.id))) categories.set(String(c.id), String(c.attributes?.name ?? ''));
      }
    }
    products.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return {
      products,
      categories: [...categories].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'he'))
    };
  } catch {
    return { products: [], categories: [] };
  }
}

/** Resources with a shelf, for `stock.low` rules (A3) — none until the A3 fields deploy. */
async function resourceChoices(run: Run, projectId: string): Promise<FulfillmentChoices['resources']> {
  try {
    const res = await run('stockResources', { pid: projectId });
    return (res?.data?.mashabetahaliches?.data ?? [])
      .filter((n: any) => n?.attributes?.recurring !== true)
      .map((n: any) => stockResourceOf(n))
      .filter(Boolean)
      .map((r: any) => ({ id: r.id, name: r.name }));
  } catch {
    return [];
  }
}

export async function loadFulfillmentSetup(projectId: string, fetchFn?: FetchFn): Promise<FulfillmentSetup> {
  const run: Run = (qid, vars) => strapiClient.execute(qid, vars, undefined, fetchFn);
  let stepNodes: any[];
  try {
    const res = await run('fulfillmentSteps', { pid: projectId });
    stepNodes = res?.data?.fulfillmentSteps?.data ?? [];
  } catch (e) {
    console.warn('[fulfillment] steps unavailable (schema not deployed?):', (e as Error)?.message ?? e);
    return EMPTY;
  }
  const live = stepNodes.map(stepOf).filter((s): s is StepView => !!s && !s.archived);
  const [missionsRes, membersRes, shipping, catalog, resources, clock] = await Promise.all([
    run('fulfillmentMissions', { pid: projectId }),
    run('128getProjectMembersAndRestime', { pid: projectId }),
    shippingChoices(run, projectId),
    catalogChoices(run, projectId),
    resourceChoices(run, projectId),
    ruleClock(run, live.map((s) => s.id))
  ]);
  const missions = missionsMapOf(missionsRes?.data?.mesimabetahaliches?.data ?? []);

  const steps: StepRowView[] = live.map((s) => {
    const targetIds = stepTargetUsers(s, missions);
    return {
      ...s,
      targetIds,
      waitingFor: targetIds.filter((id) => !s.consentedBy.includes(id)),
      deadline: s.consentState === 'proposed' ? (clock.deadlines.get(s.id)?.deadline ?? null) : null
    };
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
    })),
    choices: { ...shipping, ...catalog, resources },
    consentClock: clock.ready
  };
}
