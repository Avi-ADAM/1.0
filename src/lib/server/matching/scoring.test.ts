import { describe, it, expect } from 'vitest';
import { computeDateFit, computeMissionMatchScore } from './scoring';
import { calculateScore } from '$lib/utils/suggestionMatchers';

/**
 * Legacy lev-page scoring, reproduced verbatim from extractSuggestions:
 * the first loop hit seeds the score via calculateScore (base 1 when first
 * seen through a role, base 2 through a skill), then every additional
 * matching role adds +1 and every additional matching skill adds +2.
 */
function legacyScore(
  mission: { id: string; workWays: string[]; skills: string[]; roles: string[] },
  user: { workWays: string[]; skills: string[]; roles: string[] }
): number | undefined {
  let score: number | undefined;
  for (const role of user.roles) {
    if (!mission.roles.includes(role)) continue;
    score = score === undefined ? calculateScore(mission, user, 1) : score + 1;
  }
  for (const skill of user.skills) {
    if (!mission.skills.includes(skill)) continue;
    score = score === undefined ? calculateScore(mission, user, 2) : score + 2;
  }
  return score;
}

const cases: Array<{
  name: string;
  mission: { id: string; workWays: string[]; skills: string[]; roles: string[] };
  user: { workWays: string[]; skills: string[]; roles: string[] };
}> = [
  {
    name: 'single skill match, no work ways',
    mission: { id: 'm1', workWays: [], skills: ['s1'], roles: [] },
    user: { workWays: [], skills: ['s1'], roles: [] }
  },
  {
    name: 'single role match, missing one skill',
    mission: { id: 'm2', workWays: [], skills: ['s9'], roles: ['r1'] },
    user: { workWays: [], skills: [], roles: ['r1'] }
  },
  {
    name: 'two skills + one role match',
    mission: { id: 'm3', workWays: [], skills: ['s1', 's2'], roles: ['r1'] },
    user: { workWays: [], skills: ['s1', 's2'], roles: ['r1'] }
  },
  {
    name: 'perfect work-way match',
    mission: { id: 'm4', workWays: ['w1'], skills: ['s1'], roles: [] },
    user: { workWays: ['w1'], skills: ['s1'], roles: [] }
  },
  {
    name: 'partial work-way mismatch',
    mission: { id: 'm5', workWays: ['w1', 'w2'], skills: ['s1'], roles: [] },
    user: { workWays: ['w1'], skills: ['s1'], roles: [] }
  },
  {
    name: 'full work-way mismatch',
    mission: { id: 'm6', workWays: ['w2'], skills: ['s1'], roles: [] },
    user: { workWays: ['w1'], skills: ['s1'], roles: [] }
  },
  {
    name: 'role match with missing skills and roles',
    mission: { id: 'm7', workWays: [], skills: ['s1', 's2'], roles: ['r1', 'r2'] },
    user: { workWays: [], skills: [], roles: ['r1'] }
  },
  {
    name: 'skill match only, user has extra unrelated caps',
    mission: { id: 'm8', workWays: ['w1'], skills: ['s2'], roles: ['r9'] },
    user: { workWays: ['w1', 'w3'], skills: ['s2', 's7'], roles: ['r1'] }
  }
];

describe('computeMissionMatchScore', () => {
  it.each(cases)('matches the legacy lev algorithm: $name', ({ mission, user }) => {
    const legacy = legacyScore(mission, user);
    const modern = computeMissionMatchScore(mission, user);
    // legacy is undefined when nothing matched; modern returns 0/negative then
    if (legacy === undefined) {
      expect(modern.matchedSkills.length + modern.matchedRoles.length).toBe(0);
    } else {
      expect(modern.score).toBe(legacy);
    }
  });

  it('reports matched and missing sets', () => {
    const res = computeMissionMatchScore(
      { id: 'm', workWays: ['w1', 'w2'], skills: ['s1', 's2'], roles: ['r1'] },
      { workWays: ['w1'], skills: ['s1'], roles: [] }
    );
    expect(res.matchedSkills).toEqual(['s1']);
    expect(res.missingSkills).toEqual(['s2']);
    expect(res.matchedRoles).toEqual([]);
    expect(res.missingRoles).toEqual(['r1']);
    expect(res.matchedWorkWays).toEqual(['w1']);
  });

  it('no match at all yields non-positive score', () => {
    const res = computeMissionMatchScore(
      { id: 'm', workWays: [], skills: ['s1'], roles: ['r1'] },
      { workWays: [], skills: ['s9'], roles: ['r9'] }
    );
    expect(res.score).toBeLessThanOrEqual(0);
  });
});

describe('computeDateFit — the resource date gate', () => {
  const req = { requestStart: '2026-04-01', requestEnd: '2026-04-11' };

  it('is 1 when the offer window covers the whole request', () => {
    expect(computeDateFit({ ...req, offerStart: '2026-01-01', offerEnd: '2026-12-31' })).toBe(1);
  });

  it('is the covered fraction when the offer only partly overlaps', () => {
    // Offered from 6 April → 5 of the 10 requested days.
    expect(computeDateFit({ ...req, offerStart: '2026-04-06', offerEnd: '2026-12-31' })).toBe(0.5);
  });

  it('is 0 when the windows do not touch — the suggestion is dropped', () => {
    // The bug this closes: a projector nobody has offered since 2024 was still
    // being suggested for an April 2026 request.
    expect(computeDateFit({ ...req, offerStart: '2023-01-01', offerEnd: '2024-01-01' })).toBe(0);
  });

  it('touching edges do not count as an overlap', () => {
    expect(computeDateFit({ ...req, offerStart: '2026-04-11', offerEnd: '2026-12-31' })).toBe(0);
  });

  it('an unlimited resource always fits', () => {
    expect(
      computeDateFit({
        ...req,
        offerStart: '2023-01-01',
        offerEnd: '2024-01-01',
        resource: { availability: 'unlimited' }
      })
    ).toBe(1);
  });

  it('every missing input resolves to 1 rather than hiding a suggestion', () => {
    // A request with no dates has nothing to clash with, and a holder who never
    // said when they are free has not said no.
    expect(computeDateFit({})).toBe(1);
    expect(computeDateFit({ offerStart: '2026-01-01', offerEnd: '2026-02-01' })).toBe(1);
    expect(computeDateFit({ ...req })).toBe(1);
    expect(computeDateFit({ ...req, offerStart: null, offerEnd: null })).toBe(1);
  });

  it('ignores unparseable dates instead of producing NaN', () => {
    expect(computeDateFit({ requestStart: 'soon', requestEnd: 'later' })).toBe(1);
    expect(computeDateFit({ ...req, offerStart: 'whenever' })).toBe(1);
  });

  it('an open-ended offer covers an open-ended request', () => {
    expect(
      computeDateFit({ requestStart: '2026-04-01', requestEnd: null, offerStart: '2026-01-01' })
    ).toBe(1);
  });

  it('an existing booking eats into the fit once the ledger has rows', () => {
    expect(
      computeDateFit({
        ...req,
        offerStart: '2026-01-01',
        offerEnd: '2026-12-31',
        resource: { kindOf: 'rent' },
        bookings: [{ start: '2026-04-06', end: '2026-04-20', status: 'confirmed', quantity: 1 }],
        now: new Date('2026-03-01')
      })
    ).toBe(0.5);
  });
});
