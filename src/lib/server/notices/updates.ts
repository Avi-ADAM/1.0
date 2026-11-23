/**
 * "What's new, what waits for me, what is happening in rikma X" — in one read,
 * for an agent to answer in words (the MCP tool `getMyUpdates`, the site's chat).
 * docs/inprogress/PLAN_SMART_NOTICES.md §6.6.
 *
 * Nothing new is computed here. It is the same lists the pages show:
 *   - waiting: the hub's votes (85 / its twin), the concierge's proposals and the
 *     deals' signatures — as notices, merged and folded like the hub's list, the
 *     ones she hid left out (and counted);
 *   - work: her missions and tasks, from the daily digest's reads;
 *   - whatsNew / suggestions: the digest's "new in your rikmot since yesterday"
 *     and the open matches for her.
 * Every sentence is resolved in the reader's language, on the server.
 */

import { startDigestReads } from '$lib/server/digest/collect';
import type { WhatsNewSummary } from '$lib/digest/whatsNew.js';
import type { WorkSummary } from '$lib/digest/work.js';
import {
  applyDismissals,
  groupNotices,
  mergeNotices,
  resolveNoticeText,
  resolveTerm,
  type Notice
} from '$lib/notices';
import { hubAskNotices, hubFeedNotices } from '$lib/notices/hub';
import { taskNotices } from '$lib/notices/task';
import { taskOf, type TaskRow } from '$lib/acts/agentTasks';
import { sendToSer } from '$lib/send/sendToSer.js';
import { loadWishNotices } from '$lib/server/concierge/notices';
import { loadDealNotices } from '$lib/server/deal/dealNotices';
import { loadNoticePrefsChecked } from './prefs';
import { userRead } from './door';
import { serverTranslator, noticeLocale, type NoticeLocale } from './translate';
import type { NoticeDoor } from './door';
import { SITE_ORIGIN } from '$lib/server/mcp/keyDiagnosis';

export interface UpdateRow {
  /** One sentence in the reader's language — what it is, who, where. */
  sentence: string;
  /** A second line when there is one: a counter's reason, a description. */
  details: string | null;
  /** The figures it is about, worded ("6 hours", "price 400"). */
  figures: string[];
  /** rikma / wish / deal. */
  where: { kind: 'rikma' | 'wish' | 'deal'; id: string; name: string } | null;
  /** The rikma it belongs to, or null (a wish, a deal) — what a scoped key filters on. */
  projectId: string | null;
  /** When silence decides it, or its deadline. */
  deadline: string | null;
  urgent: boolean;
  /** True ⇒ with no answer by `deadline`, it is approved automatically. */
  silenceApproves: boolean;
  /** How many identical items this row stands for (three cycles of one expense…). */
  count: number;
  /** Where to answer it — approving, countering and talking happen on the site. */
  link: string;
}

export interface MyUpdates {
  lang: NoticeLocale;
  waiting: UpdateRow[];
  /** Before `limit`. */
  totalWaiting: number;
  /** Things she hid from her notices — left out, not gone. */
  hiddenCount: number;
  work: WorkSummary;
  whatsNew: WhatsNewSummary;
  suggestions: { count: number; fresh: number };
  /** Parts that could not be read — say so instead of claiming they are empty. */
  unavailable: string[];
}

export interface UpdatesOptions {
  door: NoticeDoor;
  lang?: unknown;
  /** One rikma, by id. */
  projectId?: string | null;
  /** Rikmas whose name contains this text (case-insensitive). */
  rikma?: string | null;
  limit?: number;
  now?: number;
}

const ISOLATES = /[⁨⁩]/g;

function inScope(n: Notice, projectId?: string | null, rikma?: string | null): boolean {
  if (projectId) return n.where?.kind === 'rikma' && String(n.where.id) === String(projectId);
  if (rikma) {
    const needle = rikma.trim().toLowerCase();
    return !!needle && n.where?.kind === 'rikma' && n.where.name.toLowerCase().includes(needle);
  }
  return true;
}

/** Pure: notices → rows in a language. Exported for tests. */
export function toUpdateRows(list: Notice[], lang: unknown): UpdateRow[] {
  const t = serverTranslator(lang);
  const locale = noticeLocale(lang);
  const plain = (s: string) => s.replace(ISOLATES, '');
  return list.map((n) => {
    const href = n.expand.href;
    return {
      sentence: plain(resolveNoticeText(n.sentence, t, locale)),
      details: n.detail ? plain(resolveNoticeText(n.detail, t, locale)) || null : null,
      figures: n.terms.map((term) => resolveTerm(term, t, locale)),
      where: n.where,
      projectId: n.where?.kind === 'rikma' ? String(n.where.id) : null,
      deadline: n.deadline,
      urgent: n.urgent,
      silenceApproves: n.clockRuns,
      count: n.count ?? 1,
      link: href.startsWith('http') ? href : `${SITE_ORIGIN}${href}`
    };
  });
}

