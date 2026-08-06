import { describe, it, expect } from 'vitest';
import { counterObjectChange, signObjectChange } from './vote.js';

interface Shape {
  rounds?: any[];
  vots?: any[];
  members?: string[];
  archived?: boolean;
  kind?: 'archiveObject' | 'editObject';
  scope?: 'archive' | 'release';
  hours?: number;
}

/**
 * A Strapi stand-in for the decision + its target. `sent` is the assertion
 * surface: what the rikma would actually see happen.
 */
function fakeExec(shape: Shape = {}) {
  const sent: string[] = [];
  const {
    rounds = [{ ordern: 1, mode: 'archive', hoursOutcome: 'waive', why: 'לא רלוונטי' }],
    vots = [{ what: true, order: 1, users_permissions_user: { data: { id: '1' } } }],
    members = ['1', '2'],
    archived = false,
    kind = 'archiveObject',
    scope = 'archive',
    hours = 0,
  } = shape;

  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('decision(id:')) {
      return {
        data: {
          decision: {
            data: {
              id: '500',
              attributes: {
                kind,
                archived,
                decisionName: 'ארכוב: עיצוב לוגו',
                targetKind: 'missionInProgress',
                archScope: scope,
                archSource: 'user',
                archWhy: 'לא רלוונטי',
                archEndsMembership: false,
                archMember: { data: null },
                vots,
                negoarch: rounds,
                timegrama: { data: { id: '600', attributes: { date: 'x', done: false } } },
                projects: {
                  data: [
                    {
                      id: '5',
                      attributes: {
                        restime: 'sth',
                        user_1s: { data: members.map((id) => ({ id })) },
                      },
                    },
                  ],
                },
                archMesimabetahalich: { data: { id: '10', attributes: { name: 'עיצוב לוגו' } } },
              },
            },
          },
        },
      };
    }
    if (query.includes('mesimabetahalich(id:')) {
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: '10',
              attributes: {
                name: 'עיצוב לוגו',
                lifecycle: 'archiveProposed',
                howmanyhoursalready: hours,
                perhour: 50,
                users_permissions_user: { data: { id: '2' } },
                activeTimer: { data: null },
                finnished_missions: { data: [] },
                mission: { data: { id: '44' } },
                open_missions: { data: [{ id: '33' }] },
                project: {
                  data: {
                    id: '5',
                    attributes: {
                      restime: 'sth',
                      user_1s: { data: members.map((id) => ({ id })) },
                    },
                  },
                },
                archive_decisions: { data: [] },
              },
            },
          },
        },
      };
    }
    if (query.includes('otherMissions:')) {
      const meta = (n: number) => ({ meta: { pagination: { total: n } } });
      return {
        data: {
          otherMissions: meta(1), // keep membership out of these assertions
          otherResources: meta(0),
          finnishedMissions: meta(0),
          sales: meta(0),
          halukas: meta(0),
          openAsks: meta(0),
          openAskms: meta(0),
        },
      };
    }
    return { data: {} };
  };

  return { exec, sent, matching: (t: string) => sent.filter((q) => q.includes(t)) };
}

describe('signObjectChange', () => {
  it('records the vote and waits when the rikma is not yet unanimous', async () => {
    const s = fakeExec({ members: ['1', '2', '3'] });
    const out = await signObjectChange(s.exec, '500', '2');

    expect(out.consensus).toBe(false);
    expect(out.order).toBe(1);
    expect(out.awaiting).toEqual(['3']);
    expect(s.matching('vots:')[0]).toContain('order: 1');
    // Nothing applied while a member still owes an answer.
    expect(s.matching('lifecycle: archived')).toHaveLength(0);
  });

  it('applies the standing version and closes the decision on unanimity', async () => {
    const s = fakeExec({ members: ['1', '2'] });
    const out = await signObjectChange(s.exec, '500', '2');

    expect(out.consensus).toBe(true);
    expect(out.applied?.lifecycle).toBe('archived');
    expect(s.matching('archived: true')).toHaveLength(1); // the Decision
    expect(s.matching('updateTimegrama')[0]).toContain('done: true');
  });

  it('applies the counter, not the original, when a later round is standing', async () => {
    const s = fakeExec({
      members: ['1', '2'],
      rounds: [
        { ordern: 1, mode: 'archive', hoursOutcome: 'waive' },
        { ordern: 2, mode: 'keep', hm: 8, price: 60 },
      ],
      vots: [
        { what: true, order: 1, users_permissions_user: { data: { id: '1' } } },
        { what: true, order: 2, users_permissions_user: { data: { id: '2' } } },
      ],
    });
    const out = await signObjectChange(s.exec, '500', '1');

    expect(out.order).toBe(2);
    expect(out.consensus).toBe(true);
    // The object survives with the negotiated terms.
    expect(out.applied?.lifecycle).toBe('active');
    expect(s.matching('hoursassinged: 8')).toHaveLength(1);
    expect(s.matching('lifecycle: archived')).toHaveLength(0);
  });

  it('refuses a second signature on the same round', async () => {
    const s = fakeExec({ members: ['1', '2'] });
    await expect(signObjectChange(s.exec, '500', '1')).rejects.toThrow(/already stand behind/);
  });

  it('refuses someone outside the rikma', async () => {
    const s = fakeExec();
    await expect(signObjectChange(s.exec, '500', '9')).rejects.toThrow(/member of the rikma/);
  });

  it('refuses a proposal that is already resolved', async () => {
    const s = fakeExec({ archived: true });
    await expect(signObjectChange(s.exec, '500', '2')).rejects.toThrow(/already resolved/);
  });
});

