import type { ConsentEvent } from '../event';
import type { ProjectState, MeetingView } from '../projection';

/**
 * pgisha.create — a proposed meeting (S2b, T4; mirrors createNewMeeting).
 *
 * predicate shape: { date?, name? }
 */
export function meetingCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { date?: unknown; name?: unknown } | undefined;

  const view: MeetingView = {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    date: typeof p?.date === 'string' ? p.date : undefined,
    name: typeof p?.name === 'string' ? p.name : undefined,
    approvals: new Set([ev.actor]) // proposing is the proposer's own approval
  };

  const meetings = new Map(state.meetings);
  meetings.set(view.id, view);
  return { ...state, meetings };
}

/**
 * pgisha.approve — a member's approval of a proposed meeting (mirrors
 * approveMeeting). Ignored for unknown meetings.
 */
export function meetingApprove(state: ProjectState, ev: ConsentEvent): ProjectState {
  const view = state.meetings.get(ev.subject.id);
  if (!view) return state;
  if (view.approvals.has(ev.actor)) return state;

  const approvals = new Set(view.approvals);
  approvals.add(ev.actor);

  const meetings = new Map(state.meetings);
  meetings.set(view.id, { ...view, approvals });
  return { ...state, meetings };
}
