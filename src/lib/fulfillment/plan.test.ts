import { describe, it, expect } from 'vitest';
import {
  UNIT_CAP,
  chainProblem,
  consentStateOf,
  dueAtOf,
  emptyRouting,
  fulfillmentExternalId,
  pickHolder,
  placeStep,
  planFulfillment,
  planStockLow,
  reminderAtOf,
  resourceIdOfExternalId,
  stepIdOfExternalId,
  stepTargetUsers,
  stockLowExternalId,
  waveOf,
  type FulfillmentStepRow,
  type OrderFacts,
  type RoutingState,
  type RunningMission
} from './plan';

const NOW = Date.parse('2026-10-19T10:00:00.000Z');

function step(over: Partial<FulfillmentStepRow> = {}): FulfillmentStepRow {
  return {
    id: '1',
    name: 'משלוח',
    position: 0,
    target: 'mission',
    missionId: '10',
    roleId: null,
    memberId: null,
    per: 'order',
    scope: 'rikma',
    productIds: [],
    variantIds: [],
    when: { event: 'order.paid' },
    dueHours: null,
    effect: 'markShipped',
    consentState: 'active',
    consentedBy: ['7'],
    archived: false,
    ...over
  };
}

function order(over: Partial<OrderFacts> = {}): OrderFacts {
  return {
    id: '500',
    ref: '57:pi_1',
    number: '#K7Q4XM',
    status: 'paid',
    deliveryPreference: 'delivery',
    paidAt: '2026-10-19T08:00:00.000Z',
    buyerName: 'דנה',
    address: 'הרצל 1, נתניה',
    lines: [
      { id: 'l1', position: 0, productId: 'p1', variantId: null, quantity: 2, name: 'צנצנת', optionLabel: null },
      { id: 'l2', position: 1, productId: 'p2', variantId: 'v9', quantity: 1, name: 'חולצה', optionLabel: 'L' }
    ],
    ...over
  };
}

function missions(...rows: RunningMission[]): Map<string, RunningMission> {
  return new Map(rows.map((m) => [m.id, m]));
}

const courier: RunningMission = { id: '10', holderId: '7', closed: false, roleIds: ['3'] };

const run = (s: FulfillmentStepRow[], o = order(), m = missions(courier), existing: string[] = []) =>
  planFulfillment({ event: 'order.paid', order: o, steps: s, missions: m, existingExternalIds: existing, now: NOW });

