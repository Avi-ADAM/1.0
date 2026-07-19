import { describe, expect, it } from 'vitest';
import {
  chainsForPartof,
  findChainByRef,
  groupTimersByMonth,
  groupVotesByRound,
  normalizeMonter,
  normalizeVotes
} from './processLifecycle';

const user = (id: string, username = `user${id}`) => ({
  data: { id, attributes: { username, profilePic: { data: { attributes: { url: `/p${id}.png` } } } } }
});

describe('normalizeVotes / groupVotesByRound', () => {
  it('normalizes component votes and defaults missing order to round 0', () => {
    const votes = normalizeVotes([
      { id: 1, what: true, why: 'ok', zman: '2026-01-01T00:00:00Z', users_permissions_user: user('7') },
      { id: 2, what: false, order: 2, users_permissions_user: user('8') },
      { id: 3 }
    ]);
    expect(votes).toHaveLength(3);
    expect(votes[0]).toMatchObject({ what: true, why: 'ok', order: 0, userId: '7', username: 'user7' });
    expect(votes[1]).toMatchObject({ what: false, order: 2, userId: '8' });
    expect(votes[2]).toMatchObject({ what: null, why: '', userId: '' });
  });

  it('groups votes into ascending rounds', () => {
    const rounds = groupVotesByRound([
      { id: 1, what: true, order: 1 },
      { id: 2, what: true, order: 0 },
      { id: 3, what: false, order: 1 }
    ]);
    expect(rounds.map((round) => round.order)).toEqual([0, 1]);
    expect(rounds[1].votes).toHaveLength(2);
  });

  it('handles null input', () => {
    expect(groupVotesByRound(null)).toEqual([]);
    expect(normalizeVotes(undefined)).toEqual([]);
  });
});

describe('groupTimersByMonth', () => {
  const timer = (id: string, start: string | null, totalHours = 1) => ({
    id,
    attributes: { start, totalHours }
  });

  it('groups by YYYY-MM, newest month first, and sums hours', () => {
    const groups = groupTimersByMonth([
      timer('1', '2026-05-02T10:00:00Z', 2),
      timer('2', '2026-06-01T09:00:00Z', 3),
      timer('3', '2026-05-20T08:00:00Z', 1.5),
      timer('4', null, 4)
    ]);
    expect(groups.map((group) => group.month)).toEqual(['2026-06', '2026-05', '']);
    expect(groups[1].totalHours).toBeCloseTo(3.5);
    // newest timer first inside the month
    expect(groups[1].timers[0].id).toBe('3');
  });
});

describe('normalizeMonter', () => {
  it('sorts by monthStart descending and normalizes numbers', () => {
    const months = normalizeMonter([
      { id: 1, monthStart: '2026-04-01', hours: '10', hoursDone: null, isDone: false },
      { id: 2, monthStart: '2026-06-01', hours: 5, hoursDone: 5, isDone: true, finnished_mission: { data: { id: 9 } } }
    ]);
    expect(months[0]).toMatchObject({ monthStart: '2026-06-01', isDone: true, finnishedMissionId: '9' });
    expect(months[1]).toMatchObject({ hours: 10, hoursDone: 0, finnishedMissionId: null });
  });
});

describe('findChainByRef', () => {
  const missionChain = {
    id: 'pendm-1',
    pendm: { id: '1' },
    openMission: { id: '10', attributes: { asks: { data: [{ id: '55' }] } } },
    mesimabetahalich: { id: '20' },
    acts: [{ id: '30' }],
    finiapruvals: [{ id: '40' }],
    finnishedMissionId: '50'
  };
  const resourceChain = {
    id: '100',
    openMashaabim: { id: '100' },
    pmash: { id: '70' },
    askms: [{ id: '71' }],
    maap: { id: '72' },
    rikmashes: [{ id: '73' }]
  };
  const missionChains = [missionChain];
  const resourceChains = [resourceChain];

  it('resolves direct chain ids', () => {
    expect(findChainByRef(missionChains, resourceChains, 'pendm-1')?.kind).toBe('mission');
    expect(findChainByRef(missionChains, resourceChains, '100')?.kind).toBe('resource');
  });

  it('resolves merged mission-entity refs (om/bm on a pendm chain)', () => {
    expect(findChainByRef(missionChains, resourceChains, 'om-10')?.chain).toBe(missionChain);
    expect(findChainByRef(missionChains, resourceChains, 'bm-20')?.chain).toBe(missionChain);
  });

  it('resolves nested entity refs', () => {
    for (const ref of ['ask-55', 'act-30', 'fini-40', 'fm-50']) {
      expect(findChainByRef(missionChains, resourceChains, ref)?.chain).toBe(missionChain);
    }
    for (const ref of ['pmash-70', 'askm-71', 'maap-72', 'rikmash-73', 'mash-100']) {
      expect(findChainByRef(missionChains, resourceChains, ref)?.chain).toBe(resourceChain);
    }
  });

  it('returns null for unknown refs', () => {
    expect(findChainByRef(missionChains, resourceChains, 'om-999')).toBeNull();
    expect(findChainByRef(missionChains, resourceChains, 'nope')).toBeNull();
    expect(findChainByRef(missionChains, resourceChains, '')).toBeNull();
  });
});

describe('chainsForPartof', () => {
  it('matches chains whose entities carry the partof id', () => {
    const partofs = { data: [{ id: '5' }] };
    const missionChains = [
      { id: 'om-1', openMission: { id: '1', attributes: { partofs } }, mesimabetahalich: null },
      { id: 'om-2', openMission: { id: '2', attributes: {} }, mesimabetahalich: null },
      { id: 'bm-3', openMission: null, mesimabetahalich: { id: '3', attributes: { partofs } } }
    ];
    const resourceChains = [
      { id: '9', openMashaabim: { id: '9', attributes: { partofs } } },
      { id: '8', openMashaabim: { id: '8', attributes: {} } }
    ];
    const result = chainsForPartof(missionChains, resourceChains, '5');
    expect(result.missionChains.map((chain) => chain.id)).toEqual(['om-1', 'bm-3']);
    expect(result.resourceChains.map((chain) => chain.id)).toEqual(['9']);
  });
});