describe('counterObjectChange', () => {
  it('opens the next round, signs it, and keeps the earlier rounds as the record', async () => {
    const s = fakeExec({ members: ['1', '2'] });
    const out = await counterObjectChange(s.exec, {
      decisionId: '500',
      userId: '2',
      round: { mode: 'keep', hm: 8, why: 'בוא נצמצם במקום להסיר' },
    });

    expect(out.order).toBe(2);
    const [mutation] = s.matching('negoarch:');
    expect(mutation).toContain('ordern: 1'); // round 1 preserved
    expect(mutation).toContain('ordern: 2');
    expect(mutation).toContain('mode: keep');
    expect(mutation).toContain('hm: 8');
    // Proposing is agreeing.
    expect(mutation).toContain('order: 2');
  });

  it('inherits unspecified fields from the standing version', async () => {
    const s = fakeExec({
      members: ['1', '2'],
      rounds: [
        {
          ordern: 1,
          mode: 'archive',
          hoursOutcome: 'credit',
          hoursToCredit: 12,
          sqadualed: '2026-07-01T00:00:00.000Z',
        },
      ],
    });
    await counterObjectChange(s.exec, {
      decisionId: '500',
      userId: '2',
      round: { mode: 'archive', hoursToCredit: 6 },
    });

    const [mutation] = s.matching('negoarch:');
    // The dates the rikma already agreed on are not wiped by a counter about hours.
    expect(mutation).toContain('sqadualed: "2026-07-01T00:00:00.000Z"');
    expect(mutation).toContain('hoursOutcome: credit');
    expect(mutation).toContain('hoursToCredit: 6');
  });

  it('resets the silence clock — the rikma is being asked something new', async () => {
    const s = fakeExec({ members: ['1', '2'] });
    const out = await counterObjectChange(s.exec, {
      decisionId: '500',
      userId: '2',
      round: { mode: 'keep', hm: 8 },
    });

    expect(out.deadline).toBeTruthy();
    const [clock] = s.matching('updateTimegrama');
    expect(clock).toContain('done: false');
  });

  it('refuses a counter from someone who already signed the standing round', async () => {
    const s = fakeExec({ members: ['1', '2'] });
    await expect(
      counterObjectChange(s.exec, { decisionId: '500', userId: '1', round: { mode: 'keep' } }),
    ).rejects.toThrow(/not your turn/);
  });

  it('refuses a counter on a resolved proposal', async () => {
    const s = fakeExec({ archived: true });
    await expect(
      counterObjectChange(s.exec, { decisionId: '500', userId: '2', round: { mode: 'keep' } }),
    ).rejects.toThrow(/already resolved/);
  });
});

describe('the full ping-pong', () => {
  it('archive proposal → keep counter → approval leaves the object alive and changed', async () => {
    // Round 1: member 1 proposes removal (already recorded).
    // Round 2: member 2 counters with "keep it at 8 hours".
    const s = fakeExec({ members: ['1', '2'] });
    await counterObjectChange(s.exec, {
      decisionId: '500',
      userId: '2',
      round: { mode: 'keep', hm: 8, price: 60 },
    });

    // Member 1 now signs round 2 — this is where it matures.
    const after = fakeExec({
      members: ['1', '2'],
      rounds: [
        { ordern: 1, mode: 'archive', hoursOutcome: 'waive' },
        { ordern: 2, mode: 'keep', hm: 8, price: 60 },
      ],
      vots: [
        { what: true, order: 1, users_permissions_user: { data: { id: '1' } } },
        { what: true, order: 2, users_permissions_user: { data: { id: '2' } } },
      ],
    });
    const out = await signObjectChange(after.exec, '500', '1');

    expect(out.consensus).toBe(true);
    expect(out.applied?.lifecycle).toBe('active');
    const [applied] = after.matching('updateMesimabetahalich');
    expect(applied).toContain('hoursassinged: 8');
    expect(applied).toContain('perhour: 60');
  });
});
