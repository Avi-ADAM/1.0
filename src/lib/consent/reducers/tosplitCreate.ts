import type { ConsentEvent } from '../event';
import type { ProjectState, TosplitView } from '../projection';

export function tosplitCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const tosplits = new Map(state.tosplits);
  const view: TosplitView = {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    predicate: ev.predicate,
    votes: new Map(),
    approved: false
  };
  tosplits.set(ev.subject.id, view);
  return { ...state, tosplits };
}
