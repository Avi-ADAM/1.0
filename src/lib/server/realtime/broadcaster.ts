/**
 * Publishes what an action changed to every screen that may show it — the
 * second flow of docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.1, apart from the
 * notifications that talk to people. Socket only, fire-and-forget: an
 * unreachable socket server never fails the action.
 */

import type { ActionContext, RealtimeConfig } from '../actions/types';
import { RT_EVENT, isKnownScope, projectIdsOf, type RealtimeChange } from '$lib/realtime/scopes';

export interface RealtimeDeps {
  /** Member ids of a rikma (the notifier's cached lookup). */
  membersOf: (projectId: string, context: ActionContext) => Promise<string[]>;
  /** Deliver one change to these users' sockets. */
  send: (userIds: string[], change: RealtimeChange, context: ActionContext) => Promise<unknown>;
  warn?: (message: string) => void;
}

export interface RealtimeBroadcaster {
  publish(
    actionKey: string,
    config: RealtimeConfig,
    params: Record<string, any>,
    result: any,
    context: ActionContext
  ): Promise<{ scopes: string[]; userIds: string[] }>;
}

const idOf = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};

/** Who receives the change. The actor is always in — their other devices need it. */
export async function resolveAudience(
  config: RealtimeConfig,
  scopes: string[],
  params: Record<string, any>,
  result: any,
  context: ActionContext,
  membersOf: RealtimeDeps['membersOf']
): Promise<string[]> {
  const ids = new Set<string>();
  const me = idOf(context.userId);
  if (me) ids.add(me);

  const projects = projectIdsOf(scopes);
  const audience = config.audience ?? (projects.length ? 'project' : 'self');

  if (audience === 'project') {
    const lists = await Promise.all(projects.map((pid) => membersOf(pid, context).catch(() => [] as string[])));
    for (const list of lists) for (const id of list) if (idOf(id)) ids.add(String(id));
  } else if (audience === 'parties') {
    for (const id of config.partiesFrom?.(params, result) ?? []) {
      const s = idOf(id);
      if (s) ids.add(s);
    }
  }
  return [...ids];
}

export function createRealtimeBroadcaster(deps: RealtimeDeps): RealtimeBroadcaster {
  const warn = deps.warn ?? ((m: string) => console.warn(m));
  return {
    async publish(actionKey, config, params, result, context) {
      const raw = config.scopes(params, result, context) ?? [];
      const scopes: string[] = [];
      for (const s of raw) {
        if (!isKnownScope(s)) {
          warn(`[realtime] ${actionKey}: dropping unknown scope "${String(s)}"`);
          continue;
        }
        if (!scopes.includes(s)) scopes.push(s);
      }
      if (scopes.length === 0) return { scopes, userIds: [] };

      const userIds = await resolveAudience(config, scopes, params, result, context, deps.membersOf);
      if (userIds.length === 0) return { scopes, userIds };

      const change: RealtimeChange = {
        scopes,
        actionKey,
        ...(context.clientId ? { originClientId: context.clientId } : {}),
        at: new Date().toISOString()
      };
      await deps.send(userIds, change, context);
      return { scopes, userIds };
    }
  };
}

/** What `realtimeFor` needs from the notifier — the member cache and the socket client. */
export interface RealtimeNotifier {
  projectMemberIds(projectId: string, context: ActionContext): Promise<string[]>;
  getSocketIOServer(): {
    broadcast(
      userIds: string[],
      payload: Record<string, unknown>,
      context: ActionContext,
      meetingIds: string[],
      event: 'notification' | 'rt:changed'
    ): Promise<unknown>;
  };
}

/**
 * The broadcaster every ActionService gets: same socket server as the
 * notifications, its own event, and the notifier's cached member lookup for
 * the audience. One wiring for every place that builds an ActionService — the
 * first live test found `/api/action` building its own without it, so no
 * browser-run action published anything.
 */
export function realtimeFor(notifier: RealtimeNotifier): RealtimeBroadcaster {
  return createRealtimeBroadcaster({
    membersOf: (pid, ctx) => notifier.projectMemberIds(pid, ctx),
    send: (userIds, change, ctx) => notifier.getSocketIOServer().broadcast(userIds, { ...change }, ctx, [], RT_EVENT)
  });
}

export { RT_EVENT };
