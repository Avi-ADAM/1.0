import { describe, it, expect } from 'vitest';
import { processShiftWork } from './levShifts';
import { PRIORITY_BAND } from './levProcessors';
import { RENDERABLE_ANIS } from '$lib/components/lev/cards/cardKinds.js';

const hole = (shiftId: string, nextInLine: boolean) => ({
  planId: 'p',
  timeZone: 'Asia/Jerusalem',
  planName: 'Front desk',
  projectId: '3',
  openMissionId: '9',
  periodId: '50',
  shiftId,
  start: '2026-10-05T08:00:00Z',
  end: '2026-10-05T12:00:00Z',
  missing: 1,
  nextInLine,
  spare: 2,
  clashes: false,
  reopened: false
});

describe('processShiftWork', () => {
  it('is empty for no work', () => {
    expect(processShiftWork(null)).toEqual([]);
    expect(processShiftWork({ declare: [], drafts: [], holes: [], swaps: [], starting: [], toLog: [] })).toEqual([]);
  });

  it('turns each kind of shift work into a card the heart can render', () => {
    const items = processShiftWork({
      declare: [
        {
          planId: 'p',
          timeZone: 'Asia/Jerusalem',
          planName: 'Front desk',
          projectId: '3',
          periodKey: 'p:2026-10-04',
          cycleStart: '2026-10-03T21:00:00Z',
          cycleEnd: '2026-10-10T21:00:00Z',
          draftAt: '2026-10-01T21:00:00Z',
          undeclared: 2,
          total: 3
        }
      ],
      drafts: [
        {
          planId: 'p',
          timeZone: 'Asia/Jerusalem',
          planName: 'Front desk',
          projectId: '3',
          periodId: '50',
          cycleStart: '2026-10-03T21:00:00Z',
          cycleEnd: '2026-10-10T21:00:00Z',
          closesAt: '2026-10-02T21:00:00Z',
          mine: [],
          holes: 0
        }
      ],
      holes: [hole('a', false), hole('b', true)],
      swaps: [],
      starting: [],
      toLog: []
    });
    expect(items.map((i) => i.ani)).toEqual(['shiftDeclare', 'shiftDraft', 'shiftHole', 'shiftHole']);
    expect(items.every((i) => RENDERABLE_ANIS.includes(i.ani))).toBe(true);
    // Stable, distinct keys: a card removed by one hole must not take another with it.
    expect(new Set(items.map((i) => i.coinlapach)).size).toBe(4);
    // The next in line sees the hole ahead of everything else it is asked.
    const [, , a, b] = items;
    expect(b.pl).toBeLessThan(a.pl);
    expect(items.every((i) => i.pl >= PRIORITY_BAND.VOTE_PENDING)).toBe(true);
  });

  it('puts on the heart only the swaps that wait on me', () => {
    const swap = (decisionId: string, myTurn: boolean) => ({
      decisionId,
      planId: 'p',
      timeZone: 'Asia/Jerusalem',
      planName: 'Front desk',
      projectId: '3',
      myTurn,
      mine: false,
      otherUserId: '7',
      otherName: 'Ron',
      give: { assignmentId: '1', start: '2026-10-05T08:00:00Z', end: '2026-10-05T12:00:00Z' },
      take: null,
      deadline: '2026-10-04T00:00:00Z',
      silence: false,
      round: 1,
      options: []
    });
    const items = processShiftWork({ declare: [], drafts: [], holes: [], swaps: [swap('700', true), swap('701', false)], starting: [], toLog: [] });
    expect(items.map((i) => [i.ani, i.decisionId])).toEqual([['shiftSwap', '700']]);
  });
});
