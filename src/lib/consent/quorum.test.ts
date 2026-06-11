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

describe('verifyQuorum: weighted-unanimous-positive (the user\'s central rikma case)', () => {
  it('passes when both contributors vote yes; 8 zero-weight members ignored', () => {
    const evs = [
      ev({ id: 'v1', actor: 'avi',  ts: 1 }),
      ev({ id: 'v2', actor: 'dana', ts: 2 })
    ];
    const members = ['avi', 'dana', ...Array.from({ length: 8 }, (_, i) => `pending-${i}`)];
    const weights = new Map<string, bigint>([
      ['avi', 60000n],
      ['dana', 40000n]
      // 8 pending members: weight 0 (committed but not delivered)
    ]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-unanimous-positive' }, evidence: ['v1', 'v2'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.agreers.sort()).toEqual(['avi', 'dana']);
  });

  it('blocks when one contributor votes no', () => {
    const evs = [
      ev({ id: 'v1', actor: 'avi',  ts: 1 }),
      ev({ id: 'v2', actor: 'dana', what: false, ts: 2 })
    ];
    const members = ['avi', 'dana', 'pending'];
    const weights = new Map<string, bigint>([['avi', 60000n], ['dana', 40000n]]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-unanimous-positive' }, evidence: ['v1', 'v2'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('positive_no_vote:dana');
  });

  it('zero-weight member CANNOT block via no vote', () => {
    // Critical case: a "committed but not delivered" user shouldn't be able
    // to vote no and block the decision.
    const evs = [
      ev({ id: 'v1', actor: 'avi',  ts: 1 }),
      ev({ id: 'v2', actor: 'dana', ts: 2 }),
      ev({ id: 'v3', actor: 'pending', what: false, ts: 3 })  // tries to block
    ];
    const members = ['avi', 'dana', 'pending'];
    const weights = new Map<string, bigint>([['avi', 60000n], ['dana', 40000n]]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-unanimous-positive' }, evidence: ['v1', 'v2', 'v3'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(true);
  });

  it('blocks when a positive-weight contributor did not vote at all', () => {
    const evs = [ev({ id: 'v1', actor: 'avi', ts: 1 })];
    const members = ['avi', 'dana'];
    const weights = new Map<string, bigint>([['avi', 60000n], ['dana', 40000n]]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-unanimous-positive' }, evidence: ['v1'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('positive_missing_vote:dana');
  });

  it('rejects when memberWeights is missing', () => {
    const evs = [ev({ id: 'v1', actor: 'avi', ts: 1 })];
    const res = verifyQuorum(
      { rule: { kind: 'weighted-unanimous-positive' }, evidence: ['v1'] },
      ctxFor(evs, ['avi'])
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('missing_weights');
  });
});

describe('verifyQuorum: weighted-threshold', () => {
  it('passes when yes weight ≥ 2/3 of total (6667 bps)', () => {
    const evs = [
      ev({ id: 'v1', actor: 'avi', ts: 1 }),   // weight 70%
      // dana doesn't vote                        weight 30%
    ];
    const members = ['avi', 'dana'];
    const weights = new Map<string, bigint>([['avi', 7000n], ['dana', 3000n]]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-threshold', thresholdBps: 6667 }, evidence: ['v1'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(true);
  });

  it('fails below 2/3 threshold', () => {
    const evs = [ev({ id: 'v1', actor: 'avi', ts: 1 })];  // weight 60%
    const members = ['avi', 'dana'];
    const weights = new Map<string, bigint>([['avi', 6000n], ['dana', 4000n]]);
    const res = verifyQuorum(
      { rule: { kind: 'weighted-threshold', thresholdBps: 6667 }, evidence: ['v1'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(res.ok).toBe(false);
  });

  it('uses integer math — no float drift at boundary', () => {
    // Threshold exactly: 2/3 of 30000 = 20000. Yes weight = 20000. Should pass.
    const evs = [ev({ id: 'v1', actor: 'avi', ts: 1 })];
    const members = ['avi', 'dana', 'eden'];
    const weights = new Map<string, bigint>([
      ['avi', 20000n], ['dana', 5000n], ['eden', 5000n]
    ]);
    // 20000 * 10000 = 200000000; 6667 * 30000 = 200010000 → just below; should fail
    const fail = verifyQuorum(
      { rule: { kind: 'weighted-threshold', thresholdBps: 6667 }, evidence: ['v1'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(fail.ok).toBe(false);

    // Drop threshold to exact 2/3 = 6666.666... → 6666 should pass
    const pass = verifyQuorum(
      { rule: { kind: 'weighted-threshold', thresholdBps: 6666 }, evidence: ['v1'] },
      { ...ctxFor(evs, members), memberWeights: weights }
    );
    expect(pass.ok).toBe(true);
  });

  it('zero total weight → reject (no one has delivered yet)', () => {
    const members = ['committed-1', 'committed-2'];
    const weights = new Map<string, bigint>();  // all zero
    const res = verifyQuorum(
      { rule: { kind: 'weighted-threshold', thresholdBps: 5001 }, evidence: [] },
      { ...ctxFor([], members), memberWeights: weights }
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('zero_total_weight');
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
