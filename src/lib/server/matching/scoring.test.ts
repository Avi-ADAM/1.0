import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  compareMatches,
  computeDateFit,
  computeMissionMatchScore,
  computeUnheld,
  MIN_SUGGESTION_SCORE
} from './scoring';

describe('computeMissionMatchScore', () => {
  it('a single skill match, nothing else', () => {
    const r = computeMissionMatchScore(
      { id: 'm', workWays: [], skills: ['s1'], roles: [] },
      { workWays: [], skills: ['s1'], roles: [] }
    );
    expect(r).toMatchObject({ qualifies: true, score: 2, rawScore: 2 });
  });

  it('two skills + one role, all held', () => {
    const r = computeMissionMatchScore(
      { id: 'm', workWays: [], skills: ['s1', 's2'], roles: ['r1'] },
      { workWays: [], skills: ['s1', 's2'], roles: ['r1'] }
    );
    expect(r.score).toBe(5);
  });

  it('work ways add +1 per match and −1 once for any mismatch', () => {
    const mission = { id: 'm', workWays: ['w1', 'w2', 'w3'], skills: ['s1'], roles: [] };
    const score = (workWays: string[]) =>
      computeMissionMatchScore(mission, { workWays, skills: ['s1'], roles: [] }).rawScore;
    expect(score([])).toBe(2); // user stated no work ways → neutral
    expect(score(['w1', 'w2', 'w3'])).toBe(2 + 3);
    expect(score(['w1'])).toBe(2 + 1 - 1);
    expect(score(['w9'])).toBe(2 - 1); // three mismatches, still only −1
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

  it('no skill or role in common never qualifies', () => {
    const res = computeMissionMatchScore(
      { id: 'm', workWays: [], skills: ['s1'], roles: ['r1'] },
      { workWays: [], skills: ['s9'], roles: ['r9'] }
    );
    expect(res.qualifies).toBe(false);
    expect(res.score).toBeLessThanOrEqual(0);
  });

  it('a role-only match keeps the threshold', () => {
    const mission = { id: 'm', workWays: [], skills: ['s9'], roles: ['r1'] };
    // +1 role − 2 missing skill = −1
    expect(computeMissionMatchScore(mission, { workWays: [], skills: [], roles: ['r1'] }).qualifies).toBe(false);
    // the missing skill is held by nobody → +1
    expect(
      computeMissionMatchScore(mission, { workWays: [], skills: [], roles: ['r1'] }, { skills: ['s9'] }).qualifies
    ).toBe(true);
  });
});

describe('computeMissionMatchScore — concierge missions that reached nobody (2026-10-07)', () => {
  // 286 "build a wooden table": skill 331, role 213, onsite + freelance
  const table = { id: '286', skills: ['331'], roles: ['213'], workWays: ['124', '125'] };
  // 287 "assemble a desktop PC": skill 344, role 215, onsite
  const pc = { id: '287', skills: ['344'], roles: ['215'], workWays: ['124'] };
  const u258 = { skills: ['331', '344'], roles: ['177', '30', '183', '202'], workWays: ['122', '23'] };
  const u256 = { skills: ['344'], roles: ['1', '2'], workWays: ['122', '23', '1'] };

  it.each([
    ['286 × 258', table, u258],
    ['287 × 258', pc, u258],
    ['287 × 256', pc, u256]
  ])('%s is suggested — the skill qualifies, the role and work way only rank it', (_n, m, u) => {
    const r = computeMissionMatchScore(m, u);
    expect(r.qualifies).toBe(true);
    expect(r.score).toBe(MIN_SUGGESTION_SCORE);
    // +2 skill − 1 missing role − 1 work-way mismatch
    expect(r.rawScore).toBe(0);
  });

  it('ranks below a holder of the role and the work way', () => {
    const fit = computeMissionMatchScore(pc, { skills: ['344'], roles: ['215'], workWays: ['124'] });
    const partial = computeMissionMatchScore(pc, u256);
    expect(compareMatches(fit, partial)).toBeLessThan(0);
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

describe('computeMissionMatchScore — requirements nobody holds (QA C-8)', () => {
  const mission = { id: '282', workWays: [], skills: ['carpentry', 'n1', 'n2', 'n3', 'n4'], roles: [] };
  const carpenter = { workWays: [], skills: ['carpentry'], roles: [] };

  it('penalties only rank the one real carpenter — they no longer hide the need', () => {
    const r = computeMissionMatchScore(mission, carpenter);
    expect(r.rawScore).toBe(2 - 8);
    expect(r.qualifies).toBe(true);
    expect(r.score).toBe(MIN_SUGGESTION_SCORE);
  });

  it('does not penalise skills no candidate holds', () => {
    const r = computeMissionMatchScore(mission, carpenter, { skills: ['n1', 'n2', 'n3', 'n4'] });
    expect(r.score).toBe(2);
    expect(r.missingSkills).toEqual([]);
  });

  it('still penalises a skill other candidates do hold', () => {
    const r = computeMissionMatchScore(mission, carpenter, { skills: ['n2', 'n3', 'n4'] });
    expect(r.rawScore).toBe(0);
    expect(r.missingSkills).toEqual(['n1']);
  });
});

describe('computeUnheld', () => {
  it('returns the requirements no one in the pool holds', () => {
    const pool = [
      { skills: ['s1'], roles: [] },
      { skills: [], roles: ['r2'] }
    ];
    expect(computeUnheld({ skills: ['s1', 's2'], roles: ['r1', 'r2'] }, pool)).toEqual({
      skills: ['s2'],
      roles: ['r1']
    });
  });

  it('an empty pool holds nothing', () => {
    expect(computeUnheld({ skills: ['s1'], roles: ['r1'] }, [])).toEqual({ skills: ['s1'], roles: ['r1'] });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Properties
// ─────────────────────────────────────────────────────────────────────────────

const idArb = (prefix: string) =>
  fc.uniqueArray(fc.integer({ min: 1, max: 8 }).map((n) => `${prefix}${n}`), { maxLength: 6 });
const missionArb = fc.record({ id: fc.constant('m'), skills: idArb('s'), roles: idArb('r'), workWays: idArb('w') });
const userArb = fc.record({ skills: idArb('s'), roles: idArb('r'), workWays: idArb('w') });
const unheldArb = fc.record({ skills: idArb('s'), roles: idArb('r') });

describe('computeMissionMatchScore — properties', () => {
  it('a held skill always qualifies, whatever else is missing', () => {
    fc.assert(
      fc.property(missionArb, userArb, unheldArb, (m, u, unheld) => {
        const r = computeMissionMatchScore(m, u, unheld);
        if (r.matchedSkills.length > 0) {
          expect(r.qualifies).toBe(true);
          expect(r.score).toBeGreaterThanOrEqual(MIN_SUGGESTION_SCORE);
        }
      })
    );
  });

  it('without a skill or role in common nothing qualifies', () => {
    fc.assert(
      fc.property(missionArb, userArb, unheldArb, (m, u, unheld) => {
        const r = computeMissionMatchScore(m, u, unheld);
        if (r.matchedSkills.length === 0 && r.matchedRoles.length === 0) expect(r.qualifies).toBe(false);
      })
    );
  });

  it('a role-only match qualifies exactly when its raw score reaches the threshold', () => {
    fc.assert(
      fc.property(missionArb, userArb, unheldArb, (m, u, unheld) => {
        const r = computeMissionMatchScore(m, u, unheld);
        if (r.matchedSkills.length === 0 && r.matchedRoles.length > 0) {
          expect(r.qualifies).toBe(r.rawScore >= MIN_SUGGESTION_SCORE);
          expect(r.score).toBe(r.rawScore);
        }
      })
    );
  });

  it('clamping only ever lifts: score ≥ rawScore', () => {
    fc.assert(
      fc.property(missionArb, userArb, unheldArb, (m, u, unheld) => {
        const r = computeMissionMatchScore(m, u, unheld);
        expect(r.score).toBeGreaterThanOrEqual(r.rawScore);
      })
    );
  });

  it('work ways move the raw score by at most −1 against a user who stated none', () => {
    fc.assert(
      fc.property(missionArb, userArb, (m, u) => {
        const withWW = computeMissionMatchScore(m, u).rawScore;
        const without = computeMissionMatchScore(m, { ...u, workWays: [] }).rawScore;
        expect(withWW).toBeGreaterThanOrEqual(without - 1);
      })
    );
  });

  it('gaining a required skill never lowers the raw score or un-qualifies', () => {
    fc.assert(
      fc.property(missionArb, userArb, (m, u) => {
        fc.pre(m.skills.some((s) => !u.skills.includes(s)));
        const gained = m.skills.find((s) => !u.skills.includes(s))!;
        const before = computeMissionMatchScore(m, u);
        const after = computeMissionMatchScore(m, { ...u, skills: [...u.skills, gained] });
        expect(after.rawScore).toBeGreaterThan(before.rawScore);
        expect(after.qualifies).toBe(true);
      })
    );
  });

  it('a requirement nobody holds never lowers the score', () => {
    fc.assert(
      fc.property(missionArb, userArb, unheldArb, (m, u, unheld) => {
        const strict = computeMissionMatchScore(m, u);
        const lenient = computeMissionMatchScore(m, u, unheld);
        expect(lenient.rawScore).toBeGreaterThanOrEqual(strict.rawScore);
        if (strict.qualifies) expect(lenient.qualifies).toBe(true);
      })
    );
  });

  it('both engine directions agree: the unheld set from either pool yields the same result', () => {
    // matchOpenMissionToUsers pools everyone holding any requirement;
    // matchUserToOpenEntities pools everyone holding a requirement the user lacks.
    // For the user being scored, the two unheld sets differ only in what the user
    // holds — which is never "missing" — so the scores must be equal.
    fc.assert(
      fc.property(missionArb, userArb, fc.array(userArb, { maxLength: 5 }), (m, u, others) => {
        const missionPool = computeUnheld(m, [u, ...others]);
        const userPool = computeUnheld(m, others);
        const a = computeMissionMatchScore(m, u, missionPool);
        const b = computeMissionMatchScore(m, u, userPool);
        expect(a.score).toBe(b.score);
        expect(a.rawScore).toBe(b.rawScore);
        expect(a.qualifies).toBe(b.qualifies);
      })
    );
  });
});