describe('planFulfillment', () => {
  it('a rule narrowed to shipping zones opens only for orders to those zones', () => {
    const north = step({ when: { event: 'order.paid', shippingZones: ['north'] } });
    expect(run([north], order({ shippingZoneId: 'north' })).acts).toHaveLength(1);
    expect(run([north], order({ shippingZoneId: 'center' })).acts).toHaveLength(0);
    expect(run([north], order({ shippingZoneId: null })).acts).toHaveLength(0);
  });

  it('opens one act inside the running mission of the consenting holder', () => {
    const plan = run([step()]);
    expect(plan.blockers).toEqual([]);
    expect(plan.acts).toHaveLength(1);
    expect(plan.acts[0]).toMatchObject({
      externalId: 'order:57:pi_1:step:1',
      assignedUserId: '7',
      missionId: '10',
      roleId: null,
      effect: 'markShipped',
      name: 'משלוח · #K7Q4XM'
    });
    expect(plan.acts[0].description).toBe('2 × צנצנת\n1 × חולצה (L)');
  });

  it('never writes the buyer into the act — it is mirrored outside the rikma', () => {
    const plan = run([step()]);
    expect(plan.acts[0].description).not.toContain('הרצל');
    expect(plan.acts[0].description).not.toContain('דנה');
    expect(plan.acts[0].name).not.toContain('דנה');
  });

  it('is idempotent: an act already written is not planned again', () => {
    const plan = run([step()], order(), missions(courier), ['order:57:pi_1:step:1']);
    expect(plan.acts).toEqual([]);
    expect(plan.existing).toEqual(['order:57:pi_1:step:1']);
  });

  it('opens nothing for a proposed, paused or archived step', () => {
    expect(run([step({ consentState: 'proposed' })]).acts).toEqual([]);
    expect(run([step({ consentState: 'paused' })]).acts).toEqual([]);
    expect(run([step({ archived: true })]).acts).toEqual([]);
  });

  it('opens nothing before payment or after a cancel', () => {
    expect(run([step()], order({ status: 'pendingPayment' })).acts).toEqual([]);
    expect(run([step()], order({ status: 'cancelled' })).acts).toEqual([]);
  });

  it('honours the delivery-preference condition', () => {
    const s = step({ when: { event: 'order.paid', deliveryPreference: ['delivery'] } });
    expect(run([s]).acts).toHaveLength(1);
    expect(run([s], order({ deliveryPreference: 'pickup' })).acts).toEqual([]);
  });

  it('never assigns someone who did not agree — it blocks instead', () => {
    const plan = run([step({ consentedBy: ['99'] })]);
    expect(plan.acts).toEqual([]);
    expect(plan.blockers).toEqual([{ stepId: '1', code: 'NOT_CONSENTED', openedForRole: false }]);
  });

  it('blocks on a mission nobody holds, or one that is closed', () => {
    expect(run([step()], order(), missions({ ...courier, holderId: null })).blockers[0].code).toBe('NO_HOLDER');
    expect(run([step()], order(), missions({ ...courier, closed: true })).blockers[0].code).toBe('NO_HOLDER');
    expect(run([step()], order(), missions()).blockers[0].code).toBe('NO_TARGET');
  });

  it('role: one consenting holder gets it inside their mission', () => {
    const plan = run([step({ target: 'role', missionId: null, roleId: '3' })]);
    expect(plan.acts[0]).toMatchObject({ assignedUserId: '7', missionId: '10', roleId: null });
  });

  it('role: several holders ⇒ the act opens for the role, nobody is picked', () => {
    const other: RunningMission = { id: '11', holderId: '8', closed: false, roleIds: ['3'] };
    const plan = run([step({ target: 'role', missionId: null, roleId: '3', consentedBy: ['7', '8'] })], order(), missions(courier, other));
    expect(plan.acts[0]).toMatchObject({ assignedUserId: null, missionId: null, roleId: '3' });
    expect(plan.blockers).toEqual([]);
  });

  it('role: no holder ⇒ the act still opens for the role, and the rikma hears of it', () => {
    const plan = run([step({ target: 'role', missionId: null, roleId: '4' })]);
    expect(plan.acts[0]).toMatchObject({ assignedUserId: null, roleId: '4' });
    expect(plan.blockers).toEqual([{ stepId: '1', code: 'NO_HOLDER', openedForRole: true }]);
  });

  it('per line opens an act per line in scope', () => {
    const plan = run([step({ per: 'line' })]);
    expect(plan.acts.map((a) => a.externalId)).toEqual(['order:57:pi_1:step:1:line:0', 'order:57:pi_1:step:1:line:1']);
    expect(plan.acts[0].description).toContain('2 × צנצנת');
  });

  it('per unit opens an act per unit — production', () => {
    const plan = run([step({ per: 'unit' })]);
    expect(plan.acts.map((a) => a.externalId)).toEqual([
      'order:57:pi_1:step:1:line:0:unit:1',
      'order:57:pi_1:step:1:line:0:unit:2',
      'order:57:pi_1:step:1:line:1:unit:1'
    ]);
    expect(plan.acts[0].name).toBe('משלוח · #K7Q4XM · צנצנת 1/2');
    expect(plan.acts[0].description).toBe('1 × צנצנת');
  });

  it('a product-scoped step only sees its products — and skips an order without them', () => {
    const s = step({ per: 'line', scope: 'product', productIds: ['p2'] });
    expect(run([s]).acts.map((a) => a.lineId)).toEqual(['l2']);
    expect(run([step({ scope: 'product', productIds: ['zz'] })]).acts).toEqual([]);
  });

  it('sets the due time from payment', () => {
    expect(run([step({ dueHours: 24 })]).acts[0].dueAt).toBe('2026-10-20T08:00:00.000Z');
  });

  it('member target needs that member’s own yes', () => {
    expect(run([step({ target: 'member', missionId: null, memberId: '7' })]).acts[0].assignedUserId).toBe('7');
    expect(run([step({ target: 'member', missionId: null, memberId: '8' })]).blockers[0].code).toBe('NOT_CONSENTED');
  });
});

describe('consentStateOf', () => {
  it('a rule the author sets for themself is live at once', () => {
    expect(consentStateOf('7', ['7'], [])).toBe('self');
  });
  it('a rule on someone else waits for them', () => {
    expect(consentStateOf('1', ['7'], [])).toBe('proposed');
    expect(consentStateOf('1', ['7'], ['7'])).toBe('active');
    expect(consentStateOf('1', ['7', '8'], ['7'])).toBe('proposed');
  });
  it('a rule that lands on nobody is not live', () => {
    expect(consentStateOf('1', [], [])).toBe('proposed');
  });
});

