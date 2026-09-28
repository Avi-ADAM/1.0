// T5 acceptance (HANDOFF_DISTRIBUTED_DB): a non-member publishing
// epoch.rotate is rejected; a member skipping epochs is rejected.

import { describe, it, expect } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import {
  validateEpochRotate,
  validateEpochGrant,
  validateKeyEvent,
  projectIdOfSpace,
  vaultProjectIdOfSpace
} from './rotateGuard';

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

// T9a — vault spaces take their member set from the parent rikma, and
// epoch.grant is held to the same membership rule as epoch.rotate.

const VAULT = 'vault:p1';

const grantEv = (id: string, actor: string, rotateId: string, epoch: number, space = SPACE) =>
  ev({
    id, actor, action: 'epoch.grant',
    subject: { type: 'space', id: space },
    predicate: { rotateId, epoch, wraps: {} },
    ts: 50
  });

describe('vault spaces — membership comes from the parent rikma', () => {
  const vaultRotate = (id: string, actor: string, epoch: number) =>
    ev({
      id, actor, action: 'epoch.rotate',
      subject: { type: 'space', id: VAULT },
      predicate: { epoch, reason: 'genesis', wraps: {} }, ts: 10
    });
  const members = new Set(['A', 'B']);

  it('recognises the parent id', () => {
    expect(vaultProjectIdOfSpace(VAULT)).toBe('p1');
    expect(vaultProjectIdOfSpace(SPACE)).toBeNull();
    expect(projectIdOfSpace(VAULT)).toBeNull();
  });

  it('fails closed without a member set', () => {
    expect(validateEpochRotate(VAULT, [], vaultRotate('v0', 'A', 0)))
      .toMatchObject({ ok: false, reason: 'vault_members_unknown' });
    expect(validateEpochRotate(VAULT, [], vaultRotate('v0', 'A', 0), { members: new Set() }))
      .toMatchObject({ ok: false, reason: 'vault_members_unknown' });
  });

  it('a member may open the vault (genesis)', () => {
    expect(validateEpochRotate(VAULT, [], vaultRotate('v0', 'A', 0), { members }).ok).toBe(true);
  });

  it('a non-member cannot pre-create it — no bootstrap exemption for vaults', () => {
    expect(validateEpochRotate(VAULT, [], vaultRotate('v0', 'Z', 0), { members }))
      .toMatchObject({ ok: false, reason: 'rotate_not_a_member' });
  });

  it('continuity still applies', () => {
    expect(validateEpochRotate(VAULT, [], vaultRotate('v4', 'A', 4), { members }).ok).toBe(false);
  });
});

describe('validateEpochGrant', () => {
  const base = [join('A', 1), join('B', 2), rotate('r0', 'A', 0, 10)];

  it('a member may share an existing epoch', () => {
    expect(validateEpochGrant(SPACE, base, grantEv('g1', 'B', 'r0', 0)).ok).toBe(true);
  });

  it('a non-member may not', () => {
    expect(validateEpochGrant(SPACE, base, grantEv('g1', 'Z', 'r0', 0)))
      .toMatchObject({ ok: false, reason: 'rotate_not_a_member' });
  });

  it('an orphan grant (unknown rotate) is rejected', () => {
    expect(validateEpochGrant(SPACE, base, grantEv('g1', 'A', 'nope', 0)))
      .toMatchObject({ ok: false, reason: 'grant_unknown_rotate' });
  });

  it('a grant whose epoch disagrees with its rotate is rejected', () => {
    expect(validateEpochGrant(SPACE, base, grantEv('g1', 'A', 'r0', 1)))
      .toMatchObject({ ok: false, reason: 'grant_epoch_mismatch' });
  });

  it('no bootstrap for grants: a project space with no members rejects them', () => {
    const bare = [rotate('r0', 'A', 0, 10)];
    expect(validateEpochGrant(SPACE, bare, grantEv('g1', 'A', 'r0', 0)).ok).toBe(false);
  });

  it('vault grants use the supplied members', () => {
    const vr = ev({
      id: 'v0', actor: 'A', action: 'epoch.rotate',
      subject: { type: 'space', id: VAULT },
      predicate: { epoch: 0, reason: 'genesis', wraps: {} }, ts: 10
    });
    const g = grantEv('g1', 'B', 'v0', 0, VAULT);
    expect(validateEpochGrant(VAULT, [vr], g).ok).toBe(false);
    expect(validateEpochGrant(VAULT, [vr], g, { members: new Set(['A', 'B']) }).ok).toBe(true);
    expect(validateEpochGrant(VAULT, [vr], g, { members: new Set(['A']) }).ok).toBe(false);
  });

  it('validateKeyEvent dispatches rotate, grant, and passes the rest', () => {
    expect(validateKeyEvent(SPACE, base, rotate('r9', 'A', 9, 20)).ok).toBe(false);
    expect(validateKeyEvent(SPACE, base, grantEv('g1', 'Z', 'r0', 0)).ok).toBe(false);
    expect(validateKeyEvent(SPACE, base, join('C', 40)).ok).toBe(true);
  });
});
