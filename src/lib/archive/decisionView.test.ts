import { describe, it, expect } from 'vitest';
import { buildArchiveDecisionView, counterDefaults } from './decisionView.js';

/** A raw Decision node in the shape the lev slice query returns. */
function node(over: any = {}) {
  return {
    id: '500',
    attributes: {
      kind: 'archiveObject',
      targetKind: 'missionInProgress',
      archScope: 'archive',
      archSource: 'user',
      archWhy: 'הצורך התבטל',
      archEndsMembership: false,
      archMember: { data: null },
      vots: [{ what: true, order: 1, users_permissions_user: { data: { id: '1' } } }],
      negoarch: [
        {
          ordern: 1,
          mode: 'archive',
          why: 'הצורך התבטל',
          hoursOutcome: 'credit',
          hoursToCredit: 12,
          proposedBy: { data: { id: '1', attributes: { username: 'דנה' } } },
          zman: '2026-06-01T00:00:00.000Z',
        },
      ],
      archMesimabetahalich: {
        data: {
          id: '10',
          attributes: {
            name: 'עיצוב לוגו',
            howmanyhoursalready: 12,
            perhour: 50,
            users_permissions_user: {
              data: { id: '2', attributes: { username: 'יואב' } },
            },
          },
        },
      },
      ...over,
    },
  };
}

const MEMBERS = ['1', '2', '3'];

describe('buildArchiveDecisionView', () => {
  it('reads the proposal, its target and who carries it', () => {
    const v = buildArchiveDecisionView(node(), MEMBERS, '2')!;
    expect(v.decisionId).toBe('500');
    expect(v.targetKind).toBe('missionInProgress');
    expect(v.targetId).toBe('10');
    expect(v.targetName).toBe('עיצוב לוגו');
    expect(v.ownerId).toBe('2');
    expect(v.ownerName).toBe('יואב');
    expect(v.accruedHours).toBe(12);
    expect(v.why).toBe('הצורך התבטל');
  });

  it('ignores decisions of other kinds', () => {
    expect(buildArchiveDecisionView(node({ kind: 'pic' }), MEMBERS, '2')).toBeNull();
  });

  it('ignores a proposal whose target is missing rather than showing an empty card', () => {
    expect(
      buildArchiveDecisionView(node({ archMesimabetahalich: { data: null } }), MEMBERS, '2'),
    ).toBeNull();
    expect(buildArchiveDecisionView(node({ targetKind: null }), MEMBERS, '2')).toBeNull();
  });
});

describe('buildArchiveDecisionView — the version on the table', () => {
  const twoRounds = node({
    negoarch: [
      { ordern: 1, mode: 'archive', hoursOutcome: 'credit', hoursToCredit: 12 },
      {
        ordern: 2,
        mode: 'keep',
        hm: 8,
        price: 60,
        why: 'בוא נצמצם במקום להסיר',
        proposedBy: { data: { id: '2', attributes: { username: 'יואב' } } },
      },
    ],
    vots: [
      { what: true, order: 1, users_permissions_user: { data: { id: '1' } } },
      { what: true, order: 2, users_permissions_user: { data: { id: '2' } } },
    ],
  });

  it('is the highest round, not the first one', () => {
    const v = buildArchiveDecisionView(twoRounds, MEMBERS, '3')!;
    expect(v.standingOrder).toBe(2);
    expect(v.standing.mode).toBe('keep');
    expect(v.standing.hm).toBe(8);
    expect(v.original?.ordern).toBe(1);
    expect(v.original?.mode).toBe('archive');
  });

  it('counts signatures on the standing round only', () => {
    // A signature on round 1 says nothing about the counter that replaced it.
    const v = buildArchiveDecisionView(twoRounds, MEMBERS, '3')!;
    expect(v.signedIds).toEqual(['2']);
    expect(v.awaitingIds).toEqual(['1', '3']);
  });

  it('is my turn while I have not signed the standing round', () => {
    expect(buildArchiveDecisionView(twoRounds, MEMBERS, '3')!.myTurn).toBe(true);
    expect(buildArchiveDecisionView(twoRounds, MEMBERS, '1')!.myTurn).toBe(true);
    expect(buildArchiveDecisionView(twoRounds, MEMBERS, '2')!.myTurn).toBe(false);
  });

  it('is never my turn when I am not a member of the rikma', () => {
    expect(buildArchiveDecisionView(twoRounds, MEMBERS, '9')!.myTurn).toBe(false);
  });

  it('survives a proposal with no rounds at all', () => {
    const v = buildArchiveDecisionView(node({ negoarch: [] }), MEMBERS, '2')!;
    expect(v.standingOrder).toBe(1);
    expect(v.standing.mode).toBe('archive');
    expect(v.original).toBeNull();
  });

  it('defaults an editObject with no rounds to keep, not to removal', () => {
    const v = buildArchiveDecisionView(
      node({ kind: 'editObject', negoarch: [] }),
      MEMBERS,
      '2',
    )!;
    expect(v.standing.mode).toBe('keep');
  });
});

describe('buildArchiveDecisionView — the membership warning', () => {
  it('carries the flag and the member so the card can name them', () => {
    const v = buildArchiveDecisionView(
      node({
        archEndsMembership: true,
        archMember: { data: { id: '2', attributes: { username: 'יואב' } } },
      }),
      MEMBERS,
      '1',
    )!;
    expect(v.endsMembership).toBe(true);
    expect(v.memberId).toBe('2');
    expect(v.memberName).toBe('יואב');
  });

  it('is off by default', () => {
    expect(buildArchiveDecisionView(node(), MEMBERS, '1')!.endsMembership).toBe(false);
  });
});

describe('buildArchiveDecisionView — other target kinds', () => {
  it('reads a product proposal', () => {
    const v = buildArchiveDecisionView(
      node({
        targetKind: 'matanot',
        archMesimabetahalich: { data: null },
        archMatanot: { data: { id: '77', attributes: { name: 'חולצה', price: 90 } } },
      }),
      MEMBERS,
      '1',
    )!;
    expect(v.targetId).toBe('77');
    expect(v.targetName).toBe('חולצה');
    expect(v.perhour).toBe(90);
    expect(v.accruedHours).toBe(0);
  });

  it('marks a proposal the dormancy clock opened', () => {
    const v = buildArchiveDecisionView(node({ archSource: 'dormancy' }), MEMBERS, '1')!;
    expect(v.source).toBe('dormancy');
  });
});

describe('counterDefaults', () => {
  it('opens the drawer on the standing version, so nothing is wiped by accident', () => {
    const v = buildArchiveDecisionView(
      node({
        negoarch: [
          { ordern: 1, mode: 'archive' },
          { ordern: 2, mode: 'keep', hm: 8, price: 60, sqadualed: '2026-07-01T00:00:00.000Z' },
        ],
      }),
      MEMBERS,
      '1',
    )!;
    const d = counterDefaults(v);
    expect(d.hm).toBe(8);
    expect(d.price).toBe(60);
    expect(d.sqadualed).toBe('2026-07-01T00:00:00.000Z');
  });

  it('falls back to the object’s own values where the round is silent', () => {
    const v = buildArchiveDecisionView(node(), MEMBERS, '1')!;
    const d = counterDefaults(v, { descrip: 'התיאור המקורי' });
    expect(d.name).toBe('עיצוב לוגו');
    expect(d.price).toBe(50); // perhour off the mission
    expect(d.descrip).toBe('התיאור המקורי');
  });
});
