import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { draftRoster, stableHash, type DraftInput } from './draft';
import type { Commitment, Declaration, ShiftLike, Stance } from './types';

const DAY = 24 * 3600_000;
const BASE = Date.UTC(2026, 9, 4, 8); // Sunday 4 Oct 2026, 11:00 Jerusalem
const shift = (id: string, dayOffset: number, hours = 4, need = 1, extra: Partial<ShiftLike> = {}): ShiftLike => ({
  id,
  start: new Date(BASE + dayOffset * DAY).toISOString(),
  end: new Date(BASE + dayOffset * DAY + hours * 3600_000).toISOString(),
  need,
  ...extra
});
const decl = (shiftId: string, userId: string, stance: Stance, at: string, prefRank?: number): Declaration => ({
  shiftId,
  userId,
  stance,
  declaredAt: at,
  prefRank
});
const who = (r: ReturnType<typeof draftRoster>, shiftId: string, rank = 1) =>
  r.assignments.filter((a) => a.shiftId === shiftId && a.rank === rank).map((a) => a.userId).sort();

describe('draftRoster — the worked example of PLAN_SHIFTS §6.4', () => {
  // Ron declared first, for every shift. Dana wants Tuesday most.
  const input: DraftInput = {
    seed: 'period-1',
    shifts: [shift('A', 0), shift('B', 1), shift('C', 2), shift('D', 3), shift('E', 4)],
    commitments: [{ userId: 'ron' }, { userId: 'dana' }, { userId: 'yoav' }],
    declarations: [
      ...['A', 'B', 'C', 'D', 'E'].map((s) => decl(s, 'ron', 'can', '2026-09-27T09:00:00Z')),
      decl('A', 'yoav', 'can', '2026-09-28T09:00:00Z'),
      decl('D', 'yoav', 'can', '2026-09-28T09:00:00Z'),
      decl('B', 'dana', 'can', '2026-09-29T09:00:00Z'),
      decl('C', 'dana', 'want', '2026-09-29T09:00:00Z', 1),
      decl('D', 'dana', 'can', '2026-09-29T09:00:00Z')
    ]
  };
  const r = draftRoster(input);

  it('fills every shift', () => {
    expect(r.holes).toEqual([]);
  });

  it('gives Ron his share — 2 of 5 — not all five he declared first for', () => {
    expect(r.quota.quotas).toEqual({ dana: 2, ron: 2, yoav: 1 });
    expect(r.assigned).toEqual({ ron: 2, dana: 2, yoav: 1 });
  });

  it('places each shift the way the plan explains it', () => {
    // E: only Ron can. A: Ron and Yoav are equally below quota — Ron declared first.
    // B, C: Ron is at quota, so Dana. D: only Yoav still has quota.
    expect(who(r, 'E')).toEqual(['ron']);
    expect(who(r, 'A')).toEqual(['ron']);
    expect(who(r, 'B')).toEqual(['dana']);
    expect(who(r, 'C')).toEqual(['dana']);
    expect(who(r, 'D')).toEqual(['yoav']);
    const reasonOf = (s: string) => r.assignments.find((a) => a.shiftId === s && a.rank === 1)!.reason;
    expect(reasonOf('E')).toBe('onlyCandidate');
    expect(reasonOf('A')).toBe('declaredFirst');
  });

  it('puts everyone else who declared into the backup chain', () => {
    expect(who(r, 'A', 2)).toEqual(['yoav']);
    expect(who(r, 'C', 2)).toEqual(['ron']);
    // D: Ron and Dana both declared; both are backups, in a definite order.
    const dBackups = r.assignments.filter((a) => a.shiftId === 'D' && a.rank > 1).map((a) => a.rank);
    expect(dBackups).toEqual([2, 3]);
  });

  it('is reproducible from the stored seed', () => {
    expect(draftRoster(input)).toEqual(r);
  });
});

