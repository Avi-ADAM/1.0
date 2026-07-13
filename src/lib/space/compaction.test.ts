// T10 acceptance (HANDOFF / PLAN_T10_COMPACTION): a fresh replica converges
// to an IDENTICAL stateRoot via both paths — full history vs snapshot+tail —
// plus maturity (vote / silence) and prunable-set semantics.

import { describe, it, expect } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import { project, projectFrom, emptyState } from '$lib/consent/projection';
import { canonicalBytesOfState } from '$lib/consent/stateRoot';
import { restoreState } from '$lib/consent/stateRestore';
import { richLog } from '$lib/consent/stateRestore.test';
import {
  buildSnapshotPredicate,
  verifySnapshotAgainstLocal,
  isSnapshotMatured,
  computePrunableIds
} from './compaction';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'project', id: 'p1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

/** The tail that continues AFTER the snapshot event `snapId`. */
function tailAfter(snapId: string): ConsentEvent[] {
  return [
    ev({ id: 'jC', actor: 'C', action: 'project.join', parents: [snapId], ts: 101 }),
    ev({ id: 'm2', actor: 'C', action: 'mission.create',
      subject: { type: 'mission', id: 'M2' },
      predicate: { name: 'later', branch: 'self' }, parents: ['jC'], ts: 102 }),
    ev({ id: 'ap2', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'M2' },
      predicate: { payee: 'C', amount: { amount: '90', code: 'ILS' } },
      parents: ['m2'], ts: 103 })
  ];
}

async function makeSnapshotEvent(history: ConsentEvent[]) {
  const predicate = await buildSnapshotPredicate(history, 'p1');
  const snap = ev({
    id: 'SNAP1', actor: 'A', action: 'snapshot.commit',
    subject: { type: 'project', id: 'p1' },
    predicate: predicate as unknown as Record<string, unknown>,
    parents: predicate.heads,
    ts: 100
  });
  return { predicate, snap };
}

describe('T10 acceptance — full history ≡ snapshot + tail', () => {
  it('both paths converge to byte-identical committed state', async () => {
    const history = richLog();
    const { predicate, snap } = await makeSnapshotEvent(history);
    const tail = tailAfter(snap.id);

    // Path 1 — a replica with everything.
    const full = project([...history, snap, ...tail], 'p1');

    // Path 2 — a fresh replica: restored base + snapshot event + tail only.
    const restored = restoreState(predicate.state);
    expect(restored.ok).toBe(true);
    const compacted = projectFrom(restored.state!, [snap, ...tail]);

    expect(Array.from(canonicalBytesOfState(compacted)))
      .toEqual(Array.from(canonicalBytesOfState(full)));
  });

  it('the tail alone on an EMPTY base does NOT converge (the base matters)', async () => {
    const history = richLog();
    const { snap } = await makeSnapshotEvent(history);
    const tail = tailAfter(snap.id);
    const full = project([...history, snap, ...tail], 'p1');
    const baseless = projectFrom(emptyState('p1'), [snap, ...tail]);
    expect(Array.from(canonicalBytesOfState(baseless)))
      .not.toEqual(Array.from(canonicalBytesOfState(full)));
  });

  it('projectFrom never mutates the caller-supplied base', async () => {
    const history = richLog();
    const { predicate, snap } = await makeSnapshotEvent(history);
    const restored = restoreState(predicate.state);
    const before = Array.from(canonicalBytesOfState(restored.state!));
    projectFrom(restored.state!, [snap, ...tailAfter(snap.id)]);
    expect(Array.from(canonicalBytesOfState(restored.state!))).toEqual(before);
  });
});

describe('verifySnapshotAgainstLocal — the pre-vote check', () => {
  it('an honest snapshot verifies against the local replay', async () => {
    const history = richLog();
    const { predicate } = await makeSnapshotEvent(history);
    const res = await verifySnapshotAgainstLocal(predicate, history, 'p1');
    expect(res.ok).toBe(true);
  });

  it('a lying stateRoot is caught', async () => {
    const history = richLog();
    const { predicate } = await makeSnapshotEvent(history);
    const res = await verifySnapshotAgainstLocal(
      { ...predicate, stateRoot: 'X'.repeat(43) }, history, 'p1'
    );
    expect(res.ok).toBe(false);
  });

  it('a tampered inline state is caught even when the root matches local replay', async () => {
    const history = richLog();
    const { predicate } = await makeSnapshotEvent(history);
    const tampered = JSON.parse(JSON.stringify(predicate.state)) as { asOf: number };
    tampered.asOf = tampered.asOf + 1;
    const res = await verifySnapshotAgainstLocal(
      { ...predicate, state: tampered }, history, 'p1'
    );
    expect(res).toMatchObject({ ok: false, reason: 'inline_state_does_not_match_root' });
  });

  it('a snapshot whose heads we do not hold is refused (cannot judge)', async () => {
    const history = richLog();
    const { predicate } = await makeSnapshotEvent(history);
    const res = await verifySnapshotAgainstLocal(
      { ...predicate, heads: ['nonexistent'] }, history, 'p1'
    );
    expect(res.ok).toBe(false);
  });
});

