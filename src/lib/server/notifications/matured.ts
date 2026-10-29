/**
 * Telling people what a silence did (docs/inprogress/PLAN_REALTIME_MIGRATION.md
 * §6.5, N5).
 *
 * Silence is consent: when a clock runs out, the version on the table is
 * approved for whoever stayed silent. The timegrama handlers write that
 * outcome straight to Strapi, outside the Action System, so until now the one
 * event that happens *without anybody pressing anything* was also the one
 * nobody heard about — the screens learned of it (B9), the people did not.
 *
 * Each handler calls `tellMatured` at the point it actually matured something
 * (never on a clock it only closed — except to the one person a closed clock
 * is now waiting on, the `…Awaits…` notices), with the rikma or the people concerned,
 * and the same orchestrator every action uses decides the channels from the
 * intent:
 * - `outcome`  — a rikma-wide result (a mission opened, a split settled);
 * - `personal` — about one person, nothing awaited (your hours were approved);
 * - `consent`  — the maturation opened a new round that waits for someone
 *   (an assigned mission offered to its assignee, a dormant mission's release).
 *
 * The person whose silence it was is told too — that is the point.
 */

import type { ActionContext, LanguageStrings, NotificationConfig } from '$lib/server/actions/types';
import type { NotificationIntent } from './intent';

type Id = string | number | null | undefined;

export interface MaturedNotice {
  /** The clock kind (`pendm`, `tosplit`, …) — becomes `metadata.type` `matured:<kind>`. */
  kind: string;
  intent: NotificationIntent;
  /**
   * Every member of a rikma (but `except` — someone told separately, in their
   * own words), or these people. An empty list tells nobody.
   */
  to: { projectId: Id; except?: Id[] } | { userIds: Id[] };
  title: LanguageStrings;
  body: LanguageStrings;
  /** A path on the site — where the reader acts or sees the result. */
  url: string;
}

/** The slice of the orchestrator this needs (a fake in tests). */
export interface MaturedNotifier {
  notify(
    config: NotificationConfig,
    params: Record<string, any>,
    result: any,
    context: ActionContext
  ): Promise<void>;
  /** A rikma's member ids — needed only for `except`. */
  projectMemberIds?(projectId: string, context: ActionContext): Promise<string[]>;
}

const clean = (ids: Id[]): string[] => [
  ...new Set(ids.filter((x) => x != null && String(x).trim() !== '').map(String))
];

/** Who a notice reaches, as a recipient rule plus the result it reads from — null when nobody. */
export function maturedRecipients(
  to: MaturedNotice['to']
): { rule: NotificationConfig['recipients']; result: Record<string, unknown> } | null {
  if ('projectId' in to) {
    if (to.projectId == null || String(to.projectId) === '') return null;
    return {
      rule: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
      result: { projectId: String(to.projectId) }
    };
  }
  const userIds = clean(to.userIds);
  if (userIds.length === 0) return null;
  return {
    rule: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    result: { recipientIds: userIds }
  };
}

/**
 * Tell people what a matured clock did. Never throws: the maturation already
 * happened, and a notice that failed must not reopen the clock.
 */
export async function tellMatured(
  notices: MaturedNotice | MaturedNotice[],
  fetch: typeof globalThis.fetch | undefined,
  notifier?: MaturedNotifier
): Promise<void> {
  for (const notice of Array.isArray(notices) ? notices : [notices]) {
    await tellOne(notice, fetch, notifier);
  }
}

async function tellOne(
  notice: MaturedNotice,
  fetch: typeof globalThis.fetch | undefined,
  notifier?: MaturedNotifier
): Promise<void> {
  if (!fetch) return;
  // No initiator: a clock did this, so nobody is left out as "the sender".
  const context: ActionContext = { userId: '', jwt: '', lang: 'he', fetch };
  try {
    // Loaded lazily: the actions barrel builds the service singletons, which a
    // unit test of this module passes in instead.
    const n = notifier ?? (await import('$lib/server/actions/index.js')).serverNotifier;
    let to = notice.to;
    if ('projectId' in to && to.except?.length) {
      if (to.projectId == null || !n.projectMemberIds) return;
      const skip = new Set(clean(to.except));
      const members = await n.projectMemberIds(String(to.projectId), context);
      to = { userIds: members.filter((m) => !skip.has(String(m))) };
    }
    const who = maturedRecipients(to);
    if (!who) return;
    await n.notify(
      {
        recipients: who.rule,
        templates: { title: notice.title, body: notice.body },
        intent: notice.intent,
        metadata: { priority: notice.intent === 'consent' ? 'high' : 'normal', type: `matured:${notice.kind}`, url: notice.url }
      },
      {},
      who.result,
      context
    );
  } catch (e) {
    console.warn(`[timegrama] notice for ${notice.kind} failed (non-fatal):`, e);
  }
}

/** The rikma's page for a reader who acts from the heart. */
export const levOf = (projectId: Id) => (projectId != null ? `/lev?project=${projectId}` : '/lev');
