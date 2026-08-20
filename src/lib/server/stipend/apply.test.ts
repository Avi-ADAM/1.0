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

/** Records every mutation and answers the reads the apply path makes. */
function fakeExec() {
  const sent: string[] = [];
  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('createStipendProgram')) {
      return { data: { createStipendProgram: { data: { id: '9' } } } };
    }
    if (query.includes('createStipendPledge')) {
      return { data: { createStipendPledge: { data: { id: '77' } } } };
    }
    if (query.includes('createMashabetahalich')) {
      return { data: { createMashabetahalich: { data: { id: '500' } } } };
    }
    if (query.includes('stipendPledge(id:')) {
      return { data: { stipendPledge: { data: { attributes: { mashabetahalich: null } } } } };
    }
    return { data: {} };
  };
  return { exec, sent };
}

/** The signature that lets a programme mature: proposer + funder on round 1. */
const signedByBoth = [
  { userId: '1', order: 1, what: true },
  { userId: '2', order: 1, what: true }
];

describe('applyStandingStipend', () => {
  it('refuses to take effect while the funder has not signed', async () => {
    const { exec, sent } = fakeExec();
    await expect(applyStandingStipend(exec as any, decision())).rejects.toThrow(/funder/i);
    // Nothing was written: no half-created programme left behind.
    expect(sent).toHaveLength(0);
  });

  it('activates the pledge under a programme proposed for a named person', async () => {
    // The rikma voted on being diluted *for someone*. Approving the envelope
    // without the commitment inside it would leave them with a budget and no
    // stipend.
    const { exec, sent } = fakeExec();
    const applied = await applyStandingStipend(
      exec as any,
      decision({ vots: signedByBoth, programId: '9', pledgeId: '77', recipientId: '7' })
    );
    expect(applied.programId).toBe('9');
    expect(applied.pledgeId).toBe('77');
    expect(sent.some((q) => q.includes('updateStipendProgram'))).toBe(true);
    expect(sent.some((q) => q.includes('updateStipendPledge'))).toBe(true);
    // …and the recurring engine that gives the stipend its cycles and its stop.
    expect(sent.some((q) => q.includes('createMashabetahalich'))).toBe(true);
  });

  it('keeps a stipend on an open mission proposed — there is nobody to pay yet', async () => {
    // The rikma approved the terms, but the work has no taker. An `active`
    // pledge with no recipient would enter the monthly settlement against
    // nobody, and the engine would start cycling for no one.
    const { exec, sent } = fakeExec();
    const applied = await applyStandingStipend(
      exec as any,
      decision({ vots: signedByBoth, programId: '9', pledgeId: '77', recipientId: null })
    );
    expect(applied.pledgeId).toBe('77');
    expect(applied.mashabetahalichId).toBeNull();
    const pledgeWrite = sent.find((q) => q.includes('updateStipendPledge')) ?? '';
    expect(pledgeWrite).toContain('status: proposed');
    expect(sent.some((q) => q.includes('createMashabetahalich'))).toBe(false);
  });

  it('leaves a budget-only programme without a pledge', async () => {
    const { exec, sent } = fakeExec();
    const applied = await applyStandingStipend(
      exec as any,
      decision({ vots: signedByBoth, recipientId: null, pledgeId: null })
    );
    expect(applied.pledgeId).toBeNull();
    expect(sent.some((q) => q.includes('StipendPledge'))).toBe(false);
  });
});
