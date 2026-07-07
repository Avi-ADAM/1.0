import type { ConsentEvent } from '../event';
import type { ProjectState, MissionView } from '../projection';

/**
 * mission.create — a signed mission proposal (S2b, HANDOFF T4).
 *
 * One event covers all four creation branches of the createMission action
 * (pendm / open-mission+ask / open / self-assigned): pendm, negopendmission
 * and mesimabetahalich are STATES of this one view, not separate entities
 * (PLAN_serverless_p2p_data §2).
 *
 * predicate shape:
 *   {
 *     name?, hours?, perhour?, assignee?,
 *     branch?: 'pend' | 'ask' | 'open' | 'self',
 *     stageIds?: string[]   // legacy Strapi stage-entity ids (pendm/ask/
 *                           // mesimabetahalich) so stage votes can link back
 *   }
 *
 * Initial state:
 *   - branch 'self' (or assignee === actor)  → 'inProgress' (sovereign)
 *   - branch 'ask'  (or assignee set)        → 'proposed' (awaits the ask)
 *   - otherwise                              → 'pend' (awaits pendm votes)
 */
export function missionCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as
    | { name?: unknown; hours?: unknown; perhour?: unknown; assignee?: unknown;
        branch?: unknown; stageIds?: unknown }
    | undefined;

  const assignee = typeof p?.assignee === 'string' ? p.assignee : undefined;
  const branch = typeof p?.branch === 'string' ? p.branch : undefined;

  let initial: MissionView['state'];
  if (branch === 'self' || (assignee !== undefined && assignee === ev.actor)) {
    initial = 'inProgress';
  } else if (branch === 'ask' || assignee !== undefined) {
    initial = 'proposed';
  } else {
    initial = 'pend';
  }

  const stageIds = Array.isArray(p?.stageIds)
    ? (p!.stageIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  const view: MissionView = {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    name: typeof p?.name === 'string' ? p.name : undefined,
    assignee,
    hours: typeof p?.hours === 'number' ? p.hours : undefined,
    perhour: typeof p?.perhour === 'number' ? p.perhour : undefined,
    stageIds,
    state: initial
  };

  const missions = new Map(state.missions);
  missions.set(view.id, view);
  return { ...state, missions };
}

/**
 * Resolves a subject id to a mission: direct id match first, then a scan
 * over `stageIds` (stage-entity events — pendm.vote, mission.complete on a
 * mesimabetahalich id — carry the stage id, not the mission id).
 */
export function findMissionBySubject(
  state: ProjectState,
  id: string
): MissionView | undefined {
  const direct = state.missions.get(id);
  if (direct) return direct;
  for (const m of state.missions.values()) {
    if (m.stageIds.includes(id)) return m;
  }
  return undefined;
}