describe('helpers', () => {
  it('externalId shape', () => {
    expect(fulfillmentExternalId('57:x', '3')).toBe('order:57:x:step:3');
    expect(fulfillmentExternalId('57:x', '3', 0)).toBe('order:57:x:step:3:line:0');
  });
  it('dueAtOf without hours is null', () => {
    expect(dueAtOf(null, null, NOW)).toBeNull();
    expect(dueAtOf(null, 2, NOW)).toBe('2026-10-19T12:00:00.000Z');
  });
  it('stepTargetUsers lists every current holder of a role', () => {
    const m = missions(courier, { id: '11', holderId: '8', closed: false, roleIds: ['3'] }, { id: '12', holderId: '9', closed: true, roleIds: ['3'] });
    expect(stepTargetUsers({ target: 'role', missionId: null, roleId: '3', memberId: null }, m).sort()).toEqual(['7', '8']);
  });
  it('placeStep: mission target keeps the mission', () => {
    expect(placeStep(step(), missions(courier))).toEqual({ kind: 'person', userId: '7', missionId: '10' });
  });
});

// ─── A2 ──────────────────────────────────────────────────────────────────────

const packer: RunningMission = { id: '20', holderId: '8', closed: false, roleIds: ['5'] };
const packer2: RunningMission = { id: '21', holderId: '9', closed: false, roleIds: ['5'] };
const roleStep = (over: Partial<FulfillmentStepRow> = {}) =>
  step({ target: 'role', missionId: null, roleId: '5', consentedBy: ['8', '9'], per: 'order', ...over });

describe('chains (when.after)', () => {
  const pack = step({ id: '1', name: 'אריזה', effect: 'none' });
  const ship = step({ id: '2', name: 'משלוח', position: 1, when: { event: 'order.paid', after: ['1'] } });

  it('a chained step waits until the step before it is done for this order', () => {
    const plan = run([pack, ship]);
    expect(plan.acts.map((a) => a.stepId)).toEqual(['1']);
    expect(plan.waiting).toEqual(['2']);
  });

  it('opens once the earlier step is done — and does not reopen the earlier one', () => {
    const plan = planFulfillment({
      event: 'order.paid',
      order: order(),
      steps: [pack, ship],
      missions: missions(courier),
      existingExternalIds: ['order:57:pi_1:step:1'],
      doneSteps: ['1'],
      now: NOW
    });
    expect(plan.acts.map((a) => a.stepId)).toEqual(['2']);
    expect(plan.existing).toEqual(['order:57:pi_1:step:1']);
  });

  it('an earlier step that does not apply to this order does not hold the chain back', () => {
    const pickupOnly = step({ id: '1', when: { event: 'order.paid', deliveryPreference: ['pickup'] } });
    expect(run([pickupOnly, ship]).acts.map((a) => a.stepId)).toEqual(['2']);
    // …nor a paused one, nor one that was removed.
    expect(run([step({ id: '1', consentState: 'paused' }), ship]).acts.map((a) => a.stepId)).toEqual(['2']);
    expect(run([ship]).acts.map((a) => a.stepId)).toEqual(['2']);
  });

  it('a chained step counts its due time from when it opens', () => {
    const plan = planFulfillment({
      event: 'order.paid',
      order: order(),
      steps: [pack, { ...ship, dueHours: 2 }],
      missions: missions(courier),
      existingExternalIds: ['order:57:pi_1:step:1'],
      doneSteps: ['1'],
      now: NOW
    });
    expect(plan.acts[0].dueAt).toBe('2026-10-19T12:00:00.000Z');
  });

  it('chainProblem rejects unknown steps, itself, stock steps and cycles', () => {
    const steps = [pack, ship, step({ id: '3', when: { event: 'stock.low' } })];
    expect(chainProblem('2', ['1'], steps)).toBeNull();
    expect(chainProblem(null, ['1', '2'], steps)).toBeNull();
    expect(chainProblem('2', ['9'], steps)).toBe('UNKNOWN_STEP');
    expect(chainProblem('2', ['2'], steps)).toBe('SELF');
    expect(chainProblem('2', ['3'], steps)).toBe('NOT_ORDER_STEP');
    expect(chainProblem('1', ['2'], steps)).toBe('CYCLE');
  });
});

