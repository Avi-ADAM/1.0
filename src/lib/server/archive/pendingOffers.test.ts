import { describe, it, expect } from 'vitest';
import {
  changedTerms,
  readOfferSnapshot,
  renegotiatePendingOffers,
  type OfferSnapshot,
  type OfferTerms,
} from './pendingOffers.js';
import { applyObjectChange } from './apply.js';
import type { ArchiveTarget } from './targets.js';
import type { StandingRound } from './apply.js';

const TERMS: OfferTerms = {
  name: 'עיצוב לוגו',
  descrip: 'לוגו לרקמה',
  hm: 10,
  price: 50,
  sqadualed: '2026-06-01T00:00:00.000Z',
  sqadualedf: '2026-07-01T00:00:00.000Z',
};

function offer(over: Partial<OfferSnapshot['offers'][number]> = {}) {
  return {
    id: '77',
    candidateId: '9',
    candidateName: 'נועה',
    // No address on purpose: the mail path is exercised separately, and these
    // tests must not reach for the mail stack.
    candidateEmail: null,
    candidateLang: 'he',
    candidateNoMail: false,
    maxOrdern: 0,
    vots: [{ userId: '9', order: 0, what: true, zman: null }],
    ...over,
  };
}

function snapshot(over: Partial<OfferSnapshot> = {}): OfferSnapshot {
  return {
    kind: 'openMission',
    targetId: '33',
    terms: TERMS,
    offers: [offer()],
    projectName: 'רקמת הבית',
    projectRestime: 'sth',
    ...over,
  };
}

/** Records every document, and answers the timegrama lookup. */
function fakeExec(activeTimegramaId: string | null = null) {
  const sent: string[] = [];
  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('timegramas(')) {
      return { data: { timegramas: { data: activeTimegramaId ? [{ id: activeTimegramaId }] : [] } } };
    }
    return { data: {} };
  };
  return { exec, sent, matching: (token: string) => sent.filter((q) => q.includes(token)) };
}

const keep = (over: Partial<StandingRound> = {}): StandingRound => ({
  ordern: 2,
  mode: 'keep',
  ...over,
});

describe('changedTerms', () => {
  it('ignores a round that merely restates today’s terms', () => {
    // The edit form opens prefilled with the current hours and rate, so an
    // edit about the description re-sends both unchanged.
    expect(changedTerms(TERMS, keep({ hm: 10, price: 50 }))).toEqual([]);
  });

  it('names every field that actually moved', () => {
    expect(changedTerms(TERMS, keep({ hm: 40, price: 20 }))).toEqual(['hm', 'price']);
  });

  it('counts a rewritten description — same hours, different work', () => {
    expect(changedTerms(TERMS, keep({ hm: 10, descrip: 'מיתוג מלא' }))).toEqual(['descrip']);
  });

  it('compares dates by instant, not by string', () => {
    expect(changedTerms(TERMS, keep({ sqadualed: '2026-06-01T00:00:00Z' }))).toEqual([]);
    expect(changedTerms(TERMS, keep({ sqadualed: '2026-09-01T00:00:00.000Z' }))).toEqual([
      'sqadualed',
    ]);
  });
});