describe('draftRoster — rules', () => {
  it('fills the scarcest seat first so the only person who can do it is not spent elsewhere', () => {
    // Mon: Ron or Yoav. Tue: only Ron. Ron may do one. Time order would give
    // Mon to Ron (declared first) and leave Tue empty.
    const r = draftRoster({
      seed: 's',
      shifts: [shift('mon', 1), shift('tue', 2)],
      commitments: [{ userId: 'ron', max: 1 }, { userId: 'yoav' }],
      declarations: [
        decl('mon', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('tue', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('mon', 'yoav', 'can', '2026-09-02T00:00:00Z')
      ]
    });
    expect(who(r, 'tue')).toEqual(['ron']);
    expect(who(r, 'mon')).toEqual(['yoav']);
    expect(r.holes).toEqual([]);
  });

  it('goes over quota rather than leave a hole — but marks it', () => {
    // Dana declared for a and b, so her quota counts two — but a and b
    // overlap, so she can only work one of them. The quota promised a place
    // she cannot take; the second pass lets Ron go over his quota (he has no
    // max) instead of leaving b empty.
    const overlapping = { id: 'b', start: new Date(BASE + 3600_000).toISOString(), end: new Date(BASE + 5 * 3600_000).toISOString(), need: 1 };
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0), overlapping, shift('c', 2)],
      commitments: [{ userId: 'ron' }, { userId: 'dana' }],
      declarations: [
        decl('a', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('b', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('c', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('a', 'dana', 'can', '2026-09-01T00:00:00Z'),
        decl('b', 'dana', 'can', '2026-09-01T00:00:00Z')
      ]
    });
    expect(r.quota.quotas).toEqual({ ron: 1, dana: 2 });
    expect(r.holes).toEqual([]);
    const over = r.assignments.filter((a) => a.rank === 1 && a.reason === 'overQuota');
    expect(over).toHaveLength(1);
    expect(over[0].userId).toBe('ron');
  });

  it('never crosses a member’s agreed maximum — the seat stays a hole', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0), shift('b', 1)],
      commitments: [{ userId: 'ron', max: 1 }],
      declarations: [decl('a', 'ron', 'can', '2026-09-01T00:00:00Z'), decl('b', 'ron', 'can', '2026-09-01T00:00:00Z')]
    });
    expect(r.assigned.ron).toBe(1);
    expect(r.holes).toHaveLength(1);
  });

  it('leaves a seat nobody declared for as a hole', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0, 4, 2)],
      commitments: [{ userId: 'ron' }, { userId: 'dana' }],
      declarations: [decl('a', 'ron', 'can', '2026-09-01T00:00:00Z')]
    });
    expect(who(r, 'a')).toEqual(['ron']);
    expect(r.holes).toEqual([{ shiftId: 'a', missing: 1 }]);
  });

  it('prefers want over can, then the member’s own preference rank', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0), shift('b', 1)],
      commitments: [{ userId: 'ron' }, { userId: 'dana' }],
      declarations: [
        decl('a', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('a', 'dana', 'want', '2026-09-05T00:00:00Z'),
        decl('b', 'ron', 'want', '2026-09-01T00:00:00Z', 2),
        decl('b', 'dana', 'want', '2026-09-05T00:00:00Z', 1)
      ]
    });
    const a = r.assignments.find((x) => x.shiftId === 'a' && x.rank === 1)!;
    expect(a).toMatchObject({ userId: 'dana', reason: 'wanted' });
  });

  it('never gives one person two overlapping shifts, and respects the rest time', () => {
    const r = draftRoster({
      seed: 's',
      minRestHours: 10,
      shifts: [
        shift('morning', 0, 4),
        { id: 'overlap', start: new Date(BASE + 2 * 3600_000).toISOString(), end: new Date(BASE + 6 * 3600_000).toISOString(), need: 1 },
        { id: 'evening', start: new Date(BASE + 8 * 3600_000).toISOString(), end: new Date(BASE + 12 * 3600_000).toISOString(), need: 1 }
      ],
      commitments: [{ userId: 'ron' }],
      declarations: ['morning', 'overlap', 'evening'].map((s) => decl(s, 'ron', 'can', '2026-09-01T00:00:00Z'))
    });
    expect(r.assigned.ron).toBe(1);
    expect(r.holes).toHaveLength(2);
  });

  it('restricts a role window to members who hold the role', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('medic', 0, 4, 1, { tafkidimId: '7' })],
      commitments: [{ userId: 'ron' }, { userId: 'dana', tafkidimIds: ['7'] }],
      declarations: [decl('medic', 'ron', 'want', '2026-09-01T00:00:00Z'), decl('medic', 'dana', 'can', '2026-09-09T00:00:00Z')]
    });
    expect(who(r, 'medic')).toEqual(['dana']);
    expect(r.assignments.some((a) => a.userId === 'ron')).toBe(false);
  });

  it('ignores declarations from people who are not on the mission', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0)],
      commitments: [{ userId: 'ron' }],
      declarations: [decl('a', 'stranger', 'want', '2026-09-01T00:00:00Z')]
    });
    expect(r.assignments).toEqual([]);
    expect(r.holes).toHaveLength(1);
  });

  it('takes the latest statement: a later cannot withdraws an earlier can', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0)],
      commitments: [{ userId: 'ron' }],
      declarations: [decl('a', 'ron', 'can', '2026-09-01T00:00:00Z'), decl('a', 'ron', 'cannot', '2026-09-02T00:00:00Z')]
    });
    expect(r.assignments).toEqual([]);
  });

  it('skips cancelled shifts', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0, 4, 1, { state: 'cancelled' })],
      commitments: [{ userId: 'ron' }],
      declarations: [decl('a', 'ron', 'can', '2026-09-01T00:00:00Z')]
    });
    expect(r.assignments).toEqual([]);
    expect(r.holes).toEqual([]);
  });

  it('keeps the backup chain as deep as the declarations unless maxBackups caps it', () => {
    const users = ['a', 'b', 'c', 'd', 'e'];
    const base: DraftInput = {
      seed: 's',
      shifts: [shift('x', 0)],
      commitments: users.map((userId) => ({ userId })),
      declarations: users.map((u, i) => decl('x', u, 'can', `2026-09-0${i + 1}T00:00:00Z`))
    };
    expect(draftRoster(base).assignments.map((a) => a.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(draftRoster({ ...base, maxBackups: 2 }).assignments.map((a) => a.rank)).toEqual([1, 2, 3]);
  });

  it('does not list someone as backup for a shift that overlaps one they are working', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [
        shift('a', 0),
        { id: 'b', start: new Date(BASE + 3600_000).toISOString(), end: new Date(BASE + 5 * 3600_000).toISOString(), need: 1 }
      ],
      commitments: [{ userId: 'ron' }, { userId: 'dana' }],
      declarations: [
        decl('a', 'ron', 'want', '2026-09-01T00:00:00Z'),
        decl('b', 'ron', 'can', '2026-09-01T00:00:00Z'),
        decl('b', 'dana', 'can', '2026-09-01T00:00:00Z')
      ]
    });
    expect(who(r, 'a')).toEqual(['ron']);
    expect(who(r, 'b')).toEqual(['dana']);
    expect(who(r, 'b', 2)).toEqual([]);
  });

  it('reports who ended below their agreed minimum', () => {
    const r = draftRoster({
      seed: 's',
      shifts: [shift('a', 0)],
      commitments: [{ userId: 'ron', min: 3 }],
      declarations: [decl('a', 'ron', 'can', '2026-09-01T00:00:00Z')]
    });
    // Available for one shift only, so the minimum clamps to 1 and is met.
    expect(r.underMin).toEqual([]);
  });
});

