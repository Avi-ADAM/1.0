import type { ConsentEvent } from '../event';
import type { ProjectState, MissionView } from '../projection';
import { findMissionBySubject } from './missionCreate';

/**
 * mission.complete — the worker's signed completion report (S2b, T4).
 *
 * predicate shape: { hoursDone?, why? }
 *   `why` is deletable free text (HANDOFF T4 deletion policy) — it lives in
 *   `completion.why` so payload.redact can blank it.
 *
 * Effect: mission state → 'completed' with a completion mark. Legacy missions
 * that predate the chain have no mission.create event — a stub view is
 * planted so the report is never lost (same tolerance saleRecord shows).
 * An already-approved mission is left untouched (stale report).
 */
export function missionComplete(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { hoursDone?: unknown; why?: unknown } | undefined;

  const existing = findMissionBySubject(state, ev.subject.id);
  if (existing?.state === 'approved') return state;

  const base: MissionView = existing ?? {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    stageIds: [],
    state: 'inProgress'
  };

  const updated: MissionView = {
    ...base,
    state: 'completed',
    completion: {
      by: ev.actor,
      ts: ev.ts,
      hoursDone: typeof p?.hoursDone === 'number' ? p.hoursDone : undefined,
      why: typeof p?.why === 'string' ? p.why : undefined
    }
  };

  const missions = new Map(state.missions);
  missions.set(base.id, updated);
  return { ...state, missions };
}