describe('renegotiatePendingOffers', () => {
  it('puts the new terms to the candidate as a project round at ordern+1', async () => {
    const { exec, matching } = fakeExec();
    const done = await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 40, price: 20 }),
      actorId: '1',
    });

    expect(done).toEqual([{ offerId: '77', side: 'ask', candidateId: '9', ordern: 1 }]);
    const [round] = matching('createNegopendmission');
    expect(round).toContain('ask: "77"');
    expect(round).toContain('ordern: 1');
    expect(round).toContain('proposedBy: project');
    expect(round).toContain('noofhours: 40');
    expect(round).toContain('perhour: 20');
  });

  it('carries the unchanged terms too, so the round is self-describing', async () => {
    const { exec, matching } = fakeExec();
    await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 40 }),
      actorId: '1',
    });
    const [round] = matching('createNegopendmission');
    expect(round).toContain('noofhours: 40');
    expect(round).toContain('perhour: 50');
    expect(round).toContain('"עיצוב לוגו"');
  });

  it('signs the new round for the rikma, keeping the earlier votes', async () => {
    const { exec, matching } = fakeExec();
    await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 40 }),
      actorId: '1',
    });
    const [vote] = matching('updateAsk(');
    // The candidate's original yes stays at its own round…
    expect(vote).toContain('users_permissions_user: "9", order: 0');
    // …and the rikma stands behind the new one.
    expect(vote).toContain('users_permissions_user: "1", order: 1');
  });

  it('resets the candidate’s clock so they get a full restime to answer', async () => {
    const { exec, matching } = fakeExec('500');
    await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 40 }),
      actorId: '1',
    });
    const [clock] = matching('updateTimegrama');
    expect(clock).toContain('id: "500"');
    expect(clock).toContain('done: false');
  });

  it('starts a clock when the candidacy had none', async () => {
    const { exec, matching } = fakeExec(null);
    await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 40 }),
      actorId: '1',
    });
    const [clock] = matching('createTimegrama');
    expect(clock).toContain('whatami: "ask"');
    expect(clock).toContain('ask: "77"');
  });

  it('does nothing when the terms did not actually move', async () => {
    const { exec, sent } = fakeExec();
    const done = await renegotiatePendingOffers(exec, {
      snapshot: snapshot(),
      round: keep({ hm: 10, price: 50 }),
      actorId: '1',
    });
    expect(done).toEqual([]);
    expect(sent).toHaveLength(0);
  });

  it('re-opens every pending candidacy, each at its own round number', async () => {
    const { exec, matching } = fakeExec();
    const done = await renegotiatePendingOffers(exec, {
      snapshot: snapshot({
        offers: [offer(), offer({ id: '78', candidateId: '10', maxOrdern: 3, vots: [] })],
      }),
      round: keep({ price: 20 }),
      actorId: '1',
    });
    expect(done.map((d) => d.ordern)).toEqual([1, 4]);
    expect(matching('createNegopendmission')).toHaveLength(2);
  });

  it('one unreachable candidacy does not cost the others theirs', async () => {
    const sent: string[] = [];
    const exec = async (query: string) => {
      sent.push(query);
      if (query.includes('ask: "77"')) return { errors: [{ message: 'nope' }] };
      if (query.includes('timegramas(')) return { data: { timegramas: { data: [] } } };
      return { data: {} };
    };
    const done = await renegotiatePendingOffers(exec, {
      snapshot: snapshot({ offers: [offer(), offer({ id: '78', candidateId: '10' })] }),
      round: keep({ price: 20 }),
      actorId: '1',
    });
    expect(done.map((d) => d.offerId)).toEqual(['78']);
  });

  it('uses the resource collections on the askm side', async () => {
    const { exec, matching } = fakeExec();
    await renegotiatePendingOffers(exec, {
      snapshot: snapshot({ kind: 'openResource' }),
      round: keep({ hm: 4, price: 25 }),
      actorId: '1',
    });
    const [round] = matching('createNegoMash');
    expect(round).toContain('askm: "77"');
    expect(round).toContain('hm: 4');
    expect(round).toContain('price: 25');
    expect(matching('updateAskm(')).toHaveLength(1);
  });
});

