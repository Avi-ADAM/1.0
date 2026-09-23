import { describe, it, expect } from 'vitest';
import { checkSwap, silenceMayComplete, swapDeadline, swapOps, swapTurn, type SwapWorld } from './swap';
import type { AssignmentLike, Stance } from './types';

const NOW = '2026-10-01T00:00:00Z';
const shift = (id: string, day: number, hour = 8) => ({
  id,
  start: new Date(Date.UTC(2026, 9, 4 + day, hour)).toISOString(),
  end: new Date(Date.UTC(2026, 9, 4 + day, hour + 4)).toISOString(),
  need: 1
});
const row = (id: string, shiftId: string, userId: string, rank = 1, state: AssignmentLike['state'] = 'draft'): AssignmentLike => ({
  id,
  shiftId,
  userId,
  rank,
  state
});
const decl = (shiftId: string, userId: string, stance: Stance = 'can') => ({ shiftId, userId, stance, declaredAt: NOW });

function world(over: Partial<SwapWorld> = {}): SwapWorld {
  return {
    // tue = ron's, thu = dana's, thu2 overlaps thu.
    shifts: [shift('tue', 2), shift('thu', 4), shift('thu2', 4, 10), shift('fri', 5)],
    assignments: [row('r1', 'tue', 'ron'), row('d1', 'thu', 'dana')],
    declarations: [],
    commitments: [{ userId: 'ron' }, { userId: 'dana', max: 2 }, { userId: 'avi' }],
    ...over
  };
}
const parties = { fromUserId: 'ron', toUserId: 'dana' };

describe('checkSwap', () => {
  it('accepts a straight exchange, and a "just take mine"', () => {
    expect(checkSwap({ giveId: 'r1', takeId: 'd1' }, parties, world(), NOW)).toEqual({ ok: true });
    expect(checkSwap({ giveId: 'r1', takeId: null }, parties, world(), NOW)).toEqual({ ok: true });
  });

  it('only swaps my own coming place, for one of theirs', () => {
    expect(checkSwap({ giveId: 'd1', takeId: null }, parties, world(), NOW)).toEqual({ ok: false, problem: 'giveNotYours' });
    expect(checkSwap({ giveId: 'r1', takeId: 'r1' }, parties, world(), NOW)).toMatchObject({ ok: false, problem: 'takeNotTheirs' });
    const w = world({ assignments: [row('r1', 'tue', 'ron', 2), row('d1', 'thu', 'dana')] });
    expect(checkSwap({ giveId: 'r1', takeId: null }, parties, w, NOW)).toEqual({ ok: false, problem: 'notComing' });
  });

  it('never with someone outside the mission, or with myself', () => {
    expect(checkSwap({ giveId: 'r1', takeId: null }, { fromUserId: 'ron', toUserId: 'zoe' }, world(), NOW)).toEqual({ ok: false, problem: 'notOnMission' });
    expect(checkSwap({ giveId: 'r1', takeId: null }, { fromUserId: 'ron', toUserId: 'ron' }, world(), NOW)).toEqual({ ok: false, problem: 'samePerson' });
  });

  it('not once a shift has started', () => {
    expect(checkSwap({ giveId: 'r1', takeId: null }, parties, world(), '2026-10-06T09:00:00Z')).toEqual({ ok: false, problem: 'started' });
  });

  it('never leaves anyone in two overlapping shifts', () => {
    const w = world({ assignments: [row('r1', 'thu2', 'ron'), row('d1', 'thu', 'dana')] });
    // Dana keeps thu and would receive the overlapping thu2.
    expect(checkSwap({ giveId: 'r1', takeId: null }, parties, w, NOW)).toEqual({ ok: false, problem: 'clash' });
    // In exchange for thu she gives it up, so no clash is left — but Ron would get thu, which overlaps thu2 he gives away: fine.
    expect(checkSwap({ giveId: 'r1', takeId: 'd1' }, parties, w, NOW)).toEqual({ ok: true });
  });

  it('refuses to put someone in a shift they are already coming to', () => {
    const w = world({ assignments: [row('r1', 'tue', 'ron'), row('d1', 'thu', 'dana'), row('d2', 'tue', 'dana')] });
    expect(checkSwap({ giveId: 'r1', takeId: 'd1' }, parties, w, NOW)).toEqual({ ok: false, problem: 'alreadyThere' });
  });
});

