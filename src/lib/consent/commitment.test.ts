import { describe, it, expect } from 'vitest';
import { verifyCommitments, hasCommitments } from './commitment';
import { project } from './projection';
import { computeStateRoot } from './stateRoot';
import type { ConsentEvent, Delta } from './event';
import type { QuorumProof } from './quorum';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: p.device ?? 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'project', id: 'p1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's',
    parentStateRoots: p.parentStateRoots,
    stateRoot: p.stateRoot,
    delta: p.delta,
    quorum: p.quorum
  } as ConsentEvent;
}

function lookup(events: ConsentEvent[]) {
  const byId = new Map(events.map((e) => [e.id, e]));
  return (id: string) => byId.get(id);
}

// Shared base DAG: A and B join p1, then a mission completes.
//   jA ← jB ← mc
const jA = ev({ id: 'jA', actor: 'A', action: 'project.join',
  subject: { type: 'project', id: 'p1' }, ts: 1 });
const jB = ev({ id: 'jB', actor: 'B', action: 'project.join',
  subject: { type: 'project', id: 'p1' }, parents: ['jA'], ts: 2 });
const mc = ev({ id: 'mc', actor: 'B', action: 'mission.complete',
  subject: { type: 'mission', id: 'm1' },
  predicate: { hours: 4.5, selfRate: 80 }, parents: ['jB'], ts: 3 });
const BASE = [jA, jB, mc];

describe('hasCommitments', () => {
  it('is false for a bare Phase-0 event', () => {
    expect(hasCommitments(jA)).toBe(false);
  });
  it('is true when any commitment field is set, and for snapshot.commit', () => {
    expect(hasCommitments(ev({ id: 'x', action: 'tosplit.vote', stateRoot: 'r' }))).toBe(true);
    expect(hasCommitments(ev({ id: 'x', action: 'snapshot.commit' }))).toBe(true);
  });
});

describe('verifyCommitments — state roots', () => {
  it('passes a Phase-0 event untouched', async () => {
    const r = await verifyCommitments(mc, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r).toEqual({ ok: true, checked: [], warnings: [] });
  });

  it('accepts a correct stateRoot and parentStateRoots', async () => {
    const parentRoot = await computeStateRoot(project(BASE, 'p1'));
    const approve = ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
      parents: ['mc'], ts: 4,
      parentStateRoots: [parentRoot],
      stateRoot: await computeStateRoot(project([...BASE,
        ev({ id: 'ap', actor: 'A', action: 'mission.approve',
          subject: { type: 'mission', id: 'm1' },
          predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
          parents: ['mc'], ts: 4 })], 'p1'))
    });
    const r = await verifyCommitments(approve, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.checked).toContain('parentStateRoots');
      expect(r.checked).toContain('stateRoot');
    }
  });

  it('rejects a false stateRoot like a bad signature', async () => {
    const approve = ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
      parents: ['mc'], ts: 4,
      stateRoot: 'not-the-real-root'
    });
    const r = await verifyCommitments(approve, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r).toEqual({ ok: false, reason: 'state_root_mismatch' });
  });

  it('rejects a false parentStateRoot', async () => {
    const approve = ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      parents: ['mc'], ts: 4,
      parentStateRoots: ['wrong-root']
    });
    const r = await verifyCommitments(approve, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('parent_root_mismatch');
  });

  it('missing ancestors: warning in available mode, rejection in strict', async () => {
    const orphan = ev({
      id: 'o1', actor: 'A', action: 'tosplit.vote',
      parents: ['never-seen'], ts: 9, stateRoot: 'whatever'
    });
    const available = await verifyCommitments(orphan, { getEvent: lookup([]) });
    expect(available.ok).toBe(true);
    if (available.ok) expect(available.warnings).toEqual(['missing_ancestor:never-seen']);

    const strict = await verifyCommitments(orphan, { getEvent: lookup([]), mode: 'strict' });
    expect(strict).toEqual({ ok: false, reason: 'missing_ancestor:never-seen' });
  });
});

describe('verifyCommitments — deltas', () => {
  async function approveWithDelta(delta: Delta[]) {
    return ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
      parents: ['mc'], ts: 4, delta
    });
  }

  it('accepts a truthful delta declaration', async () => {
    const approve = await approveWithDelta([
      { kind: 'hervachti.add', member: 'B', amount: '36000', code: 'ILS' },
      { kind: 'share.bump', member: 'B', oldBps: 0, newBps: 10000 }
    ]);
    const r = await verifyCommitments(approve, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.checked).toContain('delta');
  });

  it('rejects a delta that inflates the credit', async () => {
    const approve = await approveWithDelta([
      { kind: 'hervachti.add', member: 'B', amount: '99000', code: 'ILS' }
    ]);
    const r = await verifyCommitments(approve, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('delta:hervachti.add');
  });
});

