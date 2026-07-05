import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { ConsentEvent } from '$lib/consent/event';
import {
  computeHeads,
  sameHeads,
  ancestryClosure,
  computeDiff,
  needsSync,
  spaceIdForProject,
  isValidSpaceId
} from './protocol';

// Protocol-layer tests use structurally valid but unsigned events — signature
// verification lives in ingest, not here.
let seq = 0;
function ev(id: string, parents: string[] = [], ts?: number): ConsentEvent {
  return {
    v: 1,
    id,
    actor: 'user-a',
    device: 'dev-a',
    action: 'tosplit.vote',
    subject: { type: 'tosplit', id: 'ts-1' },
    parents,
    ts: ts ?? ++seq,
    nonce: 'n',
    sig: 's'
  };
}

describe('spaceIdForProject / isValidSpaceId', () => {
  it('builds and validates canonical ids', () => {
    expect(spaceIdForProject('42')).toBe('project:42');
    expect(isValidSpaceId('project:42')).toBe(true);
    expect(isValidSpaceId('nego:12_34-x')).toBe(true);
    expect(isValidSpaceId('has space')).toBe(false);
    expect(isValidSpaceId('a/../../etc')).toBe(false);
    expect(isValidSpaceId('')).toBe(false);
    expect(isValidSpaceId('x'.repeat(81))).toBe(false);
  });
});

describe('computeHeads', () => {
  it('linear chain → single head at the tip', () => {
    const a = ev('a'), b = ev('b', ['a']), c = ev('c', ['b']);
    expect(computeHeads([a, b, c])).toEqual(['c']);
  });

  it('fork → both branch tips are heads, sorted', () => {
    const a = ev('a'), b = ev('b', ['a']), c = ev('c', ['a']);
    expect(computeHeads([a, b, c])).toEqual(['b', 'c']);
  });

  it('merge event collapses heads back to one', () => {
    const a = ev('a'), b = ev('b', ['a']), c = ev('c', ['a']);
    const m = ev('m', ['b', 'c']);
    expect(computeHeads([a, b, c, m])).toEqual(['m']);
  });

  it('empty set → no heads', () => {
    expect(computeHeads([])).toEqual([]);
  });

  it('parents outside the set do not demote members', () => {
    // 'b' references 'a' which we don't hold — 'b' is still our head.
    const b = ev('b', ['a']);
    expect(computeHeads([b])).toEqual(['b']);
  });
});

