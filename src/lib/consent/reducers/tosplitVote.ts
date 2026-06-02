import type { ConsentEvent } from '../event';
import type { ProjectState, TosplitView } from '../projection';

export function tosplitVote(state: ProjectState, ev: ConsentEvent): ProjectState {
  const view = state.tosplits.get(ev.subject.id);
  if (!view) return state;

  const what = Boolean((ev.predicate as { what?: unknown } | undefined)?.what);
  const votes = new Map(view.votes);
  votes.set(ev.actor, { what, ts: ev.ts, eventId: ev.id });

  const approves: string[] = [];
  for (const [actor, v] of votes) if (v.what) approves.push(actor);

  // Unanimity over current members. If we have no member set yet (early phase),
  // fall back to "approved when at least one approve and no reject".
  let approved: boolean;
  if (state.members.size > 0) {
    approved = [...state.members].every((m) => votes.get(m)?.what === true);
  } else {
    approved = approves.length > 0 &&
      [...votes.values()].every((v) => v.what === true);
  }

  const updated: TosplitView = { ...view, votes, approved };
  const tosplits = new Map(state.tosplits);
  tosplits.set(view.id, updated);
  return { ...state, tosplits };
}
