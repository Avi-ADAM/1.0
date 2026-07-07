import type { ConsentEvent } from '../event';
import type { ProjectState, AwayMark } from '../projection';

/**
 * project.create — genesis of a project's chain (S2b, T4). Binds the
 * projectId, seats the creator as the first member, and seeds any declared
 * settings (same path/value vocabulary as project.amend).
 *
 * predicate shape: { settings?: Record<string, unknown> }
 */
export function projectCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const projectId = state.projectId ?? ev.subject.id;
  if (projectId !== ev.subject.id) return state; // event for another project

  const members = new Set(state.members);
  members.add(ev.actor);

  let settings = state.settings;
  const p = ev.predicate as { settings?: unknown } | undefined;
  if (p?.settings && typeof p.settings === 'object' && !Array.isArray(p.settings)) {
    settings = new Map(settings);
    for (const [k, v] of Object.entries(p.settings as Record<string, unknown>)) {
      settings.set(k, v);
    }
  }

  return { ...state, projectId, members, settings };
}

/**
 * project.amend — a value.set on project settings (restime, name, joinPolicy…).
 * Matches the Delta 'value.set' vocabulary already declared in event.ts.
 *
 * predicate shape: { path: string, value: unknown }
 */
export function projectAmend(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { path?: unknown; value?: unknown } | undefined;
  if (typeof p?.path !== 'string' || p.path.length === 0) return state;

  const settings = new Map(state.settings);
  settings.set(p.path, p?.value);
  return { ...state, settings };
}

/**
 * member.away — the actor's own declaration of temporary absence
 * (PLAN_restime: away members are excluded from silence-is-consent counting).
 *
 * predicate shape: { until?: number, back?: boolean }
 *   `back: true` clears the mark; otherwise plants { since: ev.ts, until? }.
 * Only self-declarations count — the subject is informational, the actor is
 * the authority on their own presence.
 */
export function memberAway(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { until?: unknown; back?: unknown } | undefined;

  const away = new Map(state.away);
  if (p?.back === true) {
    if (!away.delete(ev.actor)) return state;
  } else {
    const mark: AwayMark = { since: ev.ts };
    if (typeof p?.until === 'number') mark.until = p.until;
    away.set(ev.actor, mark);
  }
  return { ...state, away };
}