describe('readOfferSnapshot', () => {
  it('is a no-op for the kinds that cannot carry a candidacy', async () => {
    const { exec, sent } = fakeExec();
    expect(await readOfferSnapshot(exec, 'missionInProgress', '10')).toBeNull();
    expect(await readOfferSnapshot(exec, 'matanot', '10')).toBeNull();
    expect(sent).toHaveLength(0);
  });

  it('flattens the candidacies and the terms they applied to', async () => {
    const exec = async () => ({
      data: {
        openMission: {
          data: {
            id: '33',
            attributes: {
              name: 'עיצוב לוגו',
              descrip: 'לוגו לרקמה',
              noofhours: 10,
              perhour: 50,
              project: { data: { attributes: { projectName: 'רקמת הבית', restime: 'sth' } } },
              asks: {
                data: [
                  {
                    id: '77',
                    attributes: {
                      users_permissions_user: {
                        data: { id: '9', attributes: { username: 'נועה', email: 'n@x.co' } },
                      },
                      vots: [{ what: true, order: 0, users_permissions_user: { data: { id: '9' } } }],
                      negopendmissions: { data: [{ attributes: { ordern: 2 } }] },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
    const snap = await readOfferSnapshot(exec, 'openMission', '33');
    expect(snap?.terms).toMatchObject({ hm: 10, price: 50 });
    expect(snap?.offers[0]).toMatchObject({ id: '77', candidateId: '9', maxOrdern: 2 });
  });

  it('returns null when nobody has applied', async () => {
    const exec = async () => ({
      data: { openMission: { data: { id: '33', attributes: { asks: { data: [] } } } } },
    });
    expect(await readOfferSnapshot(exec, 'openMission', '33')).toBeNull();
  });
});

describe('applyObjectChange — an edit under a pending candidacy', () => {
  const openMission = (): ArchiveTarget => ({
    kind: 'openMission',
    id: '33',
    name: 'עיצוב לוגו',
    lifecycle: 'archiveProposed',
    archiveEffectiveFrom: null,
    dormancyDays: null,
    projectId: '5',
    projectRestime: 'sth',
    projectDormancyDays: null,
    memberIds: ['1', '2'],
    ownerId: null,
    hoursAlready: 0,
    perhour: 50,
    hoursAssigned: null,
    finnishedMissionIds: [],
    hasActiveTimer: false,
    lastActivityAt: null,
    openMissionId: null,
    missionId: '44',
    recurring: false,
    cycleEnd: null,
    openOfferIds: ['77'],
    openCycleIds: [],
    openDecisionIds: [],
    origin: null,
  });

  /** Answers the snapshot read, then records what the applier writes. */
  function execWithCandidate() {
    const sent: string[] = [];
    const exec = async (query: string) => {
      sent.push(query);
      if (query.includes('openMission(id:') && query.includes('asks(')) {
        return {
          data: {
            openMission: {
              data: {
                id: '33',
                attributes: {
                  name: 'עיצוב לוגו',
                  noofhours: 10,
                  perhour: 50,
                  project: { data: { attributes: { projectName: 'רקמה', restime: 'sth' } } },
                  asks: {
                    data: [
                      {
                        id: '77',
                        attributes: {
                          users_permissions_user: { data: { id: '9', attributes: {} } },
                          vots: [
                            { what: true, order: 0, users_permissions_user: { data: { id: '9' } } },
                          ],
                          negopendmissions: { data: [] },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
      }
      if (query.includes('timegramas(')) return { data: { timegramas: { data: [] } } };
      return { data: {} };
    };
    return { exec, sent, matching: (t: string) => sent.filter((q) => q.includes(t)) };
  }

  it('applies the new terms AND hands them to the candidate to re-sign', async () => {
    const { exec, matching, sent } = execWithCandidate();
    const result = await applyObjectChange(exec, {
      target: openMission(),
      round: keep({ hm: 40, price: 20 }),
      actorId: '1',
    });

    expect(result.lifecycle).toBe('active');
    const [update] = matching('updateOpenMission');
    expect(update).toContain('noofhours: 40');
    expect(result.renegotiatedOffers).toEqual([
      { offerId: '77', side: 'ask', candidateId: '9', ordern: 1 },
    ]);

    // The candidacy is read before it is overwritten — otherwise every edit
    // would look like a change.
    const readAt = sent.findIndex((q) => q.includes('asks('));
    const writeAt = sent.findIndex((q) => q.includes('updateOpenMission'));
    expect(readAt).toBeLessThan(writeAt);
  });

  it('leaves the candidacy alone when the edit changed nothing they agreed to', async () => {
    const { exec, matching } = execWithCandidate();
    const result = await applyObjectChange(exec, {
      target: openMission(),
      round: keep({ hm: 10, price: 50 }),
      actorId: '1',
    });
    expect(result.renegotiatedOffers).toEqual([]);
    expect(matching('createNegopendmission')).toHaveLength(0);
  });

  it('archiving still just closes the candidacies — no round to answer', async () => {
    const { exec, matching } = execWithCandidate();
    const result = await applyObjectChange(exec, {
      target: openMission(),
      round: { ordern: 1, mode: 'archive', hoursOutcome: 'waive' },
    });
    expect(result.closedOfferIds).toEqual(['77']);
    expect(matching('createNegopendmission')).toHaveLength(0);
  });
});
