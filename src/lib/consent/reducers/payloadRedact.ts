import type { ConsentEvent } from '../event';
import type { ProjectState, ForumView, MissionView } from '../projection';
import { findMissionBySubject } from './missionCreate';

/**
 * payload.redact — the GDPR tombstone (HANDOFF T4 deletion policy).
 *
 * A signed request to blank deletable free-text content from the projection.
 * The log is never rewritten — the view keeps `redacted: true` and the
 * content disappears from ProjectState. Server mirrors may additionally drop
 * the raw payload; in S3 the content is ciphertext anyway.
 *
 * Subjects handled:
 *   - { type: 'message', id }  → blanks MessageView.body
 *   - { type: 'mission', id }  → blanks MissionView.completion.why
 *
 * Authorization here is the projection-level minimum: only the recorded
 * author of the content may redact it. The full policy (quorum redaction,
 * moderator flows) belongs to ingest/verifier — T5 territory.
 */
export function payloadRedact(state: ProjectState, ev: ConsentEvent): ProjectState {
  if (ev.subject.type === 'message') return redactMessage(state, ev);
  if (ev.subject.type === 'mission') return redactMissionWhy(state, ev);
  return state;
}

function redactMessage(state: ProjectState, ev: ConsentEvent): ProjectState {
  for (const [forumId, forum] of state.forums) {
    const idx = forum.messages.findIndex((m) => m.id === ev.subject.id);
    if (idx === -1) continue;
    const msg = forum.messages[idx];
    if (msg.by !== ev.actor) return state; // only the author may redact
    if (msg.redacted) return state;

    const messages = forum.messages.slice();
    messages[idx] = { id: msg.id, by: msg.by, ts: msg.ts, redacted: true };

    const next: ForumView = { ...forum, messages };
    const forums = new Map(state.forums);
    forums.set(forumId, next);
    return { ...state, forums };
  }
  return state;
}

function redactMissionWhy(state: ProjectState, ev: ConsentEvent): ProjectState {
  const mission = findMissionBySubject(state, ev.subject.id);
  if (!mission?.completion) return state;
  if (mission.completion.by !== ev.actor) return state;
  if (mission.completion.redacted) return state;

  const updated: MissionView = {
    ...mission,
    completion: {
      by: mission.completion.by,
      ts: mission.completion.ts,
      hoursDone: mission.completion.hoursDone,
      redacted: true
    }
  };
  const missions = new Map(state.missions);
  missions.set(mission.id, updated);
  return { ...state, missions };
}
