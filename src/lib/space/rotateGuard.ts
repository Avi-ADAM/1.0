// T5 — epoch.rotate authorization (HANDOFF_DISTRIBUTED_DB).
//
// Until now ANY identity could publish an epoch.rotate to a space — fine for
// tests and shadow mode, a known security hole before real use. This guard
// closes it deterministically, from the data alone (invariant 7):
//
//   1. Continuity: the rotate's epoch must be exactly current+1 (no skips).
//      A parallel duplicate of the CURRENT epoch is left to the deterministic
//      lowest-event-id race rule (§1 of the handoff / T11), not rejected here.
//   2. Membership: for a `project:<id>` space, the actor must be an active
//      member per the projection at that moment (project.join without a
//      subsequent project.leave). Epoch 0 on a space whose projection has no
//      members yet is allowed — bootstrap: the genesis rotate often precedes
//      the join events it protects.
//
// Rejection is treated exactly like a bad signature: the event is not
// ingested, not stored, not relayed onward by this replica. The relay itself
// stays dumb (invariant 4) — this check runs client-side in every replica.

import type { ConsentEvent } from '$lib/consent/event';
import { project } from '$lib/consent/projection';
import { isEpochRotateEvent, type EpochRotatePredicate } from './e2e/epoch';

export type RotateGuardResult =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: string };

/** `project:123` → `123`; null for non-project spaces (bilateral/personal). */
export function projectIdOfSpace(spaceId: string): string | null {
  return spaceId.startsWith('project:') ? spaceId.slice('project:'.length) : null;
}

export function validateEpochRotate(
  spaceId: string,
  existing: Iterable<ConsentEvent>,
  ev: ConsentEvent
): RotateGuardResult {
  if (!isEpochRotateEvent(ev)) return { ok: true }; // not ours to judge

  const events = [...existing];

  // 1. Continuity — epoch must be current+1.
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
  if (next !== current + 1) {
    return { ok: false, reason: `rotate_epoch_gap:${current}->${next}` };
  }

  // 2. Membership — only for project-scoped spaces with a known member set.
  const projectId = projectIdOfSpace(spaceId);
  if (projectId !== null) {
    const state = project(events, projectId);
    if (state.members.size > 0 && !state.members.has(ev.actor)) {
      return { ok: false, reason: 'rotate_not_a_member' };
    }
  }

  return { ok: true };
}