describe('conditions', () => {
  it('a category step sees only the lines of its categories', () => {
    const o = order({
      lines: [
        { id: 'l1', position: 0, productId: 'p1', variantId: null, quantity: 1, name: 'עוגה', optionLabel: null, categoryIds: ['c1'] },
        { id: 'l2', position: 1, productId: 'p2', variantId: null, quantity: 1, name: 'ספל', optionLabel: null, categoryIds: ['c2'] }
      ]
    });
    const bake = step({ per: 'line', scope: 'category', when: { event: 'order.paid', categories: ['c1'] } });
    expect(run([bake], o).acts.map((a) => a.lineId)).toEqual(['l1']);
    expect(run([step({ scope: 'category', when: { event: 'order.paid', categories: ['c9'] } })], o).acts).toEqual([]);
  });

  it('delivery method and pickup point narrow by the option the buyer chose', () => {
    const courierOnly = step({ when: { event: 'order.paid', shippingMethods: ['m:north:courier'] } });
    expect(run([courierOnly], order({ shippingMethodId: 'm:north:courier' })).acts).toHaveLength(1);
    expect(run([courierOnly], order({ shippingMethodId: 'm:north:mail' })).acts).toHaveLength(0);
    const shopA = step({ when: { event: 'order.paid', pickupPoints: ['shopA'] } });
    expect(run([shopA], order({ pickupPointId: 'shopA' })).acts).toHaveLength(1);
    expect(run([shopA], order({ pickupPointId: null })).acts).toHaveLength(0);
  });
});

describe('routing', () => {
  const m = () => missions(packer, packer2);

  it('roundRobin spreads the acts of one run among the consenting holders', () => {
    const plan = run([roleStep({ per: 'line', routing: 'roundRobin' })], order(), m());
    expect(plan.acts.map((a) => [a.assignedUserId, a.missionId])).toEqual([
      ['8', '20'],
      ['9', '21']
    ]);
  });

  it('roundRobin continues after the step\'s last assignee', () => {
    const routing: RoutingState = { load: new Map(), lastAssignee: new Map([['1', '8']]) };
    const plan = planFulfillment({ event: 'order.paid', order: order(), steps: [roleStep({ routing: 'roundRobin' })], missions: m(), existingExternalIds: [], now: NOW, routing });
    expect(plan.acts[0].assignedUserId).toBe('9');
    expect(routing.lastAssignee.get('1')).toBe('9');
  });

  it('leastOpen picks whoever has the fewest open acts', () => {
    const routing: RoutingState = { load: new Map([['8', 4], ['9', 1]]), lastAssignee: new Map() };
    const plan = planFulfillment({ event: 'order.paid', order: order(), steps: [roleStep({ routing: 'leastOpen' })], missions: m(), existingExternalIds: [], now: NOW, routing });
    expect(plan.acts[0].assignedUserId).toBe('9');
  });

  it('routing never picks someone who did not agree', () => {
    const plan = run([roleStep({ routing: 'roundRobin', consentedBy: ['9'] })], order(), m());
    expect(plan.acts[0].assignedUserId).toBe('9');
    const none = run([roleStep({ routing: 'roundRobin', consentedBy: [] })], order(), m());
    expect(none.acts[0]).toMatchObject({ assignedUserId: null, roleId: '5' });
    expect(none.blockers[0].code).toBe('NOT_CONSENTED');
  });

  it('single keeps A1: several holders ⇒ open to the role', () => {
    expect(run([roleStep()], order(), m()).acts[0]).toMatchObject({ assignedUserId: null, roleId: '5' });
  });

  it('pickHolder for a hand-off skips the person handing it off', () => {
    const holders = [
      { userId: '8', missionId: '20' },
      { userId: '9', missionId: '21' }
    ];
    expect(pickHolder('roundRobin', '1', holders, emptyRouting(), '8')?.userId).toBe('9');
    expect(pickHolder('roundRobin', '1', holders.slice(0, 1), emptyRouting(), '8')).toBeNull();
  });
});

