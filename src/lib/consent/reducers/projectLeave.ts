import type { ConsentEvent } from '../event';
import type { ProjectState } from '../projection';

export function projectLeave(state: ProjectState, ev: ConsentEvent): ProjectState {
  if (state.projectId !== ev.subject.id) return state;
  const members = new Set(state.members);
  members.delete(ev.actor);
  return { ...state, members };
}
