// T10 — the normalize↔restore symmetry contract (PLAN_T10_COMPACTION §2.4):
//     normalizeState(restoreState(n)) ≡ n     (byte-identical canonical JSON)
// over a state that exercises every ProjectState map.

import { describe, it, expect } from 'vitest';
import { project } from './projection';
import { normalizeState, canonicalBytesOfState, STATE_ROOT_VERSION } from './stateRoot';
import { restoreState } from './stateRestore';
import { canonicalize } from '$lib/crypto/canonical';
import type { JsonValue } from '$lib/crypto/canonical';
import type { ConsentEvent } from './event';

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

/** A log that touches every map: members, balances, tosplits, rounds, sales,
 *  saleClaims, missions, halukas, decisions, stageVotes, timers, forums,
 *  meetings, away, settings. */
export function richLog(): ConsentEvent[] {
  return [
    ev({ id: 'jA', actor: 'A', action: 'project.join', ts: 1 }),
    ev({ id: 'jB', actor: 'B', action: 'project.join', ts: 2 }),
    ev({ id: 'am', actor: 'A', action: 'project.amend',
      predicate: { path: 'restime', value: 'feh', order: 1 }, ts: 3 }),
    ev({ id: 'aw', actor: 'B', action: 'member.away',
      predicate: { until: 900, order: 1 }, ts: 4 }),
    ev({ id: 'ts1', actor: 'A', action: 'tosplit.create',
      subject: { type: 'tosplit', id: 'T1' }, predicate: { total: 100 }, ts: 5 }),
    ev({ id: 'tv1', actor: 'A', action: 'tosplit.vote',
      subject: { type: 'tosplit', id: 'T1' }, predicate: { what: true }, parents: ['ts1'], ts: 6 }),
    ev({ id: 'cn1', actor: 'B', action: 'proposal.counter',
      subject: { type: 'tosplit', id: 'T1' }, predicate: { order: 1 }, parents: ['tv1'], ts: 7 }),
    ev({ id: 'm1', actor: 'A', action: 'mission.create',
      subject: { type: 'mission', id: 'M1' },
      predicate: { name: 'build', branch: 'pend', stageIds: ['pd1'], hours: 5, perhour: 40 }, ts: 8 }),
    ev({ id: 'pv1', actor: 'A', action: 'pendm.vote',
      subject: { type: 'pend', id: 'pd1' }, predicate: { what: true, order: 0 }, ts: 9 }),
    ev({ id: 'pv2', actor: 'B', action: 'pendm.vote',
      subject: { type: 'pend', id: 'pd1' }, predicate: { what: true, order: 0 }, ts: 10 }),
    ev({ id: 'dn', actor: 'B', action: 'mission.complete',
      subject: { type: 'mission', id: 'M1' }, predicate: { hoursDone: 5, why: 'done' }, ts: 11 }),
    ev({ id: 'ap', actor: 'A', action: 'mission.approve',
      subject: { type: 'mission', id: 'M1' },
      predicate: { payee: 'B', amount: { amount: '200', code: 'ILS' } }, parents: ['dn'], ts: 12 }),
    ev({ id: 'h1', actor: 'A', action: 'haluka.create',
      subject: { type: 'haluka', id: 'H1' },
      predicate: { from: 'A', to: 'B', tosplitId: 'T1', amount: 50, code: 'ILS' }, ts: 13 }),
    ev({ id: 'd1', actor: 'A', action: 'decision.create',
      subject: { type: 'decision', id: 'D1' }, predicate: { kind: 'pubdes', ref: 'pic' }, ts: 14 }),
    ev({ id: 'dv1', actor: 'B', action: 'decision.vote',
      subject: { type: 'decision', id: 'D1' }, predicate: { what: true, order: 0 }, ts: 15 }),
    ev({ id: 'sr', actor: 'A', action: 'sale.record',
      subject: { type: 'sale', id: 'S1' },
      predicate: { holder: 'B', total: 70, holderStatus: 'open', decisionId: 'DC1', order: 1 }, ts: 16 }),
    ev({ id: 'f1', actor: 'A', action: 'forum.create',
      subject: { type: 'forum', id: 'F1' }, predicate: { kind: 'vote' }, ts: 17 }),
    ev({ id: 'ms1', actor: 'B', action: 'message.post',
      subject: { type: 'message', id: 'ms1' }, predicate: { forumId: 'F1', body: 'hi' }, ts: 18 }),
    ev({ id: 'rd1', actor: 'B', action: 'payload.redact',
      subject: { type: 'message', id: 'ms1' }, parents: ['ms1'], ts: 19 }),
    ev({ id: 'g1', actor: 'B', action: 'pgisha.create',
      subject: { type: 'pgisha', id: 'G1' }, predicate: { date: '2026-08-01' }, ts: 20 }),
    ev({ id: 'ga', actor: 'A', action: 'pgisha.approve',
      subject: { type: 'pgisha', id: 'G1' }, parents: ['g1'], ts: 21 }),
    ev({ id: 'tk1', actor: 'B', action: 'time.tick',
      subject: { type: 'mission', id: 'M1' }, predicate: { op: 'start', order: 22 }, ts: 22 }),
    ev({ id: 'tk2', actor: 'B', action: 'time.tick',
      subject: { type: 'mission', id: 'M1' }, predicate: { op: 'stop', order: 23 }, ts: 23 })
  ];
}

describe('restoreState — symmetry with normalizeState', () => {
  it('normalize(restore(n)) is byte-identical to n over a rich state', () => {
    const state = project(richLog(), 'p1');
    // The snapshot travels as JSON — round through the canonical serializer.
    const wire = JSON.parse(canonicalize(normalizeState(state) as JsonValue));
    const restored = restoreState(wire);
    expect(restored.ok).toBe(true);
    const again = canonicalize(normalizeState(restored.state!) as JsonValue);
    expect(again).toBe(canonicalize(wire));
  });

  it('restored state hashes to the same root as the original', () => {
    const state = project(richLog(), 'p1');
    const wire = JSON.parse(canonicalize(normalizeState(state) as JsonValue));
    const restored = restoreState(wire);
    expect(Array.from(canonicalBytesOfState(restored.state!)))
      .toEqual(Array.from(canonicalBytesOfState(state)));
  });

  it('refuses an unknown state version instead of guessing', () => {
    const state = project(richLog(), 'p1');
    const wire = JSON.parse(canonicalize(normalizeState(state) as JsonValue));
    wire.v = STATE_ROOT_VERSION + 999;
    const res = restoreState(wire);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('unknown_state_version');
  });
});