describe('isSnapshotMatured — vote and silence paths, any arrival order', () => {
  const votes = (snapId: string) => [
    ev({ id: 'sv1', actor: 'A', action: 'snapshot.vote',
      subject: { type: 'snapshot', id: snapId }, predicate: { what: true, order: 0 }, ts: 110 }),
    ev({ id: 'sv2', actor: 'B', action: 'snapshot.vote',
      subject: { type: 'snapshot', id: snapId }, predicate: { what: true, order: 0 }, ts: 111 })
  ];

  it('unanimous snapshot.vote matures; a missing vote does not', async () => {
    const history = richLog();
    const { snap } = await makeSnapshotEvent(history);
    const [v1, v2] = votes(snap.id);

    const partial = project([...history, snap, v1], 'p1');
    expect(isSnapshotMatured(partial, snap.id)).toBe(false);

    const full = project([...history, snap, v1, v2], 'p1');
    expect(isSnapshotMatured(full, snap.id)).toBe(true);
  });

  it('silence matures via consensus.timeout; arrival order does not matter', async () => {
    const history = richLog();
    const { snap } = await makeSnapshotEvent(history);
    const timeout = ev({ id: 'to1', actor: 'A', action: 'consensus.timeout',
      subject: { type: 'snapshot', id: snap.id },
      predicate: { closingRound: 0, decision: 'approve' }, parents: [snap.id], ts: 200 });
    // consensus.timeout only closes a round that exists — a proposal.counter
    // (or prior round activity) opens it; here the proposer's own vote does.
    const v1 = votes(snap.id)[0];
    const counter = ev({ id: 'cn2', actor: 'B', action: 'proposal.counter',
      subject: { type: 'snapshot', id: snap.id }, predicate: { order: 1 }, parents: [snap.id], ts: 150 });
    const timeout2 = ev({ id: 'to2', actor: 'A', action: 'consensus.timeout',
      subject: { type: 'snapshot', id: snap.id },
      predicate: { closingRound: 1, decision: 'approve' }, parents: ['cn2'], ts: 300 });

    const events = [...history, snap, v1, counter, timeout, timeout2];
    const s1 = project(events, 'p1');
    const s2 = project([...events].reverse(), 'p1');
    expect(isSnapshotMatured(s1, snap.id)).toBe(true);
    expect(isSnapshotMatured(s2, snap.id)).toBe(true);
  });
});

describe('computePrunableIds', () => {
  it('prunes exactly the covered history — never the snapshot or its tail', async () => {
    const history = richLog();
    const { snap } = await makeSnapshotEvent(history);
    const tail = tailAfter(snap.id);
    const all = [...history, snap, ...tail];

    const prunable = computePrunableIds(all, snap);
    expect(prunable.size).toBe(history.length);
    for (const e of history) expect(prunable.has(e.id)).toBe(true);
    expect(prunable.has(snap.id)).toBe(false);
    for (const e of tail) expect(prunable.has(e.id)).toBe(false);
  });

  it('after pruning, the remaining set still converges (end-to-end sanity)', async () => {
    const history = richLog();
    const { predicate, snap } = await makeSnapshotEvent(history);
    const tail = tailAfter(snap.id);
    const all = [...history, snap, ...tail];

    const prunable = computePrunableIds(all, snap);
    const remaining = all.filter((e) => !prunable.has(e.id));
    const restored = restoreState(predicate.state);
    const compacted = projectFrom(restored.state!, remaining);
    const full = project(all, 'p1');
    expect(Array.from(canonicalBytesOfState(compacted)))
      .toEqual(Array.from(canonicalBytesOfState(full)));
  });
});