/**
 * Tasks waiting for her yes or her check (PLAN_AGENT_WORK AW1), as notices. The
 * read is `serviceAdmin` keyed to `uid`, which every caller of loadMyUpdates
 * already verified (the session, or the MCP key's owner). Never rejects: a
 * failed read answers null, named in `unavailable`.
 */
export async function loadTaskNotices(uid: string, fetch: typeof globalThis.fetch, now?: number): Promise<Notice[] | null> {
  try {
    const raw: any = await sendToSer({ uid: String(uid), limit: 150 }, 'agentTasksFor', 0, 0, true, fetch);
    if (!raw || raw.errors?.length || !raw.data) return null;
    const rows = (raw.data.acts?.data ?? []).map(taskOf).filter((t: TaskRow | null): t is TaskRow => !!t);
    return taskNotices(rows, String(uid), now);
  } catch {
    return null;
  }
}

/**
 * Mission candidacies waiting for her (qid 461 / its twin 462), as notices. A read
 * of its own: when it fails, the other votes still load and this answers null,
 * which the caller names in `unavailable`. Never rejects.
 */
export async function loadAskNotices(
  uid: string,
  fetch: typeof globalThis.fetch,
  door: NoticeDoor,
  now?: number
): Promise<Notice[] | null> {
  try {
    const raw: any = await userRead(door, uid, '461hubAsks', fetch);
    if (!raw || raw.errors?.length || !raw.data) return null;
    return hubAskNotices(raw, uid, now);
  } catch {
    return null;
  }
}

export async function loadMyUpdates(uid: string, fetch: typeof globalThis.fetch, opts: UpdatesOptions): Promise<MyUpdates> {
  const { door, projectId = null, rikma = null, limit = 20 } = opts;
  const lang = noticeLocale(opts.lang);
  const unavailable: string[] = [];

  const reads = startDigestReads(uid, { fetch, door, now: opts.now });
  const prefsChecked = loadNoticePrefsChecked(uid, fetch, door);
  const prefsPending = prefsChecked.then((p) => p.prefs);
  const [hub, work, suggestions, whatsNew, wish, deal, prefsRead, asks, tasks] = await Promise.all([
    reads.hub,
    reads.work,
    reads.suggestions,
    reads.whatsNew,
    loadWishNotices(uid, fetch, prefsPending, door),
    loadDealNotices(uid, fetch, prefsPending, door),
    prefsChecked,
    loadAskNotices(uid, fetch, door, opts.now),
    loadTaskNotices(uid, fetch, opts.now)
  ]);
  const prefs = prefsRead.prefs;
  if (hub.error) unavailable.push('rikmaVotes');
  if (asks === null) unavailable.push('missionApplications');
  if (tasks === null) unavailable.push('tasks');
  if (work.error) unavailable.push('work');
  if (whatsNew.error) unavailable.push('whatsNew');
  if (suggestions.error) unavailable.push('suggestions');
  if (wish === null) unavailable.push('wishes');
  if (deal === null) unavailable.push('deals');
  // What she hid could not be read, so hidden notices may show again.
  if (!prefsRead.ok) unavailable.push('hiddenNotices');

  const rikmaVotes = applyDismissals(
    [...hubFeedNotices(hub.value.feed), ...(asks ?? []), ...(tasks ?? [])],
    prefs.dismissals,
    opts.now
  );
  const all = groupNotices(mergeNotices(wish ?? [], deal ?? [], rikmaVotes)).filter((n) =>
    inScope(n, projectId, rikma)
  );
  const visible = all.filter((n) => !n.hidden);

  // Work items belong to rikmas too: a question about one rikma gets that rikma's.
  const scoped = <T extends { projectId: string; projectName: string }>(items: T[]) =>
    items.filter((i) =>
      projectId
        ? String(i.projectId) === String(projectId)
        : rikma
          ? i.projectName.toLowerCase().includes(rikma.trim().toLowerCase())
          : true
    );

  return {
    lang,
    waiting: toUpdateRows(visible.slice(0, Math.max(1, limit)), lang),
    totalWaiting: visible.length,
    hiddenCount: all.length - visible.length,
    work: {
      missions: { ...work.value.missions, dormantSoon: scoped(work.value.missions.dormantSoon) },
      tasks: { ...work.value.tasks, items: scoped(work.value.tasks.items) }
    },
    whatsNew: whatsNew.value,
    suggestions: { count: suggestions.value.count, fresh: suggestions.value.fresh },
    unavailable
  };
}
