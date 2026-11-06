// B6 (PLAN_DISTRIBUTED_EXECUTION): incremental commitment verification.
//
// The cache must never change an answer — only how many reducer calls it
// takes to reach it. Property: on random DAGs (branches, merges, dedupe
// collisions), verifying every event with and without the cache gives the
// same results, and the commitments the reference produces verify.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { verifyCommitments, createCommitmentCache } from './commitment';
import { project } from './projection';
import { computeStateRoot } from './stateRoot';
import type { ConsentEvent } from './event';

const ACTORS = ['A', 'B', 'C'];

type Gen = { actor: number; kind: number; subject: number; order: number; parents: number[]; lie: boolean };

/** Build a DAG in topological order; every event commits to its roots. */
async function buildDag(spec: Gen[], projectId: string): Promise<ConsentEvent[]> {
  const out: ConsentEvent[] = [];
  const byId = new Map<string, ConsentEvent>();
  const closure = (ids: string[]) => {
    const seen = new Set<string>();
    const stack = [...ids];
    const res: ConsentEvent[] = [];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const e = byId.get(id)!;
      res.push(e);
      stack.push(...e.parents);
    }
    return res;
  };
  for (let i = 0; i < spec.length; i++) {
    const g = spec[i];
    const parents =
      i === 0 ? [] : [...new Set(g.parents.map((p) => out[p % i].id))];
    const actor = ACTORS[g.actor % ACTORS.length];
    const base = {
      v: 1 as const,
      id: `e${String(i).padStart(4, '0')}`,
      actor,
      device: 'd',
      parents,
      ts: 1000 + i * 10,
      nonce: `n${i}`,
      sig: 's'
    };
    const kinds: Pick<ConsentEvent, 'action' | 'subject' | 'predicate'>[] = [
      { action: 'project.join', subject: { type: 'project', id: projectId }, predicate: undefined },
      // small subject space + order ⇒ frequent dedupe collisions
      { action: 'tosplit.vote', subject: { type: 'tosplit', id: `t${g.subject % 2}` }, predicate: { what: g.order % 2 === 0, order: g.order % 2 } },
      { action: 'mission.complete', subject: { type: 'mission', id: `m${g.subject % 3}` }, predicate: { hoursDone: g.order } },
      { action: 'member.away', subject: { type: 'user', id: actor }, predicate: g.order % 2 ? { back: true } : {} }
    ];
    const k = kinds[g.kind % kinds.length];
    const draft = { ...base, ...k } as ConsentEvent;
    const anc = closure(parents);
    const parentStateRoots: string[] = [];
    for (const p of parents) parentStateRoots.push(await computeStateRoot(project(closure([p]), projectId)));
    let stateRoot = await computeStateRoot(project([...anc, draft], projectId));
    if (g.lie) stateRoot = parentStateRoots[0] ?? 'not-a-root';
    const ev = { ...draft, parentStateRoots, stateRoot } as ConsentEvent;
    out.push(ev);
    byId.set(ev.id, ev);
  }
  return out;
}

const genSpec = fc.array(
  fc.record({
    actor: fc.nat(5),
    kind: fc.nat(7),
    subject: fc.nat(5),
    order: fc.nat(3),
    parents: fc.array(fc.nat(50), { minLength: 1, maxLength: 3 }),
    lie: fc.nat(9).map((n) => n === 0) // ~10% of events lie about their root
  }),
  { minLength: 1, maxLength: 25 }
);

describe('B6 — commitment cache', () => {
  it('gives the same verdict as a from-scratch replay on random DAGs', async () => {
    const total = { incremental: 0, full: 0 };
    await fc.assert(
      fc.asyncProperty(genSpec, fc.nat(1000), async (spec, salt) => {
        const projectId = `p${salt}`;
        const events = await buildDag(spec, projectId);
        const byId = new Map(events.map((e) => [e.id, e]));
        const getEvent = (id: string) => byId.get(id);
        const shared = createCommitmentCache(8); // small: evictions are exercised too
        for (const ev of events) {
          const ref = await verifyCommitments(ev, { getEvent, projectId, mode: 'strict', cache: null });
          const got = await verifyCommitments(ev, { getEvent, projectId, mode: 'strict', cache: shared });
          expect(got).toEqual(ref);
        }
        total.incremental += shared.stats.incremental;
        total.full += shared.stats.full;
        // the same events in reverse order: a cold cache meets warm ancestors
        const rev = createCommitmentCache();
        for (const ev of [...events].reverse()) {
          const ref = await verifyCommitments(ev, { getEvent, projectId, mode: 'strict', cache: null });
          expect(await verifyCommitments(ev, { getEvent, projectId, mode: 'strict', cache: rev })).toEqual(ref);
        }
      }),
      { numRuns: 40 }
    );
    // The run must have taken both paths, or it proved nothing about the cache.
    expect(total.incremental).toBeGreaterThan(0);
    expect(total.full).toBeGreaterThan(0);
  }, 120_000);

  it('a 500-event chain verifies with a linear number of reducer replays', async () => {
    const projectId = 'p-lin';
    const N = 500;
    // Linear chain, all-distinct dedupe keys (one mission each). Not
    // project.join: in strict mode it needs a QuorumProof.
    const events: ConsentEvent[] = [];
    let state = project([], projectId);
    for (let i = 0; i < N; i++) {
      const parents = i === 0 ? [] : [events[i - 1].id];
      const draft = {
        v: 1,
        id: `c${String(i).padStart(4, '0')}`,
        actor: 'A',
        device: 'd',
        action: 'mission.complete',
        subject: { type: 'mission', id: `m${i}` },
        predicate: { hoursDone: 1 },
        parents,
        ts: 1000 + i,
        nonce: `n${i}`,
        sig: 's'
      } as ConsentEvent;
      const parentRoot = await computeStateRoot(state);
      state = project([...events, draft], projectId);
      events.push({ ...draft, parentStateRoots: i === 0 ? [] : [parentRoot], stateRoot: await computeStateRoot(state) } as ConsentEvent);
    }
    const byId = new Map(events.map((e) => [e.id, e]));
    const cache = createCommitmentCache();
    for (const ev of events) {
      const r = await verifyCommitments(ev, { getEvent: (id) => byId.get(id), projectId, mode: 'strict', cache });
      expect(r.ok, ev.id).toBe(true);
    }
    // One full replay to warm the very first state; every other step is one
    // applyEvent on the parent's cached state. From scratch this is Σ i ≈ N²/2.
    expect(cache.stats.full).toBeLessThanOrEqual(2);
    expect(cache.stats.incremental).toBeGreaterThanOrEqual(N - 1);
    expect(cache.stats.incremental + cache.stats.full).toBeLessThanOrEqual(N + 2);
  }, 120_000);
});
