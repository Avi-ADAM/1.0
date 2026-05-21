import { describe, it, expect } from 'vitest';
import { project, topoSort } from './projection';
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
