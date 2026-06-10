import { describe, it, expect } from 'vitest';
import { project, subjectKey } from './projection';
import type { ConsentEvent } from './event';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: p.device ?? 'd-' + (p.actor ?? 'A'),
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'tosplit', id: 'ts-1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

const tsSubject = { type: 'tosplit', id: 'ts-1' };
const tsKey = subjectKey('tosplit', 'ts-1');

describe('rounds: proposal.counter advances the round', () => {
  it('round 0 opens at tosplit.create', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(0);
    expect(round?.start).toBe(100);
    expect(round?.closed).toBeUndefined();
  });

  it('counter bumps round to 1 and resets start ts', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 200, predicate: { counterTo: 'c1' } })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(1);
    expect(round?.start).toBe(200);
  });

  it('multiple counters keep advancing', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 200 }),
      ev({ id: 'k2', actor: 'C', action: 'proposal.counter', subject: tsSubject,
           parents: ['k1'], ts: 300 })
    ];
    const state = project(events);
    expect(state.rounds.get(tsKey)?.current).toBe(2);
    expect(state.rounds.get(tsKey)?.start).toBe(300);
  });
});

describe('rounds: consensus.timeout closes the current round', () => {
  it('closes round 0 when no counter has landed', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1000,
           predicate: { closingRound: 0, decision: 'approve' } })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.closed?.round).toBe(0);
    expect(round?.closed?.decision).toBe('approve');
    expect(round?.closed?.reachedAt).toBe(1000);
  });

  it('defaults decision to approve (silence = consent)', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1000, predicate: { closingRound: 0 } })
    ];
    const state = project(events);
    expect(state.rounds.get(tsKey)?.closed?.decision).toBe('approve');
  });

  it('stale timeout (round already advanced) is a no-op', () => {
    // Counter advances to round 1, then a stale timeout for round 0 arrives.
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 200 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1000, predicate: { closingRound: 0 } })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(1);
    expect(round?.closed).toBeUndefined();   // stale timeout was ignored
  });

  it('idempotent — duplicate timeout for same round is a no-op', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'to1', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1000, predicate: { closingRound: 0 } }),
      ev({ id: 'to2', actor: 'B', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1100, predicate: { closingRound: 0 } })
    ];
    const state = project(events);
    // The first timeout wins; the second is ignored.
    expect(state.rounds.get(tsKey)?.closed?.reachedAt).toBe(1000);
  });
});

describe('rounds: counter vs timeout race (PLAN_restime §5)', () => {
  it('counter applied LAST clears any prior closed state', () => {
    // Timeout closes round 0 first (by ts), then a counter arrives. Parallel
    // branches → both events have only c1 as parent. The counter must reopen.
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 1000, predicate: { closingRound: 0 } }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 1100 })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(1);
    expect(round?.closed).toBeUndefined();  // counter reopened, no contested decision
    expect(round?.start).toBe(1100);
  });

  it('counter first, then stale timeout → no decision', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 200 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1'], ts: 300, predicate: { closingRound: 0 } })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(1);
    expect(round?.closed).toBeUndefined();
  });

  it('DAG ancestry: when timeout has counter as ancestor, counter wins (topo-sort handles it)', () => {
    // Counter is in the timeout's parents → topoSort places counter first.
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', subject: tsSubject, ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter', subject: tsSubject,
           parents: ['c1'], ts: 200 }),
      ev({ id: 'to', actor: 'A', action: 'consensus.timeout', subject: tsSubject,
           parents: ['c1', 'k1'], ts: 300, predicate: { closingRound: 0 } })
    ];
    const state = project(events);
    const round = state.rounds.get(tsKey);
    expect(round?.current).toBe(1);   // counter took effect first
    expect(round?.closed).toBeUndefined();  // timeout for closingRound:0 is now stale
  });
});

describe('rounds: subject isolation', () => {
  it('different subjects keep independent rounds', () => {
    const subjA = { type: 'tosplit', id: 'A' };
    const subjB = { type: 'tosplit', id: 'B' };
    const events: ConsentEvent[] = [
      ev({ id: 'cA', actor: 'A', action: 'tosplit.create', subject: subjA, ts: 100 }),
      ev({ id: 'cB', actor: 'B', action: 'tosplit.create', subject: subjB, ts: 110 }),
      ev({ id: 'kA', actor: 'C', action: 'proposal.counter', subject: subjA,
           parents: ['cA'], ts: 200 })
    ];
    const state = project(events);
    expect(state.rounds.get(subjectKey('tosplit', 'A'))?.current).toBe(1);
    expect(state.rounds.get(subjectKey('tosplit', 'B'))?.current).toBe(0);
  });
});
