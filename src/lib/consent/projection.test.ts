import { describe, it, expect } from 'vitest';
import { project, topoSort } from './projection';
import { compareIds } from './ids';
import { canonicalBytesOfState } from './stateRoot';
import type { ConsentEvent } from './event';

function ev(partial: Partial<ConsentEvent> & { id: string; action: string; parents?: string[] }): ConsentEvent {
  return {
    v: 1,
    id: partial.id,
    actor: partial.actor ?? 'user-1',
    device: partial.device ?? 'dev-1',
    action: partial.action as ConsentEvent['action'],
    subject: partial.subject ?? { type: 'tosplit', id: 'ts-1' },
    predicate: partial.predicate,
    parents: partial.parents ?? [],
    ts: partial.ts ?? 0,
    nonce: partial.nonce ?? 'n',
    sig: partial.sig ?? 's'
  };
}

describe('topoSort', () => {
  it('puts parents before children', () => {
    const a = ev({ id: 'a', action: 'project.create', ts: 1 });
    const b = ev({ id: 'b', action: 'project.join', parents: ['a'], ts: 2 });
    const c = ev({ id: 'c', action: 'project.join', parents: ['a'], ts: 3 });
    const sorted = topoSort([c, b, a]);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('orders independent events by ts then id', () => {
    const a = ev({ id: 'a', action: 'project.join', ts: 2 });
    const b = ev({ id: 'b', action: 'project.join', ts: 1 });
    const sorted = topoSort([a, b]);
    expect(sorted.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('project: tosplit voting', () => {
  it('flags tosplit approved when all members vote what:true', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'j2', actor: 'u2', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 2 }),
      ev({ id: 'tc', actor: 'u1', action: 'tosplit.create',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { halukas: [] }, parents: [], ts: 3 }),
      ev({ id: 'v1', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 4 }),
      ev({ id: 'v2', actor: 'u2', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 5 })
    ];
    const state = project(events, projectId);
    expect(state.members.has('u1')).toBe(true);
    expect(state.members.has('u2')).toBe(true);
    const view = state.tosplits.get('ts-1')!;
    expect(view).toBeTruthy();
    expect(view.approved).toBe(true);
  });

  it('does not approve when one member did not vote', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'j2', actor: 'u2', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 2 }),
      ev({ id: 'tc', actor: 'u1', action: 'tosplit.create',
           subject: { type: 'tosplit', id: 'ts-1' }, parents: [], ts: 3 }),
      ev({ id: 'v1', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 4 })
    ];
    const state = project(events, projectId);
    expect(state.tosplits.get('ts-1')!.approved).toBe(false);
  });

  it('does not approve when one member rejects', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'j2', actor: 'u2', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 2 }),
      ev({ id: 'tc', actor: 'u1', action: 'tosplit.create',
           subject: { type: 'tosplit', id: 'ts-1' }, parents: [], ts: 3 }),
      ev({ id: 'v1', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 4 }),
      ev({ id: 'v2', actor: 'u2', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: false }, parents: ['tc'], ts: 5 })
    ];
    const state = project(events, projectId);
    expect(state.tosplits.get('ts-1')!.approved).toBe(false);
  });

  it('last vote per actor wins (revote)', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'tc', actor: 'u1', action: 'tosplit.create',
           subject: { type: 'tosplit', id: 'ts-1' }, parents: [], ts: 2 }),
      ev({ id: 'v1', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: false }, parents: ['tc'], ts: 3 }),
      ev({ id: 'v2', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 4 })
    ];
    const state = project(events, projectId);
    expect(state.tosplits.get('ts-1')!.approved).toBe(true);
  });

  it('member leaving removes them from members set', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'j2', actor: 'u2', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 2 }),
      ev({ id: 'l2', actor: 'u2', action: 'project.leave', subject: { type: 'project', id: projectId }, parents: ['j2'], ts: 3 })
    ];
    const state = project(events, projectId);
    expect(state.members.has('u1')).toBe(true);
    expect(state.members.has('u2')).toBe(false);
  });
});