describe('silenceMayComplete', () => {
  it('only when the silent member declared they can make what they would receive', () => {
    const terms = { giveId: 'r1', takeId: 'd1' };
    expect(silenceMayComplete(terms, parties, 'dana', world())).toBe(false);
    expect(silenceMayComplete(terms, parties, 'dana', world({ declarations: [decl('tue', 'dana', 'ifNeeded')] }))).toBe(true);
    expect(silenceMayComplete(terms, parties, 'dana', world({ declarations: [decl('tue', 'dana', 'cannot')] }))).toBe(false);
  });

  it('never past their agreed maximum', () => {
    // Dana (max 2) already comes to thu and fri; receiving tue without giving anything back makes 3.
    const w = world({
      assignments: [row('r1', 'tue', 'ron'), row('d1', 'thu', 'dana'), row('d2', 'fri', 'dana')],
      declarations: [decl('tue', 'dana', 'want')]
    });
    expect(silenceMayComplete({ giveId: 'r1', takeId: null }, parties, 'dana', w)).toBe(false);
    // An exchange keeps her at 2.
    expect(silenceMayComplete({ giveId: 'r1', takeId: 'd1' }, parties, 'dana', w)).toBe(true);
  });

  it('receiving nothing needs no declaration — giving the place away was their own proposal', () => {
    expect(silenceMayComplete({ giveId: 'r1', takeId: null }, parties, 'ron', world())).toBe(true);
  });
});

describe('swapTurn', () => {
  it('waits on whoever has not signed the standing round', () => {
    expect(swapTurn(parties, [{ userId: 'ron', order: 1 }])).toEqual({ round: 1, waitingOn: 'dana', agreed: false });
    // Dana countered: a new round only she signed.
    expect(swapTurn(parties, [{ userId: 'ron', order: 1 }, { userId: 'dana', order: 2 }])).toEqual({ round: 2, waitingOn: 'ron', agreed: false });
    expect(swapTurn(parties, [{ userId: 'ron', order: 1 }, { userId: 'dana', order: 1 }])).toMatchObject({ agreed: true, waitingOn: null });
  });
});

describe('swapDeadline', () => {
  it('is the earliest of the rikma pace, the roster close and the shift start', () => {
    expect(swapDeadline(NOW, 48, ['2026-10-02T21:00:00Z', '2026-10-06T08:00:00Z'])).toBe('2026-10-02T21:00:00.000Z');
    expect(swapDeadline(NOW, 24, [null, '2026-10-06T08:00:00Z'])).toBe('2026-10-02T00:00:00.000Z');
  });

  it('ignores a bound already in the past', () => {
    expect(swapDeadline(NOW, 24, ['2026-09-30T00:00:00Z'])).toBe('2026-10-02T00:00:00.000Z');
  });
});

describe('swapOps', () => {
  it('releases the old rows, creates new ones pointing at them, and steps a backup aside', () => {
    const w = world({ assignments: [row('r1', 'tue', 'ron'), row('d1', 'thu', 'dana', 1, 'confirmed'), row('d9', 'tue', 'dana', 2)] });
    expect(swapOps({ giveId: 'r1', takeId: 'd1' }, parties, w)).toEqual({
      release: ['r1', 'd1', 'd9'],
      create: [
        { shiftId: 'tue', userId: 'dana', state: 'draft', coveredForId: 'r1' },
        { shiftId: 'thu', userId: 'ron', state: 'confirmed', coveredForId: 'd1' }
      ]
    });
  });
});
