import { describe, it, expect } from 'vitest';
import { buildStipendDecisionView, dilutionForVoter } from './decisionView.js';

/** A Strapi-shaped Decision node, the way the lev query returns it. */
function decision(overrides: any = {}) {
  return {
    id: '55',
    attributes: {
      kind: 'stipendPledge',
      decisionName: 'מלגת קיום: דנה → יונתן',
      archWhy: 'כדי שיוכל להמשיך',
      vots: [
        { what: true, order: 1, users_permissions_user: { data: { id: '2' } } }
      ],
      negostip: [
        {
          ordern: 1,
          mode: 'equity',
          costShare: 1,
          equityMultiplier: 1,
          stipendRate: 50,
          totalCap: 10000,
          proposedBy: { data: { id: '2', attributes: { username: 'דנה' } } }
        }
      ],
      stipFunder: { data: { id: '2', attributes: { username: 'דנה' } } },
      stipRecipient: { data: { id: '7', attributes: { username: 'יונתן' } } },
      ...overrides
    }
  };
}

describe('buildStipendDecisionView', () => {
  it('is bilateral for a pledge: only the two parties are asked', () => {
    const v = buildStipendDecisionView(decision(), ['2', '7', '9'], '7');
    expect(v?.signerIds).toEqual(['2', '7']);
    expect(v?.signerCount).toBe(2);
    expect(v?.awaitingIds).toEqual(['7']);
    expect(v?.myTurn).toBe(true);
    expect(v?.iAmRecipient).toBe(true);
    expect(v?.iAmFunder).toBe(false);
  });

  it('is rikma-wide for a programme', () => {
    const v = buildStipendDecisionView(
      decision({ kind: 'stipendProgram' }),
      ['2', '7', '9'],
      '9'
    );
    expect(v?.signerIds).toEqual(['2', '7', '9']);
    expect(v?.myTurn).toBe(true);
  });

  it('counts signatures on the standing round only — a counter reopens it', () => {
    const v = buildStipendDecisionView(
      decision({
        negostip: [
          { ordern: 1, mode: 'equity', costShare: 1, stipendRate: 50 },
          { ordern: 2, mode: 'equity', costShare: 1, stipendRate: 30 }
        ],
        vots: [
          { what: true, order: 1, users_permissions_user: { data: { id: '2' } } },
          { what: true, order: 1, users_permissions_user: { data: { id: '7' } } },
          { what: true, order: 2, users_permissions_user: { data: { id: '7' } } }
        ]
      }),
      ['2', '7'],
      '2'
    );
    expect(v?.standingOrder).toBe(2);
    expect(v?.standing.stipendRate).toBe(30);
    expect(v?.signedIds).toEqual(['7']);
    // The funder signed round 1, which says nothing about the counter.
    expect(v?.myTurn).toBe(true);
  });

  it('says it is not my turn once I signed the standing round', () => {
    const v = buildStipendDecisionView(decision(), ['2', '7'], '2');
    expect(v?.myTurn).toBe(false);
  });

  it('returns null for a decision of another kind', () => {
    expect(buildStipendDecisionView(decision({ kind: 'saleClaim' }), ['2'], '2')).toBeNull();
  });

  it('returns null when no terms are on the table rather than rendering a blank card', () => {
    expect(buildStipendDecisionView(decision({ negostip: [] }), ['2'], '2')).toBeNull();
  });
});

describe('dilutionForVoter', () => {
  it('reports "nothing moves" for terms that dilute nobody', () => {
    const v = buildStipendDecisionView(decision(), ['2', '7'], '7')!;
    const d = dilutionForVoter(v, 20_000, 100_000);
    expect(d?.moves).toBe(false);
    expect(d?.deltaPoints).toBe(0);
  });

  it('reports the real drop when the rikma carries the cost', () => {
    const v = buildStipendDecisionView(
      decision({
        kind: 'stipendProgram',
        negostip: [{ ordern: 1, mode: 'equity', costShare: 0, equityMultiplier: 1, stipendRate: 50, totalCap: 100_000 }]
      }),
      ['2', '7'],
      '7'
    )!;
    const d = dilutionForVoter(v, 20_000, 100_000);
    expect(d?.moves).toBe(true);
    expect(d?.currentPct).toBe(20);
    expect(d?.projectedPct).toBe(10);
    expect(d?.deltaPoints).toBe(10);
  });

  it('shows nothing rather than a fake number when there is no budget', () => {
    const v = buildStipendDecisionView(
      decision({ negostip: [{ ordern: 1, mode: 'equity', costShare: 0, stipendRate: 50 }] }),
      ['2', '7'],
      '7'
    )!;
    expect(dilutionForVoter(v, 20_000, 100_000)).toBeNull();
  });
});
