import { describe, expect, it } from 'vitest';
import { buildPromoDecisionView } from './promoDecisionView';

const NOW = new Date('2026-11-01T10:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();
const vot = (id: string, order: number) => ({ what: true, order, zman: day(-1), users_permissions_user: { data: { id } } });

function node(over: Record<string, unknown> = {}) {
  return {
    id: '50',
    attributes: {
      kind: 'promotion',
      vots: [vot('1', 1)],
      negopromo: [
        {
          ordern: 1,
          mode: 'propose',
          kind: 'item',
          name: 'סוף עונה',
          scope: { products: ['5'] },
          rule: { pct: 25 },
          startsAt: day(1),
          endsAt: day(8),
          proposedBy: { data: { id: '1', attributes: { username: 'noa' } } }
        }
      ],
      promotion: { data: { id: '30', attributes: { status: 'proposed', project: { data: { attributes: { promoPolicy: { maxPct: 20, maxDays: 14 } } } } } } },
      ...over
    }
  };
}

describe('buildPromoDecisionView', () => {
  it('shows the version on the table and what goes beyond the envelope', () => {
    const v = buildPromoDecisionView(node(), ['1', '2'], '2', { now: NOW })!;
    expect(v.standing?.rule).toEqual({ pct: 25 });
    expect(v.proposedByName).toBe('noa');
    expect(v.breaches).toEqual([{ field: 'pct', limit: 20, value: 25 }]);
    expect(v.myTurn).toBe(true);
    expect(v.awaitingIds).toEqual(['2']);
  });

  it('the standing round is the highest, and signatures count only on it', () => {
    const n = node({
      vots: [vot('1', 1), vot('2', 1), vot('2', 2)],
      negopromo: [...node().attributes.negopromo, { ...node().attributes.negopromo[0], ordern: 2, rule: { pct: 10 } }]
    });
    const v = buildPromoDecisionView(n, ['1', '2'], '1', { now: NOW })!;
    expect(v.isCounter).toBe(true);
    expect(v.standing?.rule).toEqual({ pct: 10 });
    expect(v.signedIds).toEqual(['2']);
    expect(v.myTurn).toBe(true);
  });

  it('says when the clock outlasts the start (D2)', () => {
    expect(buildPromoDecisionView(node(), ['1', '2'], '2', { now: NOW, timegramaDate: day(2) })!.startsLate).toBe(true);
    expect(buildPromoDecisionView(node(), ['1', '2'], '2', { now: NOW, timegramaDate: day(0.5) })!.startsLate).toBe(false);
  });

  it('an envelope proposal reads its policy and its round from vots', () => {
    const v = buildPromoDecisionView(
      { id: '60', attributes: { kind: 'promoPolicy', newPromoPolicy: { maxPct: 15, maxDays: 7 }, vots: [vot('1', 1), vot('2', 2)] } },
      ['1', '2'],
      '1',
      { now: NOW }
    )!;
    expect(v.policy?.maxPct).toBe(15);
    expect(v.order).toBe(2);
    expect(v.proposedById).toBe('2');
    expect(v.myTurn).toBe(true);
  });

  it('nothing to decide on — no card', () => {
    expect(buildPromoDecisionView(node({ negopromo: [] }), ['1'], '1')).toBeNull();
    expect(buildPromoDecisionView(node({ kind: 'pic' }), ['1'], '1')).toBeNull();
  });
});
