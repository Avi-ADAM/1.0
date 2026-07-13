import { describe, it, expect } from 'vitest';
import { computeMissionMatchScore } from './scoring';
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
