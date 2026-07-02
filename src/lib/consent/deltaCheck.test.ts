import { describe, it, expect } from 'vitest';
import { checkDeltas, shareBps } from './deltaCheck';
import { emptyState, type ProjectState } from './projection';
import type { Delta } from './event';

function state(patch: Partial<ProjectState> = {}): ProjectState {
  return { ...emptyState('p1'), ...patch };
}

function withBalances(entries: [string, bigint][], members?: string[]): ProjectState {
  return state({
    balances: new Map(entries),
    members: new Set(members ?? entries.map(([m]) => m))
  });
}

describe('shareBps', () => {
  it('is 0 when the pot is empty', () => {
    expect(shareBps(state(), 'A')).toBe(0);
  });

  it('floors to basis points of the total', () => {
    const s = withBalances([['A', 100n], ['B', 200n]]);
    expect(shareBps(s, 'A')).toBe(3333);
    expect(shareBps(s, 'B')).toBe(6666);
    expect(shareBps(s, 'nobody')).toBe(0);
  });
});

describe('checkDeltas — soundness', () => {
  it('accepts a true hervachti.add', () => {
    const before = withBalances([['yuri', 1000n]]);
    const after = withBalances([['yuri', 37000n]]);
    const deltas: Delta[] = [
      { kind: 'hervachti.add', member: 'yuri', amount: '36000', code: 'ILS' }
    ];
    expect(checkDeltas(before, after, deltas)).toEqual({ ok: true, unchecked: [] });
  });

  it('rejects a hervachti.add whose amount lies', () => {
    const before = withBalances([['yuri', 1000n]]);
    const after = withBalances([['yuri', 2000n]]);
    const deltas: Delta[] = [
      { kind: 'hervachti.add', member: 'yuri', amount: '36000', code: 'ILS' }
    ];
    const r = checkDeltas(before, after, deltas);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('amount_mismatch');
  });

  it('validates hervachti.move on both sides', () => {
    const before = withBalances([['A', 500n], ['B', 100n]]);
    const after = withBalances([['A', 300n], ['B', 300n]]);
    const good: Delta[] = [
      { kind: 'hervachti.move', from: 'A', to: 'B', amount: '200', code: 'ILS' }
    ];
    expect(checkDeltas(before, after, good).ok).toBe(true);

    const bad: Delta[] = [
      { kind: 'hervachti.move', from: 'B', to: 'A', amount: '200', code: 'ILS' }
    ];
    expect(checkDeltas(before, after, bad).ok).toBe(false);
  });

  it('member.add requires actually-added; member.remove actually-removed', () => {
    const before = state({ members: new Set(['A']) });
    const after = state({ members: new Set(['A', 'B']) });
    expect(checkDeltas(before, after, [{ kind: 'member.add', member: 'B' }]).ok).toBe(true);
    expect(checkDeltas(before, after, [{ kind: 'member.add', member: 'C' }]).ok).toBe(false);
    expect(checkDeltas(before, after, [{ kind: 'member.add', member: 'A' }]).ok).toBe(false);
    expect(checkDeltas(after, before, [{ kind: 'member.remove', member: 'B' }]).ok).toBe(true);
  });

  it('share.bump must match recomputed basis points', () => {
    const before = withBalances([['A', 100n], ['B', 100n]]);   // A = 5000 bps
    const after = withBalances([['A', 300n], ['B', 100n]]);    // A = 7500 bps
    const good: Delta[] = [
      { kind: 'hervachti.add', member: 'A', amount: '200', code: 'ILS' },
      { kind: 'share.bump', member: 'A', oldBps: 5000, newBps: 7500 }
    ];
    expect(checkDeltas(before, after, good).ok).toBe(true);

    const bad: Delta[] = [
      { kind: 'hervachti.add', member: 'A', amount: '200', code: 'ILS' },
      { kind: 'share.bump', member: 'A', oldBps: 5000, newBps: 9999 }
    ];
    expect(checkDeltas(before, after, bad).ok).toBe(false);
  });

  it('value.set on a modeled path checks before AND after', () => {
    const before = withBalances([['A', 100n]]);
    const after = withBalances([['A', 250n]]);
    const good: Delta[] = [
      { kind: 'value.set', path: 'balances/A', before: '100', after: '250' }
    ];
    expect(checkDeltas(before, after, good).ok).toBe(true);

    const bad: Delta[] = [
      { kind: 'value.set', path: 'balances/A', before: '999', after: '250' }
    ];
    expect(checkDeltas(before, after, bad).ok).toBe(false);
  });

  it('value.set on an unmodeled path is reported, not rejected', () => {
    const s = state();
    const deltas: Delta[] = [
      { kind: 'value.set', path: 'config/quorumRule', before: null, after: 'unanimous' }
    ];
    const r = checkDeltas(s, s, deltas);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.unchecked).toEqual(['value.set:config/quorumRule']);
  });

  it('round.advance checks the from/to round numbers', () => {
    const before = state({ rounds: new Map([['tosplit:t1', { current: 0, start: 1 }]]) });
    const after = state({ rounds: new Map([['tosplit:t1', { current: 1, start: 2 }]]) });
    expect(checkDeltas(before, after, [
      { kind: 'round.advance', subject: 'tosplit:t1', from: 0, to: 1, reason: 'counter' }
    ]).ok).toBe(true);
    expect(checkDeltas(before, after, [
      { kind: 'round.advance', subject: 'tosplit:t1', from: 1, to: 2, reason: 'counter' }
    ]).ok).toBe(false);
  });

  it('consensus.reach matches a closed round decision', () => {
    const after = state({
      rounds: new Map([
        ['tosplit:t1', { current: 0, start: 1, closed: { round: 0, reachedAt: 9, decision: 'approve' as const } }]
      ])
    });
    expect(checkDeltas(state(), after, [
      { kind: 'consensus.reach', subject: 'tosplit:t1', decision: 'approve' }
    ]).ok).toBe(true);
    expect(checkDeltas(state(), after, [
      { kind: 'consensus.reach', subject: 'tosplit:t1', decision: 'reject' }
    ]).ok).toBe(false);
  });

  it('consensus.reach falls back to the tosplit approved flag', () => {
    const view = {
      id: 't1', createdBy: 'A', createdAt: 1, predicate: undefined,
      votes: new Map(), approved: true
    };
    const after = state({ tosplits: new Map([['t1', view]]) });
    expect(checkDeltas(state(), after, [
      { kind: 'consensus.reach', subject: 'tosplit:t1', decision: 'approve' }
    ]).ok).toBe(true);
  });
});

describe('checkDeltas — completeness', () => {
  it('rejects an undeclared balance change', () => {
    const before = withBalances([['A', 100n]]);
    const after = withBalances([['A', 100n], ['B', 50n]], ['A', 'B']);
    const deltas: Delta[] = [{ kind: 'member.add', member: 'B' }];
    const r = checkDeltas(before, after, deltas);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('undeclared_balance_change:B');
  });

  it('rejects an undeclared membership change', () => {
    const before = state({ members: new Set(['A']) });
    const after = state({ members: new Set(['A', 'B']) });
    const r = checkDeltas(before, after, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('undeclared_membership_change:B');
  });

  it('accepts undeclared bookkeeping changes (rounds move freely)', () => {
    const before = state({ rounds: new Map([['tosplit:t1', { current: 0, start: 1 }]]) });
    const after = state({ rounds: new Map([['tosplit:t1', { current: 1, start: 5 }]]) });
    expect(checkDeltas(before, after, []).ok).toBe(true);
  });
});
