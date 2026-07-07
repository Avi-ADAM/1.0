import type { ConsentEvent } from '../event';
import type { ProjectState, ForumView, MessageView } from '../projection';

/**
 * forum.create — a chat forum (S2b, T4; mirrors ensureVoteForum & friends).
 *
 * predicate shape: { kind? }  (e.g. 'vote', 'haluka', 'stage'…)
 * Idempotent: re-creating an existing forum only fills in missing metadata —
 * it never drops messages that an implicit stub already collected.
 */
export function forumCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { kind?: unknown } | undefined;
  const prev = state.forums.get(ev.subject.id);

  const view: ForumView = {
    id: ev.subject.id,
    createdBy: prev?.createdBy ?? ev.actor,
    createdAt: prev?.createdAt ?? ev.ts,
    kind: typeof p?.kind === 'string' ? p.kind : prev?.kind,
    messages: prev?.messages ?? []
  };

  const forums = new Map(state.forums);
  forums.set(view.id, view);
  return { ...state, forums };
}

/**
 * message.post — one chat message (S2b, T4; mirrors createChatMessage).
 *
 * SUBJECT IS THE MESSAGE, not the forum: dedupeKey folds events by
 * (actor, subject, action, order), so posting to a forum-subject would
 * swallow every message but the actor's last. The forum id rides the
 * predicate.
 *
 * predicate shape: { forumId, body?, bodyRef?, order }
 *   `body` is deletable free text (HANDOFF T4 deletion policy) — blanked by
 *   payload.redact. `bodyRef` is the reserved S3 content-address field.
 *
 * A post to an unknown forum plants an implicit stub (legacy forums predate
 * the chain). Messages are kept sorted by (ts, id) for determinism.
 */
export function messagePost(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { forumId?: unknown; body?: unknown; bodyRef?: unknown } | undefined;
  const forumId = typeof p?.forumId === 'string' ? p.forumId : undefined;
  if (!forumId) return state; // malformed — ignore silently

  const prev = state.forums.get(forumId);
  const forum: ForumView = prev ?? { id: forumId, messages: [] };

  if (forum.messages.some((m) => m.id === ev.subject.id)) return state; // dupe

  const msg: MessageView = {
    id: ev.subject.id,
    by: ev.actor,
    ts: ev.ts,
    body: typeof p?.body === 'string' ? p.body : undefined,
    bodyRef: typeof p?.bodyRef === 'string' ? p.bodyRef : undefined
  };

  const messages = [...forum.messages, msg].sort(
    (a, b) => a.ts - b.ts || a.id.localeCompare(b.id)
  );

  const forums = new Map(state.forums);
  forums.set(forumId, { ...forum, messages });
  return { ...state, forums };
}
