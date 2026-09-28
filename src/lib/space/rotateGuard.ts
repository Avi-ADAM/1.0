// T5 — epoch.rotate authorization (HANDOFF_DISTRIBUTED_DB), extended in T9a
// to epoch.grant and to vault spaces.
//
// Until now ANY identity could publish an epoch.rotate to a space — fine for
// tests and shadow mode, a known security hole before real use. This guard
// closes it deterministically, from the data alone (invariant 7):
//
//   1. Continuity: the rotate may not SKIP forward (epoch > current+1).
//      Same-or-older epochs are accepted on purpose (T11): two concurrent
//      rotates for one epoch are a legitimate race — both must land in every
//      replica so the lowest-event-id winner rule (epochStateFromEvents)
//      resolves identically everywhere, and so the LOSER's wraps remain
//      available to decrypt events sealed in the race window. Rejecting the
//      second arrival would make the accepted set depend on arrival order —
//      exactly what invariant 7 forbids.
//   2. Membership: for a `project:<id>` space, the actor must be an active
//      member per the projection at that moment (project.join without a
//      subsequent project.leave). Epoch 0 on a space whose projection has no
//      members yet is allowed — bootstrap: the genesis rotate often precedes
//      the join events it protects.
//
//      A `vault:<id>` space holds no join events of its own — its members
//      are the parent rikma's, and the caller supplies them (`ctx.members`,
//      read from the project space's projection). There is NO bootstrap
//      exemption there: otherwise anyone could pre-create a rikma's vault
//      with a genesis wrapped only to themselves. Without a member set the
//      guard fails closed, so a vault replica must not ingest before the
//      parent's members are known.
//
// An epoch.grant (T9a) is held to the same membership rule, and must name a
// rotate that this replica already holds, with the matching epoch. The grant
// is always a descendant of that rotate in the DAG (its parents are the
// granting device's heads, which already included the rotate), so a
// well-behaved sync delivers the rotate first; an orphan grant is rejected
// like any event whose premise is missing.
//
// Rejection is treated exactly like a bad signature: the event is not
// ingested, not stored, not relayed onward by this replica. The relay itself
// stays dumb (invariant 4) — this check runs client-side in every replica.

import type { ConsentEvent } from '$lib/consent/event';
import { project } from '$lib/consent/projection';
import {
  isEpochRotateEvent,
  isEpochGrantEvent,
  type EpochRotatePredicate,
  type EpochGrantPredicate
} from './e2e/epoch';

export type RotateGuardResult =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: string };

/** What the guard cannot read from the space's own events. */
export type KeyGuardContext = {
  /** Active members of the parent rikma — required for `vault:` spaces. */
  members?: ReadonlySet<string>;
};

/** `project:123` → `123`; null for non-project spaces (bilateral/personal). */
export function projectIdOfSpace(spaceId: string): string | null {
  return spaceId.startsWith('project:') ? spaceId.slice('project:'.length) : null;
}

/** `vault:123` → `123` (the parent rikma); null for every other space. */
export function vaultProjectIdOfSpace(spaceId: string): string | null {
  return spaceId.startsWith('vault:') ? spaceId.slice('vault:'.length) : null;
}

/**
 * Membership, shared by rotate and grant. `allowBootstrap` = the actor may
 * act on a project space whose projection has no members yet.
 */
function checkMembership(
  spaceId: string,
  events: ConsentEvent[],
  actor: string,
  ctx: KeyGuardContext | undefined,
  allowBootstrap: boolean
): RotateGuardResult {
  if (vaultProjectIdOfSpace(spaceId) !== null) {
    const members = ctx?.members;
    if (!members || members.size === 0) return { ok: false, reason: 'vault_members_unknown' };
    return members.has(actor) ? { ok: true } : { ok: false, reason: 'rotate_not_a_member' };
  }

  const projectId = projectIdOfSpace(spaceId);
  if (projectId !== null) {
    const state = project(events, projectId);
    if (state.members.size === 0 && allowBootstrap) return { ok: true };
    if (!state.members.has(actor)) return { ok: false, reason: 'rotate_not_a_member' };
  }
  return { ok: true };
}

export function validateEpochRotate(
  spaceId: string,
  existing: Iterable<ConsentEvent>,
  ev: ConsentEvent,
  ctx?: KeyGuardContext
): RotateGuardResult {
  if (!isEpochRotateEvent(ev)) return { ok: true }; // not ours to judge

  const events = [...existing];

  // 1. Continuity — no forward skips. Same/older epochs pass: race records
  //    (T11) must converge in every replica regardless of arrival order.
  const next = (ev.predicate as unknown as EpochRotatePredicate | undefined)?.epoch;
  if (typeof next !== 'number' || !Number.isInteger(next) || next < 0) {
    return { ok: false, reason: 'rotate_bad_epoch' };
  }
  let current = -1;
  for (const e of events) {
    if (!isEpochRotateEvent(e)) continue;
    const n = (e.predicate as unknown as EpochRotatePredicate).epoch;
    if (n > current) current = n;
  }
  if (next > current + 1) {
    return { ok: false, reason: `rotate_epoch_gap:${current}->${next}` };
  }

  // 2. Membership — project spaces from their own projection, vault spaces
  //    from the parent rikma (ctx). Other spaces (bilateral/personal) skip it.
  return checkMembership(spaceId, events, ev.actor, ctx, true);
}

/** T9a — an epoch.grant may only share a key the space already established. */
export function validateEpochGrant(
  spaceId: string,
  existing: Iterable<ConsentEvent>,
  ev: ConsentEvent,
  ctx?: KeyGuardContext
): RotateGuardResult {
  if (!isEpochGrantEvent(ev)) return { ok: true };

  const events = [...existing];
  const pred = ev.predicate as unknown as EpochGrantPredicate;
  const rotate = events.find((e) => e.id === pred.rotateId);
  if (!rotate || !isEpochRotateEvent(rotate)) return { ok: false, reason: 'grant_unknown_rotate' };
  if ((rotate.predicate as unknown as EpochRotatePredicate).epoch !== pred.epoch) {
    return { ok: false, reason: 'grant_epoch_mismatch' };
  }
  // No bootstrap for grants: there is a rotate, so the space is past genesis.
  return checkMembership(spaceId, events, ev.actor, ctx, false);
}

/** Single entry point for the replica: rotate, grant, or pass-through. */
export function validateKeyEvent(
  spaceId: string,
  existing: Iterable<ConsentEvent>,
  ev: ConsentEvent,
  ctx?: KeyGuardContext
): RotateGuardResult {
  if (isEpochRotateEvent(ev)) return validateEpochRotate(spaceId, existing, ev, ctx);
  if (isEpochGrantEvent(ev)) return validateEpochGrant(spaceId, existing, ev, ctx);
  return { ok: true };
}
