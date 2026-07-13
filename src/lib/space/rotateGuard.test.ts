// T5 acceptance (HANDOFF_DISTRIBUTED_DB): a non-member publishing
// epoch.rotate is rejected; a member skipping epochs is rejected.

import { describe, it, expect } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import { validateEpochRotate, projectIdOfSpace } from './rotateGuard';

const SPACE = 'project:p1';

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

const join = (who: string, ts: number) =>
  ev({ id: `j${who}`, actor: who, action: 'project.join', ts });

const rotate = (id: string, actor: string, epoch: number, ts: number) =>
  ev({
    id, actor, action: 'epoch.rotate',
    subject: { type: 'space', id: SPACE },
    predicate: { epoch, reason: 'manual', wraps: {} },
    ts
  });

describe('validateEpochRotate — membership', () => {
  const members = [join('A', 1), join('B', 2)];

  it('an active member may rotate', () => {
    expect(validateEpochRotate(SPACE, members, rotate('r0', 'A', 0, 10)).ok).toBe(true);
  });

  it('a non-member is rejected', () => {
    const res = validateEpochRotate(SPACE, members, rotate('r0', 'Z', 0, 10));
    expect(res).toMatchObject({ ok: false, reason: 'rotate_not_a_member' });
  });

  it('a member who left is rejected', () => {
    const events = [
      ...members,
      ev({ id: 'lB', actor: 'B', action: 'project.leave', ts: 3 })
    ];
    const res = validateEpochRotate(SPACE, events, rotate('r0', 'B', 0, 10));
    expect(res).toMatchObject({ ok: false, reason: 'rotate_not_a_member' });
  });

  it('bootstrap: epoch 0 on a space with no members yet is allowed', () => {
    expect(validateEpochRotate(SPACE, [], rotate('r0', 'A', 0, 1)).ok).toBe(true);
  });

  it('non-project spaces skip the membership rule (continuity still applies)', () => {
    expect(projectIdOfSpace('duo:A:B')).toBeNull();
    expect(validateEpochRotate('duo:A:B', [], rotate('r0', 'Z', 0, 1)).ok).toBe(true);
    expect(validateEpochRotate('duo:A:B', [], rotate('r5', 'Z', 5, 1)).ok).toBe(false);
  });
});

describe('validateEpochRotate — continuity', () => {
  const base = [join('A', 1), join('B', 2), rotate('r0', 'A', 0, 10)];

  it('current+1 is accepted', () => {
    expect(validateEpochRotate(SPACE, base, rotate('r1', 'B', 1, 20)).ok).toBe(true);
  });

  it('skipping epochs (0 → 5) is rejected', () => {
    const res = validateEpochRotate(SPACE, base, rotate('r5', 'A', 5, 20));
    expect(res).toMatchObject({ ok: false, reason: 'rotate_epoch_gap:0->5' });
  });

  it('T11: a same-epoch duplicate (race record) is ACCEPTED — winner is resolved by lowest id, not by arrival', () => {
    const res = validateEpochRotate(SPACE, base, rotate('r0b', 'B', 0, 30));
    expect(res.ok).toBe(true);
  });

  it('T11: a late-arriving rotate for an older epoch is accepted (set convergence)', () => {
    const events = [...base, rotate('r1', 'B', 1, 20)];
    const res = validateEpochRotate(SPACE, events, rotate('r0x', 'B', 0, 30));
    expect(res.ok).toBe(true);
  });

  it('a malformed epoch is rejected', () => {
    const bad = ev({
      id: 'rx', actor: 'A', action: 'epoch.rotate',
      subject: { type: 'space', id: SPACE },
      predicate: { epoch: -2, reason: 'manual', wraps: {} }, ts: 20
    });
    expect(validateEpochRotate(SPACE, base, bad).ok).toBe(false);
  });

  it('non-rotate events pass through untouched', () => {
    const res = validateEpochRotate(SPACE, base, join('C', 40));
    expect(res.ok).toBe(true);
  });
});
