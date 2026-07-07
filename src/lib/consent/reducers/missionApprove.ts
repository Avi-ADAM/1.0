import type { ConsentEvent } from '../event';
import type { ProjectState, MissionView } from '../projection';
import { parseMoney, type MoneySerialized } from '$lib/crypto/money';
import { findMissionBySubject } from './missionCreate';

/**
 * mission.approve — the consensus event that credits delivered work
 * (PLAN_rikma_as_state_machine §6, the end-to-end example).
 *
 * predicate shape:
 *   {
 *     payee?: string,                        // contributor; defaults to actor
 *     amount?: { amount: string, code: string }  // MoneySerialized, agorot (D-12)
 *     acceptedHours?, acceptedRate?, ...     // audit trail, not applied here
 *   }
 *
 * Effect on the projection:
 *   1. The payee becomes a member (approval implies membership — same rule
 *      platformRing.ts uses for inner-ring assignment).
 *   2. If a well-formed `amount` is present, the payee's hervachti balance
 *      grows by that many agorot.
 *
 * Quorum validation (was this approval actually backed by enough
 * mission.approve.vote events?) is the verifier's job — commitment.ts checks
 * the attached QuorumProof at ingest. The reducer only applies the transition.
 */
export function missionApprove(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { payee?: unknown; amount?: unknown } | undefined;
  const payee = typeof p?.payee === 'string' ? p.payee : ev.actor;

  const members = new Set(state.members);
  members.add(payee);

  let balances = state.balances;
  const credit = tryParseMoney(p?.amount);
  if (credit !== null) {
    balances = new Map(balances);
    balances.set(payee, (balances.get(payee) ?? 0n) + credit);
  }

  // S2b (T4): close the mission lifecycle too. Tolerates legacy missions with
  // no create/complete event in the chain — approval alone plants a stub.
  let missions = state.missions;
  const mission = findMissionBySubject(state, ev.subject.id);
  const base: MissionView = mission ?? {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    stageIds: [],
    state: 'completed'
  };
  if (base.state !== 'approved') {
    const approvedView: MissionView = {
      ...base,
      state: 'approved',
      approval: { by: ev.actor, ts: ev.ts }
    };
    missions = new Map(missions);
    missions.set(base.id, approvedView);
  }

  return { ...state, members, balances, missions };
}

function tryParseMoney(x: unknown): bigint | null {
  try {
    return parseMoney(x as MoneySerialized).amount;
  } catch {
    return null;
  }
}
