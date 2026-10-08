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
import { hubFeedNotices } from '$lib/notices/hub';
import { loadWishNotices } from '$lib/server/concierge/notices';
import { loadDealNotices } from '$lib/server/deal/dealNotices';
import { loadNoticePrefs } from './prefs';
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

export async function loadMyUpdates(uid: string, fetch: typeof globalThis.fetch, opts: UpdatesOptions): Promise<MyUpdates> {
  const { door, projectId = null, rikma = null, limit = 20 } = opts;
  const lang = noticeLocale(opts.lang);
  const unavailable: string[] = [];

  const reads = startDigestReads(uid, { fetch, door, now: opts.now });
  const prefsPending = loadNoticePrefs(uid, fetch, door);
  const [hub, work, suggestions, whatsNew, wish, deal, prefs] = await Promise.all([
    reads.hub,
    reads.work,
    reads.suggestions,
    reads.whatsNew,
    loadWishNotices(uid, fetch, prefsPending, door),
    loadDealNotices(uid, fetch, prefsPending, door),
    prefsPending
  ]);
  if (hub.error) unavailable.push('rikmaVotes');
  if (work.error) unavailable.push('work');
  if (whatsNew.error) unavailable.push('whatsNew');
  if (suggestions.error) unavailable.push('suggestions');
  if (wish === null) unavailable.push('wishes');
  if (deal === null) unavailable.push('deals');

  const rikmaVotes = applyDismissals(hubFeedNotices(hub.value.feed), prefs.dismissals, opts.now);
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