describe('project: commutativity under topo-sort', () => {
  it('produces same state regardless of input order', () => {
    const projectId = 'proj-1';
    const events: ConsentEvent[] = [
      ev({ id: 'j1', actor: 'u1', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 1 }),
      ev({ id: 'j2', actor: 'u2', action: 'project.join', subject: { type: 'project', id: projectId }, ts: 2 }),
      ev({ id: 'tc', actor: 'u1', action: 'tosplit.create',
           subject: { type: 'tosplit', id: 'ts-1' }, parents: [], ts: 3 }),
      ev({ id: 'v1', actor: 'u1', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 4 }),
      ev({ id: 'v2', actor: 'u2', action: 'tosplit.vote',
           subject: { type: 'tosplit', id: 'ts-1' },
           predicate: { what: true }, parents: ['tc'], ts: 5 })
    ];
    const a = project(events, projectId);
    const b = project([...events].reverse(), projectId);
    expect(a.members).toEqual(b.members);
    expect(a.tosplits.get('ts-1')!.approved).toBe(b.tosplits.get('ts-1')!.approved);
  });
});

// Invariant 7: the same-ts tie-break must be a function of the ids alone.
// Every pair below is ordered one way by code units and the other way by
// localeCompare (case-insensitive primary level; '_' before '-'), so the old
// `a.id.localeCompare(b.id)` tie-break folded them in a locale-chosen order.
describe('project: same-ts tie-break is code-unit id order, never locale', () => {
  const projectId = 'proj-1';
  const PAIRS: Array<[string, string]> = [
    ['aZZ', 'BAA'],
    ['_x', '-x']
  ];

  it('the fixture pairs really do disagree between the two orders', () => {
    for (const [x, y] of PAIRS) {
      expect(Math.sign(x.localeCompare(y))).not.toBe(compareIds(x, y));
    }
  });

  function amend(id: string, actor: string, value: string): ConsentEvent {
    return ev({
      id,
      actor,
      action: 'project.amend',
      subject: { type: 'project', id: projectId },
      predicate: { path: 'name', value },
      ts: 100
    });
  }

  it('topoSort puts the code-unit-lower id first', () => {
    for (const [x, y] of PAIRS) {
      const lo = compareIds(x, y) < 0 ? x : y;
      const hi = lo === x ? y : x;
      for (const input of [[amend(x, 'u1', x), amend(y, 'u2', y)], [amend(y, 'u2', y), amend(x, 'u1', x)]]) {
        expect(topoSort(input).map((e) => e.id)).toEqual([lo, hi]);
      }
    }
  });

  it('last-write-wins settings: identical projection in both input orders, code-unit winner', () => {
    for (const [x, y] of PAIRS) {
      const events = [amend(x, 'u1', x), amend(y, 'u2', y)];
      const a = project(events, projectId);
      const b = project([...events].reverse(), projectId);
      expect(canonicalBytesOfState(a)).toEqual(canonicalBytesOfState(b));
      // folded last = the code-unit-higher id
      expect(a.settings.get('name')).toBe(compareIds(x, y) > 0 ? x : y);
    }
  });

  it('dedupe tie (same actor/subject/action, same ts): the code-unit-lower id survives', () => {
    for (const [x, y] of PAIRS) {
      const events = [amend(x, 'u1', x), amend(y, 'u1', y)];
      const a = project(events, projectId);
      const b = project([...events].reverse(), projectId);
      expect(canonicalBytesOfState(a)).toEqual(canonicalBytesOfState(b));
      expect(a.settings.get('name')).toBe(compareIds(x, y) < 0 ? x : y);
    }
  });

  it('forum messages with the same ts are kept in code-unit id order', () => {
    for (const [x, y] of PAIRS) {
      const post = (msgId: string, evId: string, actor: string) =>
        ev({
          id: evId,
          actor,
          action: 'message.post',
          subject: { type: 'message', id: msgId },
          predicate: { forumId: 'f1', body: msgId },
          ts: 100
        });
      const events = [post(x, 'e1', 'u1'), post(y, 'e2', 'u2')];
      const a = project(events, projectId);
      const b = project([...events].reverse(), projectId);
      expect(canonicalBytesOfState(a)).toEqual(canonicalBytesOfState(b));
      expect(a.forums.get('f1')!.messages.map((m) => m.id)).toEqual([x, y].sort(compareIds));
    }
  });
});
