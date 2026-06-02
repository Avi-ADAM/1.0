import type { ConsentEvent } from '../event';
import type { ProjectState } from '../projection';

export function projectJoin(state: ProjectState, ev: ConsentEvent): ProjectState {
  // subject.id is projectId; if state has no projectId yet, infer.
  const projectId = state.projectId ?? ev.subject.id;
  if (projectId !== ev.subject.id) return state;

  const members = new Set(state.members);
  members.add(ev.actor);
  return { ...state, projectId, members };
}
