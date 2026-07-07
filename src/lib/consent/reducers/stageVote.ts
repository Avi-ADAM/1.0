import type { ConsentEvent } from '../event';
import type { ProjectState, StageVotesView, MissionView } from '../projection';
import { subjectKey } from '../projection';
import { findMissionBySubject } from './missionCreate';

/**
 * Generic staged-consent vote recorder (S2b, T4) — one reducer for
 * pendm.vote / sheirutpend.vote / ask.vote / mission.approve.vote, and the
 * shared tally used by decision.vote for non-saleClaim kinds.
 *
 * predicate shape (addVoteConsentSpec): { what, why?, order? }
 *
 * A vote is recorded even when no create event preceded it: the vote events
 * are already flowing from addVoteConsentSpec today, while most create
 * events only start with S2b — losing the early votes would make legacy
 * subjects unreconstructible.
 *
 * `approved` follows the tosplitVote unanimity rule: every current member
 * voted yes; with no member set yet, at least one yes and no no's.
 */
export function recordStageVote(state: ProjectState, ev: ConsentEvent): ProjectState {
  const key = subjectKey(ev.subject.type, ev.subject.id);
  const prev = state.stageVotes.get(key);

  const p = ev.predicate as { what?: unknown; order?: unknown } | undefined;
  const what = Boolean(p?.what);
  const order = typeof p?.order === 'number' ? p.order : 0;

  const votes = new Map(prev?.votes ?? []);
  votes.set(ev.actor, { what, ts: ev.ts, eventId: ev.id, order });

  let approved: boolean;
  if (state.members.size > 0) {
    approved = [...state.members].every((m) => votes.get(m)?.what === true);
  } else {
    approved =
      [...votes.values()].every((v) => v.what === true) && votes.size > 0;
  }

  const view: StageVotesView = {
    subjectType: ev.subject.type,
    subjectId: ev.subject.id,
    votes,
    approved
  };

  const stageVotes = new Map(state.stageVotes);
  stageVotes.set(key, view);
  return { ...state, stageVotes };
}

/**
 * pendm.vote / ask.vote — besides the tally, a unanimous YES moves the
 * linked mission (found via stageIds or direct id) from pend/proposed to
 * inProgress. sheirutpend.vote and mission.approve.vote only tally here —
 * their transitions ride finalize/approve events.
 */
export function stageVote(state: ProjectState, ev: ConsentEvent): ProjectState {
  const next = recordStageVote(state, ev);

  if (ev.action !== 'pendm.vote' && ev.action !== 'ask.vote') return next;

  const key = subjectKey(ev.subject.type, ev.subject.id);
  const tally = next.stageVotes.get(key);
  if (!tally?.approved) return next;

  const mission = findMissionBySubject(next, ev.subject.id);
  if (!mission) return next;
  if (mission.state !== 'pend' && mission.state !== 'proposed') return next;

  const updated: MissionView = { ...mission, state: 'inProgress' };
  const missions = new Map(next.missions);
  missions.set(mission.id, updated);
  return { ...next, missions };
}