describe('waves and due times', () => {
  // NOW = 2026-10-19T10:00Z = 13:00 in Israel; paid 08:00Z = 11:00 in Israel.
  it('an order before the cut-off joins today\'s wave; after it, tomorrow\'s', () => {
    expect(waveOf(Date.parse('2026-10-19T08:00:00Z'), 16 * 60, null)).toEqual({ day: '2026-10-19', cutoff: '2026-10-19T13:00:00.000Z' });
    expect(waveOf(Date.parse('2026-10-19T14:00:00Z'), 16 * 60, null).day).toBe('2026-10-20');
  });

  it('a wave never comes before the day the order is promised to leave', () => {
    expect(waveOf(Date.parse('2026-10-19T08:00:00Z'), 10 * 60, '2026-10-20')).toEqual({ day: '2026-10-20', cutoff: '2026-10-20T07:00:00.000Z' });
    // A dispatch day already behind the wave changes nothing.
    expect(waveOf(Date.parse('2026-10-19T08:00:00Z'), 16 * 60, '2026-10-18').day).toBe('2026-10-19');
  });

  it('a wave step is due at the wave hour (+ dueHours), and every order of the wave shares it', () => {
    const wave = step({ batching: 'wave', waveAt: '16:00', dueHours: 2 });
    const a = run([wave]).acts[0];
    const b = run([wave], order({ id: '501', ref: '57:pi_2', paidAt: '2026-10-19T09:30:00.000Z' })).acts[0];
    expect(a).toMatchObject({ dueAt: '2026-10-19T15:00:00.000Z', wave: '2026-10-19' });
    expect(b.dueAt).toBe(a.dueAt);
  });

  it('a wave without a valid hour falls back to per-order timing', () => {
    expect(run([step({ batching: 'wave', waveAt: '25:00', dueHours: 24 })]).acts[0]).toMatchObject({ dueAt: '2026-10-20T08:00:00.000Z', wave: null });
  });

  it('every act with a due time gets a reminder before it', () => {
    expect(run([step({ dueHours: 24 })]).acts[0].remindAt).toBe('2026-10-20T05:00:00.000Z');
    expect(run([step()]).acts[0].remindAt).toBeNull();
    expect(reminderAtOf(NOW, '2026-10-19T10:20:00.000Z')).toBeNull();
    expect(reminderAtOf(NOW, '2026-10-19T11:00:00.000Z')).toBe('2026-10-19T10:45:00.000Z');
  });
});

describe('per unit cap', () => {
  it('a big line opens UNIT_CAP acts, the last one carrying the rest', () => {
    const o = order({ lines: [{ id: 'l1', position: 0, productId: 'p1', variantId: null, quantity: 30, name: 'עוגיה', optionLabel: null }] });
    const acts = run([step({ per: 'unit' })], o).acts;
    expect(acts).toHaveLength(UNIT_CAP);
    expect(acts[UNIT_CAP - 1].description).toBe(`${30 - UNIT_CAP + 1} × עוגיה`);
    expect(acts[UNIT_CAP - 1].name).toContain(`${UNIT_CAP}–30/30`);
  });
});

describe('planStockLow (A3)', () => {
  const buyer: RunningMission = { id: '30', holderId: '12', closed: false, roleIds: ['77'] };
  const procurement = step({ id: '9', name: 'רכש', target: 'role', missionId: null, roleId: '77', consentedBy: ['12'], effect: 'none', when: { event: 'stock.low' } });
  const jars = { resourceId: '40', name: 'צנצנות', onHand: 8, lowStockAt: 10, quantityDelivered: 100 };

  it('opens one purchase act per refill for the procurement role', () => {
    const out = planStockLow({ resource: jars, steps: [procurement], missions: missions(buyer), existingExternalIds: [], now: NOW });
    expect(out.matched).toBe(true);
    expect(out.acts).toHaveLength(1);
    expect(out.acts[0]).toMatchObject({ externalId: 'stock:40:low:100:step:9', assignedUserId: '12', name: 'רכש · צנצנות' });
    const again = planStockLow({ resource: jars, steps: [procurement], missions: missions(buyer), existingExternalIds: ['stock:40:low:100:step:9'], now: NOW });
    expect(again.acts).toEqual([]);
  });

  it('a rule for other resources does not match; order steps never answer stock', () => {
    const other = { ...procurement, when: { event: 'stock.low' as const, resources: ['41'] } };
    expect(planStockLow({ resource: jars, steps: [other, step()], missions: missions(buyer), existingExternalIds: [], now: NOW }).matched).toBe(false);
  });

  it('externalId helpers round-trip', () => {
    expect(stockLowExternalId('40', 100.5, '9')).toBe('stock:40:low:100.5:step:9');
    expect(resourceIdOfExternalId('stock:40:low:100:step:9')).toBe('40');
    expect(stepIdOfExternalId('order:57:pi_1:step:12:line:0:unit:3')).toBe('12');
    expect(stepIdOfExternalId('order:57:pi_1:step:12')).toBe('12');
    expect(stepIdOfExternalId('stock:40:low:100:step:9')).toBeNull();
  });
});

describe('order steps ignore stock rules', () => {
  it('a stock.low step never opens for an order', () => {
    expect(run([step({ when: { event: 'stock.low' } })]).acts).toEqual([]);
  });
});
