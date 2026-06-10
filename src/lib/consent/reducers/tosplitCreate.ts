import type { ConsentEvent } from '../event';
import type { ProjectState, TosplitView } from '../projection';
import { subjectKey } from '../projection';

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

  // Round 0 starts at creation (PLAN_restime §3). Subsequent counters bump it.
  const rounds = new Map(state.rounds);
  rounds.set(subjectKey(ev.subject.type, ev.subject.id), {
    current: 0,
    start: ev.ts
  });

  return { ...state, tosplits, rounds };
}