describe('stableHash', () => {
  it('is deterministic and spreads', () => {
    expect(stableHash('a|b|c')).toBe(stableHash('a|b|c'));
    expect(stableHash('a|b|c')).not.toBe(stableHash('a|b|d'));
  });
});

describe('draftRoster — properties', () => {
  const USERS = ['u1', 'u2', 'u3', 'u4'];
  const scenario = fc
    .record({
      nShifts: fc.integer({ min: 1, max: 8 }),
      needs: fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 8, maxLength: 8 }),
      offsets: fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 8, maxLength: 8 }),
      stances: fc.array(fc.constantFrom<Stance | null>('want', 'can', 'ifNeeded', 'cannot', null), {
        minLength: 32,
        maxLength: 32
      }),
      maxes: fc.array(fc.option(fc.integer({ min: 0, max: 4 }), { nil: null }), { minLength: 4, maxLength: 4 }),
      seed: fc.string({ maxLength: 6 })
    })
    .map(({ nShifts, needs, offsets, stances, maxes, seed }) => {
      const shifts = Array.from({ length: nShifts }, (_, i) =>
        // 6-hour steps so some shifts overlap and some do not.
        ({ id: `s${i}`, start: new Date(BASE + offsets[i] * 6 * 3600_000).toISOString(), end: new Date(BASE + offsets[i] * 6 * 3600_000 + 8 * 3600_000).toISOString(), need: needs[i] })
      );
      const declarations: Declaration[] = [];
      shifts.forEach((s, i) =>
        USERS.forEach((u, j) => {
          const st = stances[i * 4 + j];
          if (st) declarations.push(decl(s.id, u, st, `2026-09-0${j + 1}T00:00:00Z`));
        })
      );
      const commitments: Commitment[] = USERS.map((userId, j) => ({ userId, max: maxes[j] }));
      return { shifts, declarations, commitments, seed } as DraftInput;
    });

  it('never places anyone without a matching want/can/ifNeeded', () => {
    fc.assert(
      fc.property(scenario, (input) => {
        const r = draftRoster(input);
        for (const a of r.assignments) {
          const d = input.declarations.find((x) => x.shiftId === a.shiftId && x.userId === a.userId);
          expect(d && d.stance !== 'cannot').toBeTruthy();
        }
      })
    );
  });

  it('never crosses shiftsMax, never double-books, never over-fills a shift', () => {
    fc.assert(
      fc.property(scenario, (input) => {
        const r = draftRoster(input);
        const primaries = r.assignments.filter((a) => a.rank === 1);
        for (const c of input.commitments) {
          const mine = primaries.filter((a) => a.userId === c.userId);
          if (c.max != null) expect(mine.length).toBeLessThanOrEqual(c.max);
          const spans = mine.map((a) => input.shifts.find((s) => s.id === a.shiftId)!);
          for (let i = 0; i < spans.length; i++)
            for (let j = i + 1; j < spans.length; j++)
              expect(spans[i].start < spans[j].end && spans[j].start < spans[i].end).toBe(false);
        }
        for (const s of input.shifts) {
          const filled = primaries.filter((a) => a.shiftId === s.id).length;
          const missing = r.holes.find((h) => h.shiftId === s.id)?.missing ?? 0;
          expect(filled + missing).toBe(s.need);
        }
      })
    );
  });

  it('is deterministic and independent of declaration order', () => {
    fc.assert(
      fc.property(scenario, (input) => {
        const a = draftRoster(input);
        const b = draftRoster({ ...input, declarations: [...input.declarations].reverse() });
        expect(b.assignments).toEqual(a.assignments);
        expect(draftRoster(input)).toEqual(a);
      })
    );
  });

  it('with everyone available for everything and no overlaps, nobody gets two more than another', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), fc.integer({ min: 2, max: 5 }), fc.string({ maxLength: 4 }), (n, people, seed) => {
        const users = Array.from({ length: people }, (_, i) => `p${i}`);
        const shifts = Array.from({ length: n }, (_, i) => shift(`s${i}`, i));
        const r = draftRoster({
          seed,
          shifts,
          commitments: users.map((userId) => ({ userId })),
          declarations: shifts.flatMap((s) => users.map((u) => decl(s.id, u, 'can', '2026-09-01T00:00:00Z')))
        });
        const counts = Object.values(r.assigned);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
        expect(r.holes).toEqual([]);
      })
    );
  });
});
