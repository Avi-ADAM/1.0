// T6 — genesis snapshot: pure layer + reducer merge semantics.
// The tests here are the acceptance criteria of HANDOFF_DISTRIBUTED_DB T6:
// export → signed parentless snapshot.commit → deterministic apply → members
// vote → maturity. Everything runs in memory (no IDB), like the rest of the
// consent suite.

import { describe, it, expect } from 'vitest';
import {
  GENESIS_UP_TO,
  buildGenesisState,
  buildGenesisPredicate,
  verifyGenesisPredicate,
  diffGenesisAgainstExport
} from './genesis';
import { project } from './projection';
import type { ConsentEvent } from './event';
import { canonicalBytesOfState } from './stateRoot';
import { isSnapshotMatured } from '$lib/space/compaction';
import type { SnapshotPredicate } from '$lib/space/compaction';

function ev(
  partial: Partial<ConsentEvent> & { id: string; action: string; parents?: string[] }
): ConsentEvent {
  return {
    v: 1,
    id: partial.id,
    actor: partial.actor ?? 'u1',
    device: partial.device ?? 'dev-1',
    action: partial.action as ConsentEvent['action'],
    subject: partial.subject ?? { type: 'project', id: 'p54' },
    predicate: partial.predicate,
    parents: partial.parents ?? [],
    ts: partial.ts ?? 0,
    nonce: partial.nonce ?? 'n',
    sig: partial.sig ?? 's'
  };
}

const EXPORT = [
  { id: 'u1', hervachti: 120.5 },
  { id: 'u2', hervachti: 0 },
  { id: 'u3', hervachti: null }
];

async function genesisEvent(id = 'g1', ts = 10): Promise<ConsentEvent> {
  const state = buildGenesisState('p54', EXPORT);
  const predicate = await buildGenesisPredicate(state);
  return ev({
    id,
    ts,
    action: 'snapshot.commit',
    subject: { type: 'project', id: 'p54' },
    predicate: predicate as unknown as Record<string, unknown>,
    parents: []
  });
}

describe('buildGenesisState — Strapi export → opening state', () => {
  it('imports members and converts hervachti shekels → bigint agorot', () => {
    const s = buildGenesisState('p54', EXPORT);
    expect([...s.members].sort()).toEqual(['u1', 'u2', 'u3']);
    expect(s.balances.get('u1')).toBe(12050n);
    expect(s.balances.get('u2')).toBe(0n);
    expect(s.balances.has('u3')).toBe(false); // null hervachti → no row
    expect(s.projectId).toBe('p54');
  });
});

describe('genesis predicate — integrity', () => {
  it('round-trips: build → verify ok, restored state matches', async () => {
    const state = buildGenesisState('p54', EXPORT);
    const predicate = await buildGenesisPredicate(state);
    expect(predicate.upTo).toBe(GENESIS_UP_TO);
    expect(predicate.heads).toEqual([]);
    const check = await verifyGenesisPredicate(predicate);
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(canonicalBytesOfState(check.state)).toEqual(canonicalBytesOfState(state));
    }
  });

  it('rejects a tampered inline state (root mismatch)', async () => {
    const predicate = await buildGenesisPredicate(buildGenesisState('p54', EXPORT));
    const tampered: SnapshotPredicate = {
      ...predicate,
      state: JSON.parse(JSON.stringify(
        (await buildGenesisPredicate(buildGenesisState('p54', [{ id: 'u1', hervachti: 999 }]))).state
      ))
    };
    const check = await verifyGenesisPredicate(tampered);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe('inline_state_does_not_match_root');
  });

  it('rejects a non-genesis snapshot (covered heads present)', async () => {
    const predicate = await buildGenesisPredicate(buildGenesisState('p54', EXPORT));
    const check = await verifyGenesisPredicate({ ...predicate, upTo: 'ev-x', heads: ['ev-x'] });
    expect(check.ok).toBe(false);
  });
});

