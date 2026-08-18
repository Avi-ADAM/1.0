import { describe, it, expect } from 'vitest';
import {
  applyStandingStipend,
  funderHasSigned,
  signerIds,
  type StipendDecision
} from './apply.js';

/**
 * The rule these tests exist for (PLAN_STIPEND §5): everyone's silence is
 * consent except the funder's. Being diluted is something a member can agree
 * to by saying nothing; paying money every month is not.
 */
function decision(overrides: Partial<StipendDecision> = {}): StipendDecision {
  return {
    id: '31',
    kind: 'stipendProgram',
    archived: false,
    decisionName: 'תוכנית מלגות קיום',
    why: null,
    projectId: '45',
    projectRestime: 'feh',
    memberIds: ['1', '2', '3'],
    funderId: '2',
    recipientId: null,
    programId: '9',
    pledgeId: null,
    rounds: [
      {
        ordern: 1,
        why: null,
        proposedById: '1',
        zman: null,
        mode: 'equity',
        costShare: 0,
        equityMultiplier: 1,
        stipendRate: 20,
        monthlyCap: null,
        totalCap: 6000,
        noticeCycles: 1,
        revenueTrigger: null,
        recourse: 'nonRecourse',
        scope: 'allMissions',
        start: null,
        end: null,
        cycleSize: 1
      }
    ],
    vots: [{ userId: '1', order: 1, what: true }],
    timegramaId: '318',
    timegramaDate: null,
    ...overrides
  };
}

describe('funderHasSigned', () => {
  it('is false while the named funder has not signed the standing round', () => {
    expect(funderHasSigned(decision())).toBe(false);
  });

  it('is true once they have', () => {
    const d = decision({
      vots: [
        { userId: '1', order: 1, what: true },
        { userId: '2', order: 1, what: true }
      ]
    });
    expect(funderHasSigned(d)).toBe(true);
  });

  it('ignores a signature on an older round — a counter reopens the question', () => {
    const d = decision({
      rounds: [
        { ...decision().rounds[0], ordern: 1 },
        { ...decision().rounds[0], ordern: 2, stipendRate: 40 }
      ],
      vots: [
        { userId: '2', order: 1, what: true },
        { userId: '1', order: 2, what: true }
      ]
    });
    expect(funderHasSigned(d)).toBe(false);
  });

  it('has nothing to withhold when no funder is named yet', () => {
    expect(funderHasSigned(decision({ funderId: null }))).toBe(true);
  });
});

describe('signerIds', () => {
  it('always includes the funder, whatever the kind', () => {
    expect(signerIds(decision({ memberIds: ['1', '3'] }))).toContain('2');
    expect(
      signerIds(decision({ kind: 'stipendPledge', funderId: '2', recipientId: '7' }))
    ).toEqual(['2', '7']);
  });
});

describe('applyStandingStipend', () => {
  it('refuses to take effect while the funder has not signed', async () => {
    const sent: string[] = [];
    const exec = async (q: string) => {
      sent.push(q);
      return { data: {} };
    };
    await expect(applyStandingStipend(exec as any, decision())).rejects.toThrow(/funder/i);
    // Nothing was written: no half-created programme left behind.
    expect(sent).toHaveLength(0);
  });
});
