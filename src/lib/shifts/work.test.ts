import { describe, it, expect } from 'vitest';
import { buildShiftWork, type WorkPlanInput } from './work';
import { cycleContaining, resolveSettings } from './settings';
import type { AssignmentLike } from './types';

const S = resolveSettings();
// The cycle of Sunday 4 Oct 2026 (Jerusalem): declare until 1 Oct 21:00Z,
// objections until 2 Oct 21:00Z, runs 3 Oct 21:00Z – 10 Oct 21:00Z.
const cycle = cycleContaining('p', '2026-10-05T12:00:00Z', S);
const shift = (id: string, day: number, need = 1) => ({
  id,
  start: new Date(Date.UTC(2026, 9, 4 + day, 8)).toISOString(),
  end: new Date(Date.UTC(2026, 9, 4 + day, 12)).toISOString(),
  need
});
const row = (shiftId: string, userId: string, rank: number, state: AssignmentLike['state'] = 'draft', id = `${shiftId}-${userId}`): AssignmentLike => ({
  id,
  shiftId,
  userId,
  rank,
  state,
  reason: rank === 1 ? 'wanted' : 'backup'
});

function plan(over: Partial<WorkPlanInput> = {}): WorkPlanInput {
  return {
    plan: { id: 'p', name: 'Front desk', projectId: '3', openMissionId: '9', timeZone: 'Asia/Jerusalem' },
    cycles: [cycle],
    shifts: [shift('a', 0), shift('b', 1), shift('c', 2)],
    declarations: [],
    assignments: [],
    periods: {},
    commitments: [{ userId: 'ron' }, { userId: 'dana', max: 3 }],
    ...over
  };
}

describe('buildShiftWork — declare', () => {
  it('asks me to declare while the cycle is open and I have not answered every shift', () => {
    const w = buildShiftWork('ron', [plan({ declarations: [{ shiftId: 'a', userId: 'ron', stance: 'can', declaredAt: 'x' }] })], '2026-09-25T00:00:00Z');
    expect(w.declare).toEqual([
      expect.objectContaining({ planId: 'p', undeclared: 2, total: 3, draftAt: cycle.draftAt })
    ]);
  });

  it('stops asking once everything is answered — a "cannot" is an answer', () => {
    const decl = ['a', 'b', 'c'].map((s) => ({ shiftId: s, userId: 'ron', stance: 'cannot' as const, declaredAt: 'x' }));
    expect(buildShiftWork('ron', [plan({ declarations: decl })], '2026-09-25T00:00:00Z').declare).toEqual([]);
  });

  it('does not ask once the draft is out', () => {
    expect(buildShiftWork('ron', [plan()], '2026-10-02T00:00:00Z').declare).toEqual([]);
  });
});

describe('buildShiftWork — my draft', () => {
  it('shows my places with their reasons while the objection window is open', () => {
    const w = buildShiftWork(
      'ron',
      [
        plan({
          periods: { [cycle.periodKey]: { id: '50', state: 'draft', closesAt: cycle.closesAt } },
          assignments: [row('a', 'ron', 1), row('b', 'dana', 1), row('b', 'ron', 2), row('c', 'dana', 1)]
        })
      ],
      '2026-10-02T00:00:00Z'
    );
    expect(w.drafts).toHaveLength(1);
    expect(w.drafts[0].mine.map((m) => [m.shiftId, m.rank, m.reason])).toEqual([
      ['a', 1, 'wanted'],
      ['b', 2, 'backup']
    ]);
    expect(w.drafts[0].holes).toBe(0);
  });

  it('shows nothing about drafts or holes in shadow mode', () => {
    const w = buildShiftWork('ron', [plan({ periods: { [cycle.periodKey]: { id: '50', state: 'draft', closesAt: cycle.closesAt } } })], '2026-10-02T00:00:00Z', { shadow: true });
    expect(w.drafts).toEqual([]);
    expect(w.holes).toEqual([]);
  });
});

