import { describe, it, expect } from 'vitest';
import { verifyQuorum, type QuorumContext } from './quorum';
import type { ConsentEvent } from './event';

function ev(partial: Partial<ConsentEvent> & { id: string; actor: string; what?: boolean }): ConsentEvent {
  return {
    v: 1,
    id: partial.id,
    actor: partial.actor,
    device: partial.device ?? 'dev-' + partial.actor,
    action: partial.action ?? 'tosplit.vote',
    subject: partial.subject ?? { type: 'tosplit', id: 'ts-1' },
    predicate: partial.predicate ?? { what: partial.what !== false },
    parents: partial.parents ?? [],
    ts: partial.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

function ctxFor(events: ConsentEvent[], members: string[]): QuorumContext {
  const map = new Map<string, ConsentEvent>();
  for (const e of events) map.set(e.id, e);
  return {
    eligibleMembers: new Set(members),
    events: map,
    voteAction: 'tosplit.vote'
  };
}

describe('verifyQuorum: unanimous', () => {
  it('passes when every eligible member voted yes', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 }),
      ev({ id: 'v3', actor: 'C', ts: 3 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'unanimous' }, evidence: ['v1', 'v2', 'v3'], reachingActor: 'C' },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.agreers.sort()).toEqual(['A', 'B', 'C']);
      expect(res.reachingActor).toBe('C');
    }
  });

  it('fails when one member did not vote', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'unanimous' }, evidence: ['v1', 'v2'] },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(false);
  });

  it('fails when one member voted no', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 }),
      ev({ id: 'v3', actor: 'C', what: false, ts: 3 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'unanimous' }, evidence: ['v1', 'v2', 'v3'] },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('has_no_vote');
  });

  it('honors revote — last-by-ts wins', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', what: false, ts: 1 }),
      ev({ id: 'v2', actor: 'A', what: true,  ts: 5 }),  // A flipped to yes
      ev({ id: 'v3', actor: 'B', what: true,  ts: 2 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'unanimous' }, evidence: ['v1', 'v2', 'v3'] },
      ctxFor(evs, ['A', 'B'])
    );
    expect(res.ok).toBe(true);
  });
});

describe('verifyQuorum: majority', () => {
  it('passes at threshold = floor(n/2)+1', () => {
    // 3 members, need 2 yeses
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'majority' }, evidence: ['v1', 'v2'] },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(true);
  });

  it('fails below threshold', () => {
    const evs = [ev({ id: 'v1', actor: 'A', ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'majority' }, evidence: ['v1'] },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(false);
  });
});

describe('verifyQuorum: k-of-n', () => {
  it('passes when k yes votes present', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 }),
      ev({ id: 'v3', actor: 'C', ts: 3 })
    ];
    const res = verifyQuorum(
      { rule: { kind: 'k-of-n', k: 2 }, evidence: ['v1', 'v2', 'v3'] },
      ctxFor(evs, ['A', 'B', 'C', 'D'])
    );
    expect(res.ok).toBe(true);
  });

  it('fails when only k-1 yes votes', () => {
    const evs = [ev({ id: 'v1', actor: 'A', ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'k-of-n', k: 2 }, evidence: ['v1'] },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(false);
  });
});

describe('verifyQuorum: agreers-only', () => {
  it('passes with at least one yes', () => {
    const evs = [ev({ id: 'v1', actor: 'A', ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'agreers-only' }, evidence: ['v1'] },
      ctxFor(evs, ['A', 'B'])
    );
    expect(res.ok).toBe(true);
  });

  it('fails with no yes votes', () => {
    const evs = [ev({ id: 'v1', actor: 'A', what: false, ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'agreers-only' }, evidence: ['v1'] },
      ctxFor(evs, ['A'])
    );
    expect(res.ok).toBe(false);
  });
});

describe('verifyQuorum: timeout', () => {
  it('passes when attested time is past expectedEnd within tolerance', () => {
    const evs = [
      ev({ id: 'v1', actor: 'A', ts: 1 }),
      ev({ id: 'v2', actor: 'B', ts: 2 })
    ];
    const res = verifyQuorum(
      {
        rule: { kind: 'timeout', expectedEnd: 1000, clockTolerance: 60 },
        evidence: ['v1', 'v2'],
        attestedTs: 1100
      },
      ctxFor(evs, ['A', 'B', 'C'])
    );
    expect(res.ok).toBe(true);
  });

  it('fails when attested time is before expectedEnd minus tolerance', () => {
    const res = verifyQuorum(
      {
        rule: { kind: 'timeout', expectedEnd: 1000, clockTolerance: 60 },
        evidence: [],
        attestedTs: 800
      },
      ctxFor([], ['A'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('timeout_too_early');
  });

  it('fails when attestedTs missing', () => {
    const res = verifyQuorum(
      { rule: { kind: 'timeout', expectedEnd: 1000, clockTolerance: 60 }, evidence: [] },
      ctxFor([], ['A'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('timeout_needs_attestedTs');
  });
});

describe('verifyQuorum: error paths', () => {
  it('reports missing evidence', () => {
    const res = verifyQuorum(
      { rule: { kind: 'majority' }, evidence: ['v-missing'] },
      ctxFor([], ['A', 'B'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('missing_evidence');
  });

  it('rejects votes by ineligible actors', () => {
    const evs = [ev({ id: 'v1', actor: 'X', ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'majority' }, evidence: ['v1'] },
      ctxFor(evs, ['A', 'B'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('ineligible_voter');
  });
});