describe('verifyCommitments — quorum', () => {
  const vA = ev({ id: 'vA', actor: 'A', action: 'mission.approve.vote',
    subject: { type: 'mission', id: 'm1' }, predicate: { what: true },
    parents: ['mc'], ts: 4 });
  const vB = ev({ id: 'vB', actor: 'B', action: 'mission.approve.vote',
    subject: { type: 'mission', id: 'm1' }, predicate: { what: true },
    parents: ['mc'], ts: 5 });
  const WITH_VOTES = [...BASE, vA, vB];

  function approve(quorum?: QuorumProof) {
    return ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
      parents: ['vA', 'vB'], ts: 6, quorum
    });
  }

  it('verifies a satisfied k-of-n proof', async () => {
    const r = await verifyCommitments(
      approve({ rule: { kind: 'k-of-n', k: 2 }, evidence: ['vA', 'vB'], reachingActor: 'B' }),
      { getEvent: lookup(WITH_VOTES), projectId: 'p1' }
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.checked).toContain('quorum');
  });

  it('rejects an unsatisfied proof', async () => {
    const r = await verifyCommitments(
      approve({ rule: { kind: 'k-of-n', k: 3 }, evidence: ['vA', 'vB'] }),
      { getEvent: lookup(WITH_VOTES), projectId: 'p1' }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('below_k');
  });

  it('required-but-absent quorum: warning in available, rejection in strict', async () => {
    // stateRoot present so the event enters verification at all.
    const bare = ev({
      id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'm1' },
      predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
      parents: ['mc'], ts: 4,
      stateRoot: await computeStateRoot(project([...BASE,
        ev({ id: 'ap', actor: 'A', action: 'mission.approve',
          subject: { type: 'mission', id: 'm1' },
          predicate: { payee: 'B', amount: { amount: '36000', code: 'ILS' } },
          parents: ['mc'], ts: 4 })], 'p1'))
    });
    const available = await verifyCommitments(bare, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(available.ok).toBe(true);
    if (available.ok) {
      expect(available.warnings).toContain('quorum_required_but_absent:mission.approve');
    }

    const strict = await verifyCommitments(bare, {
      getEvent: lookup(BASE), projectId: 'p1', mode: 'strict'
    });
    expect(strict).toEqual({ ok: false, reason: 'quorum_required:mission.approve' });
  });

  it('weighted rule without weights: unverified warning, strict rejection', async () => {
    const proof: QuorumProof = {
      rule: { kind: 'weighted-unanimous-positive' }, evidence: ['vA', 'vB']
    };
    const available = await verifyCommitments(approve(proof), {
      getEvent: lookup(WITH_VOTES), projectId: 'p1'
    });
    expect(available.ok).toBe(true);
    if (available.ok) expect(available.warnings).toContain('quorum_unverified:missing_weights');

    const strict = await verifyCommitments(approve(proof), {
      getEvent: lookup(WITH_VOTES), projectId: 'p1', mode: 'strict'
    });
    expect(strict).toEqual({ ok: false, reason: 'missing_weights' });
  });

  it('weighted rule WITH weights verifies', async () => {
    const proof: QuorumProof = {
      rule: { kind: 'weighted-unanimous-positive' }, evidence: ['vA', 'vB']
    };
    const r = await verifyCommitments(approve(proof), {
      getEvent: lookup(WITH_VOTES), projectId: 'p1',
      memberWeights: new Map([['A', 100n], ['B', 200n]])
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.checked).toContain('quorum');
  });

  it('leaving on your own accord is sovereign — no quorum demanded', async () => {
    const leave = ev({
      id: 'lv', actor: 'B', action: 'project.leave',
      subject: { type: 'project', id: 'p1' }, parents: ['jB'], ts: 9,
      stateRoot: await computeStateRoot(project([jA, jB,
        ev({ id: 'lv', actor: 'B', action: 'project.leave',
          subject: { type: 'project', id: 'p1' }, parents: ['jB'], ts: 9 })], 'p1'))
    });
    const r = await verifyCommitments(leave, {
      getEvent: lookup([jA, jB]), projectId: 'p1', mode: 'strict'
    });
    expect(r.ok).toBe(true);
  });
});

describe('verifyCommitments — snapshot.commit (§5.1)', () => {
  it('accepts a snapshot whose attested root recomputes', async () => {
    const attested = await computeStateRoot(project(BASE, 'p1'));
    const snap = ev({
      id: 'sn', actor: 'A', action: 'snapshot.commit',
      subject: { type: 'project', id: 'p1' },
      predicate: { upTo: 'mc', stateRoot: attested },
      parents: ['mc'], ts: 10
    });
    const r = await verifyCommitments(snap, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.checked).toContain('snapshotRoot');
  });

  it('rejects a snapshot attesting a false root', async () => {
    const snap = ev({
      id: 'sn', actor: 'A', action: 'snapshot.commit',
      subject: { type: 'project', id: 'p1' },
      predicate: { upTo: 'mc', stateRoot: 'forged-root' },
      parents: ['mc'], ts: 10
    });
    const r = await verifyCommitments(snap, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r).toEqual({ ok: false, reason: 'snapshot_root_mismatch' });
  });

  it('rejects a snapshot whose upTo is not an ancestor', async () => {
    const snap = ev({
      id: 'sn', actor: 'A', action: 'snapshot.commit',
      subject: { type: 'project', id: 'p1' },
      predicate: { upTo: 'unrelated', stateRoot: 'r' },
      parents: ['jA'], ts: 10
    });
    const r = await verifyCommitments(snap, { getEvent: lookup(BASE), projectId: 'p1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('snapshot_upTo_not_ancestor');
  });
});
