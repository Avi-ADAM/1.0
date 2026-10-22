import { describe, expect, it } from 'vitest';
import { agreedIn, answerRound, askedIn, matureRule, openRound, readRuleVotes, roundComplete, roundOf, votsInput } from './consent';

const NOW = '2026-10-19T10:00:00.000Z';

describe('rounds', () => {
  it('the author opens a round with a yes; every target is asked', () => {
    const v = openRound([], '1', ['7', '8'], NOW);
    expect(roundOf(v)).toBe(1);
    expect(askedIn(v, 1).sort()).toEqual(['1', '7', '8']);
    expect(agreedIn(v, 1)).toEqual(['1']);
  });

  it('a counter-proposal opens the next round and keeps the history', () => {
    const r1 = openRound([], '1', ['7', '8'], NOW);
    const r2 = openRound(r1, '7', ['7', '8'], NOW, 'רק עד 10 ביום');
    expect(roundOf(r2)).toBe(2);
    expect(r2.filter((v) => v.order === 1)).toHaveLength(3);
    expect(agreedIn(r2, 2)).toEqual(['7']);
    expect(r2.find((v) => v.order === 2 && v.userId === '7')?.why).toBe('רק עד 10 ביום');
  });

  it('an answer replaces my row in the standing round only', () => {
    const v = answerRound(openRound([], '1', ['7', '8'], NOW), '7', NOW);
    expect(agreedIn(v, 1).sort()).toEqual(['1', '7']);
    expect(v.filter((x) => x.userId === '7')).toHaveLength(1);
    expect(roundComplete(v, ['7', '8'])).toBe(false);
    expect(roundComplete(answerRound(v, '8', NOW), ['7', '8'])).toBe(true);
  });
});

describe('matureRule — silence is consent', () => {
  it('everyone asked who still holds the work agrees; the rule goes live', () => {
    const votes = openRound([], '1', ['7', '8'], NOW);
    const out = matureRule({ proposerId: '1', targets: ['7', '8'], consentedBy: [], votes, paused: false });
    expect(out.consentedBy.sort()).toEqual(['7', '8']);
    expect(out.agreedBySilence.sort()).toEqual(['7', '8']);
    expect(out.consentState).toBe('active');
  });

  it('a holder who joined after the round opened was never asked — no consent by silence', () => {
    const votes = openRound([], '1', ['7'], NOW);
    const out = matureRule({ proposerId: '1', targets: ['7', '9'], consentedBy: [], votes, paused: false });
    expect(out.consentedBy).toEqual(['7']);
    expect(out.consentState).toBe('proposed');
  });

  it('someone asked who no longer holds the work is not swept in', () => {
    const votes = openRound([], '1', ['7', '8'], NOW);
    const out = matureRule({ proposerId: '1', targets: ['7'], consentedBy: [], votes, paused: false });
    expect(out.consentedBy).toEqual(['7']);
  });

  it('only the standing round counts; a paused rule stays paused', () => {
    const r2 = openRound(openRound([], '1', ['7', '8'], NOW), '7', ['7'], NOW);
    expect(matureRule({ proposerId: '1', targets: ['7', '8'], consentedBy: [], votes: r2, paused: false }).consentedBy).toEqual(['7']);
    expect(matureRule({ proposerId: '1', targets: ['7'], consentedBy: [], votes: r2, paused: true }).consentState).toBe('paused');
  });
});

describe('io', () => {
  it('reads the Decision vots in either shape and writes them back', () => {
    const read = readRuleVotes([
      { what: true, order: 1, users_permissions_user: { data: { id: 7 } }, zman: NOW },
      { what: null, order: 1, ide: 8 },
      { what: true, order: 1 }
    ]);
    expect(read).toEqual([
      { userId: '7', what: true, order: 1, why: null, zman: NOW },
      { userId: '8', what: null, order: 1, why: null, zman: null }
    ]);
    expect(votsInput(read)[0]).toEqual({ what: true, order: 1, users_permissions_user: '7', ide: 7, zman: NOW });
  });
});
