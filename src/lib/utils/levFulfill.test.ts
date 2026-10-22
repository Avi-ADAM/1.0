import { describe, it, expect } from 'vitest';
import { groupWaves, processFulfillRules, processFulfillWork } from './levFulfill';
import { PRIORITY_BAND } from './levProcessors';
import { RENDERABLE_ANIS } from '$lib/components/lev/cards/cardKinds.js';
import type { FulfillWorkItem, RuleProposal } from '$lib/fulfillment/rows';

const NOW = Date.parse('2026-10-21T10:00:00Z');

const act = (actId: string, extra: Partial<FulfillWorkItem> = {}): FulfillWorkItem => ({
  actId,
  projectId: '3',
  name: `משלוח · ${actId}`,
  stepId: '7',
  stepName: 'משלוח',
  effect: 'markShipped',
  batching: 'perOrder',
  per: 'order',
  dueAt: '2026-10-21T14:00:00Z',
  createdAt: `2026-10-21T0${actId}:00:00Z`,
  mine: true,
  openToAll: false,
  roleName: null,
  missionName: null,
  kind: 'order',
  resourceId: null,
  stock: null,
  orderId: `o${actId}`,
  orderRef: `pi_${actId}`,
  orderNumber: `N${actId}`,
  orderStatus: 'paid',
  deliveryPreference: 'delivery',
  buyerName: 'דנה',
  buyerPhone: '0501234567',
  address: 'הרצל 1, נתניה',
  dispatchOn: null,
  items: ['2 × צנצנת'],
  ...extra
});

const rule = (stepId: string, extra: Partial<RuleProposal> = {}): RuleProposal => ({
  stepId,
  projectId: '3',
  projectName: 'דבש',
  name: 'משלוח',
  target: 'role',
  roleName: 'שליח',
  missionName: null,
  proposedByName: 'רון',
  per: 'order',
  effect: 'markShipped',
  when: { event: 'order.paid', deliveryPreference: ['delivery'] },
  dueHours: 24,
  batching: 'perOrder',
  waveAt: null,
  routing: 'single',
  deadline: null,
  decisionId: null,
  ...extra
});

describe('groupWaves', () => {
  it('leaves per-order acts alone', () => {
    const out = groupWaves([act('1'), act('2')]);
    expect(out.map((w) => w.wave)).toEqual([null, null]);
  });

  it('makes one card of a wave step’s acts due at the same cut-off, in the place of the first', () => {
    const wave = { batching: 'wave' as const };
    const out = groupWaves([
      act('1'),
      act('3', { ...wave, items: ['3 × צנצנת', '1 × מכסה'] }),
      act('2', wave),
      act('4', { ...wave, dueAt: '2026-10-22T14:00:00Z' })
    ]);
    expect(out).toHaveLength(3);
    expect(out[0].actId).toBe('1');
    const w = out[1].wave!;
    // Sorted by when they opened, so the list reads in order.
    expect(w.actIds).toEqual(['2', '3']);
    expect(w.itemCount).toBe(6);
    // A wave card carries no single buyer.
    expect(out[1].buyerName).toBeNull();
    expect(out[1].address).toBeNull();
    // A wave of one is just an order.
    expect(out[2].wave).toBeNull();
    expect(out[2].actId).toBe('4');
  });

  it('is mine only when every act in it is', () => {
    const out = groupWaves([act('1', { batching: 'wave' }), act('2', { batching: 'wave', mine: false })]);
    expect(out[0].mine).toBe(false);
  });

  it('never groups purchase acts', () => {
    const stock = { batching: 'wave' as const, kind: 'stock' as const, resourceId: '9', orderId: null };
    expect(groupWaves([act('1', stock), act('2', stock)]).every((w) => w.wave === null)).toBe(true);
  });
});

describe('processFulfillWork', () => {
  it('turns acts and waves into renderable cards with distinct keys', () => {
    const items = processFulfillWork(
      [act('1'), act('2', { batching: 'wave' }), act('3', { batching: 'wave' })],
      NOW
    );
    expect(items.map((i) => i.ani)).toEqual(['fulfill', 'fulfill']);
    expect(items.every((i) => RENDERABLE_ANIS.includes(i.ani))).toBe(true);
    expect(new Set(items.map((i) => i.coinlapach)).size).toBe(2);
    expect(items[1].coinlapach).toMatch(/^fulfill-wave-/);
  });

  it('puts what is late ahead of what is due', () => {
    const [late, due] = processFulfillWork([act('1', { dueAt: '2026-10-21T08:00:00Z' }), act('2')], NOW);
    expect(late.late).toBe(true);
    expect(late.pl).toBeLessThan(due.pl);
  });

  it('is empty for nothing', () => {
    expect(processFulfillWork(null)).toEqual([]);
  });
});

describe('processFulfillRules', () => {
  it('is a renderable consent card that counts down to its deadline', () => {
    const [card] = processFulfillRules([rule('5', { deadline: '2026-10-21T15:00:00Z' })], NOW);
    expect(card.ani).toBe('fulfillRule');
    expect(RENDERABLE_ANIS).toContain('fulfillRule');
    expect(card.coinlapach).toBe('fulfillRule-5');
    expect(card.timegramaDate).toBe('2026-10-21T15:00:00Z');
    // The rule's conditions do not take the place of "when it reached me".
    expect(card.when).toBeUndefined();
    expect(card.ruleWhen).toEqual({ event: 'order.paid', deliveryPreference: ['delivery'] });
    expect(card.pl).toBeGreaterThanOrEqual(PRIORITY_BAND.VOTE_PENDING);
    expect(card.pl).toBeLessThan(PRIORITY_BAND.IN_PROGRESS);
  });

  it('puts the rule whose silence is near ahead of the others', () => {
    const [soon, later] = processFulfillRules(
      [rule('5', { deadline: '2026-10-21T15:00:00Z' }), rule('6', { deadline: '2026-10-24T15:00:00Z' })],
      NOW
    );
    expect(soon.pl).toBeLessThan(later.pl);
  });
});
