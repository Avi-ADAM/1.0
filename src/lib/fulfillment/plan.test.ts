import { describe, it, expect } from 'vitest';
import {
  consentStateOf,
  dueAtOf,
  fulfillmentExternalId,
  placeStep,
  planFulfillment,
  stepTargetUsers,
  type FulfillmentStepRow,
  type OrderFacts,
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

  it('per line / unit opens an act per line in scope', () => {
    const plan = run([step({ per: 'unit' })]);
    expect(plan.acts.map((a) => a.externalId)).toEqual(['order:57:pi_1:step:1:line:0', 'order:57:pi_1:step:1:line:1']);
    expect(plan.acts[0].description).toContain('2 × צנצנת');
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
