import { describe, it, expect } from 'vitest';
import { computeStateRoot, canonicalBytesOfState, normalizeState, STATE_ROOT_VERSION } from './stateRoot';
import { project } from './projection';
import type { ConsentEvent } from './event';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: p.device ?? 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'tosplit', id: 'ts-1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

describe('normalizeState — deterministic shape', () => {
  it('embeds STATE_ROOT_VERSION so a future bump breaks loudly', () => {
    const state = project([]);
    const norm = normalizeState(state) as Record<string, unknown>;
    expect(norm.v).toBe(STATE_ROOT_VERSION);
  });

  it('sorts member set', () => {
    const events: ConsentEvent[] = [
      ev({ id: 'jB', actor: 'B', action: 'project.join',
           subject: { type: 'project', id: 'p1' }, ts: 1 }),
      ev({ id: 'jA', actor: 'A', action: 'project.join',
           subject: { type: 'project', id: 'p1' }, ts: 2 })
    ];
    const state = project(events, 'p1');
    const norm = normalizeState(state) as Record<string, unknown>;
    expect(norm.members).toEqual(['A', 'B']);
  });
});

describe('computeStateRoot — round-trip determinism', () => {
  it('two identical states produce the same root', async () => {
    const events: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 }),
      ev({ id: 'v1', actor: 'A', action: 'tosplit.vote',
           predicate: { what: true }, parents: ['c1'], ts: 200 })
    ];
    const s1 = project(events);
    const s2 = project(events);
    const r1 = await computeStateRoot(s1);
    const r2 = await computeStateRoot(s2);
    expect(r1).toBe(r2);
  });

  it('the root is the same regardless of input order (commutativity)', async () => {
    const events: ConsentEvent[] = [
      ev({ id: 'jA', actor: 'A', action: 'project.join',
           subject: { type: 'project', id: 'p1' }, ts: 1 }),
      ev({ id: 'jB', actor: 'B', action: 'project.join',
           subject: { type: 'project', id: 'p1' }, ts: 2 }),
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 3 }),
      ev({ id: 'vA', actor: 'A', action: 'tosplit.vote',
           predicate: { what: true }, parents: ['c1'], ts: 4 }),
      ev({ id: 'vB', actor: 'B', action: 'tosplit.vote',
           predicate: { what: true }, parents: ['c1'], ts: 5 })
    ];
    const r1 = await computeStateRoot(project(events, 'p1'));
    const r2 = await computeStateRoot(project([...events].reverse(), 'p1'));
    expect(r1).toBe(r2);
  });

  it('different states produce different roots', async () => {
    const e1 = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ]);
    const e2 = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 }),
      ev({ id: 'v1', actor: 'A', action: 'tosplit.vote',
           predicate: { what: true }, parents: ['c1'], ts: 200 })
    ]);
    const r1 = await computeStateRoot(e1);
    const r2 = await computeStateRoot(e2);
    expect(r1).not.toBe(r2);
  });

  it('a single tampered field changes the root (sensitivity)', async () => {
    const baseEvents: ConsentEvent[] = [
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ];
    const baseState = project(baseEvents);
    const baseRoot = await computeStateRoot(baseState);

    // Tamper: bump asOf by 1 ms
    const tampered = { ...baseState, asOf: baseState.asOf + 1 };
    const tamperedRoot = await computeStateRoot(tampered);
    expect(tamperedRoot).not.toBe(baseRoot);
  });

  it('round state participates in the root', async () => {
    // Same tosplits but with vs. without a counter → different rounds → different root.
    const noCounter = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ]);
    const withCounter = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 }),
      ev({ id: 'k1', actor: 'B', action: 'proposal.counter',
           parents: ['c1'], ts: 200 })
    ]);
    const r1 = await computeStateRoot(noCounter);
    const r2 = await computeStateRoot(withCounter);
    expect(r1).not.toBe(r2);
  });

  it('returns a stable b64url string', async () => {
    const state = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ]);
    const root = await computeStateRoot(state);
    expect(typeof root).toBe('string');
    expect(root.length).toBeGreaterThan(40);
    expect(root).toMatch(/^[A-Za-z0-9_-]+$/);  // b64url charset, no padding
  });
});

describe('canonicalBytesOfState — exposes the input to the hash', () => {
  it('two identical states produce identical bytes', () => {
    const s1 = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ]);
    const s2 = project([
      ev({ id: 'c1', actor: 'A', action: 'tosplit.create', ts: 100 })
    ]);
    const b1 = canonicalBytesOfState(s1);
    const b2 = canonicalBytesOfState(s2);
    expect(Array.from(b1)).toEqual(Array.from(b2));
  });
});
