import { describe, it, expect } from 'vitest';
import { project } from '../projection';
import { computeStateRoot } from '../stateRoot';
import type { ConsentEvent } from '../event';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'mission', id: 'm1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

describe('mission.approve reducer', () => {
  it('credits the payee in agorot and makes them a member (§6 example)', () => {
    // "yuri completed 4.5h × ₪80 = ₪360" → 36000 agorot.
    const state = project([
      ev({ id: 'j1', actor: 'avi', action: 'project.join',
        subject: { type: 'project', id: 'p1' }, ts: 1 }),
      ev({ id: 'ap', actor: 'avi', action: 'mission.approve',
        predicate: { payee: 'yuri', amount: { amount: '36000', code: 'ILS' } },
        parents: ['j1'], ts: 2 })
    ], 'p1');
    expect(state.balances.get('yuri')).toBe(36000n);
    expect(state.members.has('yuri')).toBe(true);
  });

  it('accumulates over multiple approvals on different missions', () => {
    const state = project([
      ev({ id: 'a1', actor: 'avi', action: 'mission.approve',
        subject: { type: 'mission', id: 'm1' },
        predicate: { payee: 'yuri', amount: { amount: '100', code: 'ILS' } }, ts: 1 }),
      ev({ id: 'a2', actor: 'avi', action: 'mission.approve',
        subject: { type: 'mission', id: 'm2' },
        predicate: { payee: 'yuri', amount: { amount: '250', code: 'ILS' } },
        parents: ['a1'], ts: 2 })
    ]);
    expect(state.balances.get('yuri')).toBe(350n);
  });

  it('defaults the payee to the actor and tolerates a missing amount', () => {
    const state = project([
      ev({ id: 'a1', actor: 'yuri', action: 'mission.approve', ts: 1 })
    ]);
    expect(state.members.has('yuri')).toBe(true);
    expect(state.balances.size).toBe(0);
  });

  it('balances participate in the state root', async () => {
    const without = project([]);
    const withCredit = project([
      ev({ id: 'a1', actor: 'avi', action: 'mission.approve',
        predicate: { payee: 'yuri', amount: { amount: '36000', code: 'ILS' } }, ts: 1 })
    ]);
    expect(await computeStateRoot(without)).not.toBe(await computeStateRoot(withCredit));
  });
});

describe('snapshot.commit reducer', () => {
  it('records a snapshot mark', () => {
    const state = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create',
        subject: { type: 'tosplit', id: 't1' }, ts: 1 }),
      ev({ id: 'sn', actor: 'A', action: 'snapshot.commit',
        subject: { type: 'project', id: 'p1' },
        predicate: { upTo: 'c1', stateRoot: 'root-abc' },
        parents: ['c1'], ts: 2 })
    ]);
    expect(state.snapshots).toEqual([
      { eventId: 'sn', upTo: 'c1', stateRoot: 'root-abc', ts: 2, by: 'A' }
    ]);
  });

  it('ignores malformed predicates and duplicate attestations', () => {
    const state = project([
      ev({ id: 's1', actor: 'A', action: 'snapshot.commit',
        subject: { type: 'project', id: 'p1' },
        predicate: { upTo: 'c1' }, ts: 1 }),                       // malformed
      ev({ id: 's2', actor: 'A', action: 'snapshot.commit',
        subject: { type: 'project', id: 'p2' },
        predicate: { upTo: 'c1', stateRoot: 'r' }, parents: ['s1'], ts: 2 }),
      ev({ id: 's3', actor: 'B', action: 'snapshot.commit',
        subject: { type: 'project', id: 'p3' },
        predicate: { upTo: 'c1', stateRoot: 'r' }, parents: ['s2'], ts: 3 })  // dup
    ]);
    expect(state.snapshots.length).toBe(1);
    expect(state.snapshots[0].eventId).toBe('s2');
  });

  it('snapshots do NOT change the state root (attestation, not state)', async () => {
    const base = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create',
        subject: { type: 'tosplit', id: 't1' }, ts: 1 })
    ];
    const withSnap = [
      ...base,
      ev({ id: 'sn', actor: 'A', action: 'snapshot.commit',
        subject: { type: 'project', id: 'p1' },
        predicate: { upTo: 'c1', stateRoot: 'root-abc' },
        parents: ['c1'], ts: 1 })   // same ts so asOf stays equal
    ];
    expect(await computeStateRoot(project(base)))
      .toBe(await computeStateRoot(project(withSnap)));
  });
});