describe('sameHeads / needsSync', () => {
  it('identical sorted lists match', () => {
    expect(sameHeads(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(needsSync(['a', 'b'], ['a', 'b'])).toBe(false);
  });
  it('any difference requires sync', () => {
    expect(needsSync(['a'], ['a', 'b'])).toBe(true);
    expect(needsSync(['a'], ['b'])).toBe(true);
    expect(needsSync([], ['a'])).toBe(true);
  });
});

describe('ancestryClosure', () => {
  it('walks parents transitively and skips unknown ids', () => {
    const a = ev('a'), b = ev('b', ['a']), c = ev('c', ['b']);
    const byId = new Map([a, b, c].map((e) => [e.id, e]));
    const closure = ancestryClosure(byId, ['c', 'zz-unknown']);
    expect(closure).toEqual(new Set(['a', 'b', 'c', 'zz-unknown']));
  });
});

describe('computeDiff', () => {
  it('peer with a prefix gets exactly the suffix, parents first', () => {
    const a = ev('a'), b = ev('b', ['a']), c = ev('c', ['b']), d = ev('d', ['c']);
    const diff = computeDiff([a, b, c, d], computeHeads([a, b]));
    expect(diff.map((e) => e.id)).toEqual(['c', 'd']);
  });

  it('in-sync replicas exchange nothing', () => {
    const a = ev('a'), b = ev('b', ['a']);
    expect(computeDiff([a, b], computeHeads([a, b]))).toEqual([]);
  });

  it('peer ahead of us: unknown remote heads produce no bogus diff', () => {
    const a = ev('a'), b = ev('b', ['a']);
    // Remote head 'z' is unknown here but its closure can't cover our events
    // unless it descends from them — with no local copy we conservatively
    // resend anything not under the heads we can walk.
    const diff = computeDiff([a, b], ['z']);
    expect(diff.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('diverged branches resend the shared ancestor (safe redundancy)', () => {
    const a = ev('a');
    const b = ev('b', ['a']); // ours
    const c = ev('c', ['a']); // theirs
    // Their only head is 'c', which we don't hold — so we cannot prove they
    // have 'a' and conservatively resend it along with our branch. Receiver
    // dedupe absorbs the overlap; convergence is what matters.
    const diff = computeDiff([a, b], computeHeads([a, c]));
    expect(diff.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

// --- Convergence property: after a mutual heads/diff exchange, two replicas
// --- holding arbitrary overlapping fragments of the same DAG hold identical
// --- sets. This is the invariant the whole distributed layer rests on.

type Frag = { all: ConsentEvent[]; aIdx: number[]; bIdx: number[] };

const dagArb: fc.Arbitrary<Frag> = fc
  .integer({ min: 1, max: 24 })
  .chain((n) =>
    fc
      .tuple(
        // parent links: for event i, pick parents among 0..i-1
        fc.array(fc.nat({ max: 3 }), { minLength: n, maxLength: n }),
        fc.array(fc.boolean(), { minLength: n, maxLength: n }),
        fc.array(fc.boolean(), { minLength: n, maxLength: n })
      )
      .map(([parentCounts, inA, inB]) => {
        const all: ConsentEvent[] = [];
        for (let i = 0; i < n; i++) {
          const parents: string[] = [];
          const want = Math.min(parentCounts[i], i);
          for (let k = 0; k < want; k++) parents.push(`e${(i * 7 + k * 13) % i}`);
          all.push(ev(`e${i}`, [...new Set(parents)], i + 1));
        }
        return {
          all,
          aIdx: inA.flatMap((x, i) => (x ? [i] : [])),
          bIdx: inB.flatMap((x, i) => (x ? [i] : []))
        };
      })
  );

/**
 * Replicas hold ancestor-closed subsets in real life (you never ingest a
 * child without eventually holding its parents in the same space). Close the
 * random index picks downward to honor that.
 */
function closedSubset(all: ConsentEvent[], idx: number[]): Map<string, ConsentEvent> {
  const byId = new Map(all.map((e) => [e.id, e]));
  const out = new Map<string, ConsentEvent>();
  const stack = idx.map((i) => all[i].id);
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    const e = byId.get(id);
    if (!e) continue;
    out.set(id, e);
    stack.push(...e.parents);
  }
  return out;
}

describe('convergence (property)', () => {
  it('one round of mutual heads/diff exchange makes both replicas equal', () => {
    fc.assert(
      fc.property(dagArb, ({ all, aIdx, bIdx }) => {
        const A = closedSubset(all, aIdx);
        const B = closedSubset(all, bIdx);

        // A → B: B answers A's heads with a diff; A ingests. And vice versa.
        const diffForA = computeDiff(B.values(), computeHeads(A.values()));
        const diffForB = computeDiff(A.values(), computeHeads(B.values()));
        for (const e of diffForA) A.set(e.id, e);
        for (const e of diffForB) B.set(e.id, e);

        const aIds = [...A.keys()].sort();
        const bIds = [...B.keys()].sort();
        expect(aIds).toEqual(bIds);
        expect(sameHeads(computeHeads(A.values()), computeHeads(B.values()))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('diff against own heads is always empty (idempotence)', () => {
    fc.assert(
      fc.property(dagArb, ({ all, aIdx }) => {
        const A = closedSubset(all, aIdx);
        expect(computeDiff(A.values(), computeHeads(A.values()))).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