describe('buildShiftWork — holes', () => {
  const closed = { [cycle.periodKey]: { id: '50', state: 'closed' as const, closesAt: cycle.closesAt } };

  it('lists a coming shift nobody covers, and says who is next in line', () => {
    const w = buildShiftWork(
      'ron',
      [plan({ periods: closed, assignments: [row('a', 'dana', 1, 'released'), row('a', 'ron', 2, 'confirmed'), row('b', 'dana', 1, 'confirmed'), row('c', 'dana', 1, 'confirmed')] })],
      '2026-10-03T00:00:00Z'
    );
    expect(w.holes).toHaveLength(1);
    expect(w.holes[0]).toMatchObject({ shiftId: 'a', missing: 1, nextInLine: true, clashes: false, openMissionId: '9' });
  });

  it('puts the member with room left in their commitment first, and one who clashes last', () => {
    const assignments = [row('b', 'dana', 1, 'confirmed')];
    const w = buildShiftWork('dana', [plan({ periods: closed, assignments, shifts: [shift('a', 0), shift('b', 1), { ...shift('x', 1), id: 'x' }] })], '2026-10-03T00:00:00Z');
    // Dana agreed to 3, has 1: two spare. Shift x overlaps her shift b.
    expect(w.holes.map((h) => [h.shiftId, h.spare, h.clashes])).toEqual([
      ['a', 2, false],
      ['x', 2, true]
    ]);
  });

  it('does not list a shift that already started, or a cycle not yet drafted', () => {
    expect(buildShiftWork('ron', [plan({ periods: closed })], '2026-10-20T00:00:00Z').holes).toEqual([]);
    expect(buildShiftWork('ron', [plan()], '2026-10-03T00:00:00Z').holes).toEqual([]);
  });

  it('knows when the mission was already opened to another candidate this cycle', () => {
    const w = buildShiftWork('ron', [plan({ periods: { [cycle.periodKey]: { ...closed[cycle.periodKey], reopened: true } } })], '2026-10-03T00:00:00Z');
    expect(w.holes.every((h) => h.reopened)).toBe(true);
  });
});

describe('buildShiftWork — swaps', () => {
  const closed = { [cycle.periodKey]: { id: '50', state: 'closed' as const, closesAt: cycle.closesAt } };
  const swapRow = (signatures: Array<{ userId: string; order: number }>) => ({
    id: '700',
    giveId: 'a-ron',
    takeId: null,
    fromUserId: 'ron',
    toUserId: 'dana',
    deadline: '2026-10-04T00:00:00Z',
    silence: true,
    signatures
  });
  const base = { periods: closed, assignments: [row('a', 'ron', 1, 'confirmed'), row('b', 'dana', 1, 'confirmed'), row('c', 'dana', 1, 'confirmed')], names: { ron: 'Ron', dana: 'Dana' } };

  it('puts an offer on the heart of the member it waits on, with what a counter may ask for', () => {
    const w = buildShiftWork('dana', [plan({ ...base, swaps: [swapRow([{ userId: 'ron', order: 1 }])] })], '2026-10-03T00:00:00Z');
    expect(w.swaps).toHaveLength(1);
    expect(w.swaps[0]).toMatchObject({ decisionId: '700', myTurn: true, mine: false, otherName: 'Ron', take: null, silence: true, round: 1 });
    expect(w.swaps[0].options.map((o) => o.assignmentId)).toEqual(['b-dana', 'c-dana']);
  });

  it('the proposer sees it as waiting on the other side', () => {
    const w = buildShiftWork('ron', [plan({ ...base, swaps: [swapRow([{ userId: 'ron', order: 1 }])] })], '2026-10-03T00:00:00Z');
    expect(w.swaps[0]).toMatchObject({ myTurn: false, mine: true });
  });

  it('shows nothing once both signed, or in shadow mode', () => {
    const agreed = swapRow([{ userId: 'ron', order: 1 }, { userId: 'dana', order: 1 }]);
    expect(buildShiftWork('dana', [plan({ ...base, swaps: [agreed] })], '2026-10-03T00:00:00Z').swaps).toEqual([]);
    expect(buildShiftWork('dana', [plan({ ...base, swaps: [swapRow([{ userId: 'ron', order: 1 }])] })], '2026-10-03T00:00:00Z', { shadow: true }).swaps).toEqual([]);
  });
});
