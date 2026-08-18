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

  it('keeps the funder a signer of a rikma-wide programme even when they are not a member row', () => {
    // A programme is rikma-wide, but the one member who writes the cheque is
    // never merely one of the voters: they are always in the signer list.
    const v = buildStipendDecisionView(
      decision({ kind: 'stipendProgram' }),
      ['7', '9'],
      '9'
    );
    expect(v?.signerIds).toContain('2');
  });

  it('will not let silence approve a stipend the funder has not signed', () => {
    // The recipient proposed it; nobody has committed to paying.
    const v = buildStipendDecisionView(
      decision({
        vots: [{ what: true, order: 1, users_permissions_user: { data: { id: '7' } } }]
      }),
      ['2', '7'],
      '7'
    );
    expect(v?.funderSigned).toBe(false);
    expect(v?.awaitingFunder).toBe(true);
    expect(v?.maturesOnSilence).toBe(false);
  });

  it('lets the clock finish the job once the funder has signed', () => {
    const v = buildStipendDecisionView(decision(), ['2', '7'], '7');
    expect(v?.funderSigned).toBe(true);
    expect(v?.maturesOnSilence).toBe(true);
  });

  it('reads the missions the pledge pays for, with their market value', () => {
    const v = buildStipendDecisionView(
      decision({
        stipendPledge: {
          data: {
            id: '3',
            attributes: {
              status: 'proposed',
              mesimabetahaliches: {
                data: [
                  {
                    id: '88',
                    attributes: {
                      name: 'בניית האתר',
                      descrip: 'עמודי נחיתה',
                      hoursassinged: 100,
                      howmanyhoursalready: 12,
                      perhour: 80,
                      iskvua: true
                    }
                  }
                ]
              }
            }
          }
        }
      }),
      ['2', '7'],
      '7'
    );
    expect(v?.missions).toHaveLength(1);
    expect(v?.missions[0]).toMatchObject({
      id: '88',
      name: 'בניית האתר',
      hours: 100,
      perhour: 80,
      value: 8000,
      recurring: true
    });
  });

  it('marks a programme with no total budget as open-ended', () => {
    const v = buildStipendDecisionView(
      decision({
        kind: 'stipendProgram',
        negostip: [{ ordern: 1, mode: 'equity', costShare: 0, stipendRate: 50, monthlyCap: 2000 }]
      }),
      ['2', '7'],
      '7'
    );
    expect(v?.openEnded).toBe(true);
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

  it('shows nothing rather than a fake number when there is no budget at all', () => {
    const v = buildStipendDecisionView(
      decision({ negostip: [{ ordern: 1, mode: 'equity', costShare: 0, stipendRate: 50 }] }),
      ['2', '7'],
      '7'
    )!;
    expect(dilutionForVoter(v, 20_000, 100_000)).toBeNull();
  });

  it('projects an open-ended programme over a year and says so', () => {
    // No closed budget, so there is no "when it is spent" — a year of the
    // monthly ceiling is the honest stand-in, flagged as one.
    const v = buildStipendDecisionView(
      decision({
        kind: 'stipendProgram',
        negostip: [
          { ordern: 1, mode: 'equity', costShare: 0, equityMultiplier: 1, stipendRate: 50, monthlyCap: 5000 }
        ]
      }),
      ['2', '7'],
      '7'
    )!;
    const d = dilutionForVoter(v, 20_000, 100_000);
    expect(d?.openEnded).toBe(true);
    expect(d?.horizonMonths).toBe(12);
    expect(d?.budget).toBe(60_000);
    expect(d?.moves).toBe(true);
  });
});