describe('snapshotCommit reducer — genesis apply + merge', () => {
  it('a lone genesis populates members, balances and the mark', async () => {
    const g = await genesisEvent();
    const s = project([g], 'p54');
    expect(s.members.size).toBe(3);
    expect(s.balances.get('u1')).toBe(12050n);
    expect(s.snapshots).toHaveLength(1);
    expect(s.snapshots[0].upTo).toBe(GENESIS_UP_TO);
  });

  it('genesis REPLACES balances for imported members (Strapi already includes pre-genesis effects)', async () => {
    // Two pre-genesis credits: one to an imported member (u1), one to a
    // chain-only member (u9, not in the Strapi export).
    const creditImported = ev({
      id: 'ap1', ts: 5, actor: 'u2', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'u1', amount: { amount: '7777', code: 'ILS' } }
    });
    const creditChainOnly = ev({
      id: 'ap1b', ts: 6, actor: 'u2', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1b' },
      predicate: { payee: 'u9', amount: { amount: '333', code: 'ILS' } }
    });
    const g = await genesisEvent('g1', 10);
    const s = project([creditImported, creditChainOnly, g], 'p54');
    // u1's pre-genesis credit is superseded by the imported opening balance…
    expect(s.balances.get('u1')).toBe(12050n);
    // …while the chain-only member u9 keeps both membership and balance (union).
    expect(s.members.has('u9')).toBe(true);
    expect(s.balances.get('u9')).toBe(333n);
  });

  it('post-genesis events apply ON TOP of the imported balance', async () => {
    const g = await genesisEvent('g1', 10);
    const credit = ev({
      id: 'ap2', ts: 20, actor: 'u2', action: 'mission.approve',
      subject: { type: 'mission', id: 'm2' },
      predicate: { payee: 'u1', amount: { amount: '1000', code: 'ILS' } },
      parents: ['g1']
    });
    const s = project([g, credit], 'p54');
    expect(s.balances.get('u1')).toBe(13050n);
  });

  it('is order-independent: both arrival orders converge to identical canonical bytes', async () => {
    const g = await genesisEvent('g1', 10);
    const join = ev({
      id: 'j1', ts: 3, actor: 'u7', action: 'project.join',
      subject: { type: 'project', id: 'p54' }
    });
    const credit = ev({
      id: 'ap3', ts: 20, actor: 'u2', action: 'mission.approve',
      subject: { type: 'mission', id: 'm3' },
      predicate: { payee: 'u2', amount: { amount: '500', code: 'ILS' } },
      parents: ['g1']
    });
    const a = project([g, join, credit], 'p54');
    const b = project([credit, join, g], 'p54');
    expect(canonicalBytesOfState(a)).toEqual(canonicalBytesOfState(b));
    expect(a.members.has('u7')).toBe(true); // union kept the signed join
  });

  it('only the FIRST genesis (topo order) applies; a second only records its mark', async () => {
    const g1 = await genesisEvent('g1', 10);
    // A rival genesis by a DIFFERENT actor (same-actor rivals collapse via
    // dedupeKey to latest-ts — also deterministic, but a different rule),
    // with different balances, later in (ts, id) order.
    const rivalState = buildGenesisState('p54', [{ id: 'u1', hervachti: 999 }]);
    const rivalPred = await buildGenesisPredicate(rivalState);
    const g2 = ev({
      id: 'g2', ts: 11, actor: 'u2', action: 'snapshot.commit',
      subject: { type: 'project', id: 'p54' },
      predicate: rivalPred as unknown as Record<string, unknown>,
      parents: []
    });
    const a = project([g1, g2], 'p54');
    const b = project([g2, g1], 'p54');
    expect(a.balances.get('u1')).toBe(12050n); // g1 won in both orders
    expect(canonicalBytesOfState(a)).toEqual(canonicalBytesOfState(b));
    expect(a.snapshots).toHaveLength(2); // both attestations recorded
  });
});

describe('genesis maturity — snapshot.vote unanimity over imported members', () => {
  async function withVotes(voters: string[]) {
    const g = await genesisEvent('g1', 10);
    const votes = voters.map((u, i) =>
      ev({
        id: `v-${u}`, ts: 20 + i, actor: u, action: 'snapshot.vote',
        subject: { type: 'snapshot', id: 'g1' },
        predicate: { what: true, order: 0 },
        parents: ['g1']
      })
    );
    return project([g, ...votes], 'p54');
  }

  it('matures when every imported member signed', async () => {
    const s = await withVotes(['u1', 'u2', 'u3']);
    expect(isSnapshotMatured(s, 'g1')).toBe(true);
  });

  it('does not mature on partial signatures', async () => {
    const s = await withVotes(['u1', 'u2']);
    expect(isSnapshotMatured(s, 'g1')).toBe(false);
  });
});
