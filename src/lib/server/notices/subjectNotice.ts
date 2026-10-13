/**
 * A notification about a rikma vote, said in full (PLAN_SMART_NOTICES §6.6).
 *
 * The action's own templates say *that* something happened ("a new mission
 * application"); this says *what*: "a request from Dana to join the mission
 * 'Logo design' in the rikma 'Studio Gefen' · 5 hours · 60 per hour — no answer:
 * approved automatically Tue 20:47". The words are the heart's notice view's,
 * read through the same JSON in each recipient's own language — five, where the
 * templates had three — and the two places to answer it travel as links.
 *
 * Never throws and never blocks a send: a failed read leaves the action's
 * template in place.
 */

import {
  resolveNoticeText,
  resolveTerm,
  formatDeadline,
  subjectLinks,
  type NoticeLinks,
  type NoticeSubject
} from '$lib/notices';
import { subjectNoticeFrom, subjectQueryFlags, type SubjectNotice } from '$lib/notices/subject';
import { NOTICE_LOCALES, serverTranslator, type NoticeLocale } from './translate';

/** The slice of StrapiClient this needs (a fake in tests). */
export interface SubjectReader {
  execute(queryId: string, variables: Record<string, any>, userJwt?: string, fetchFn?: typeof fetch): Promise<any>;
}

/**
 * The rikma's clock, said in the rikma's zone. A server has no reader's zone of
 * its own, the user has no zone field, and the platform's rikmas keep Israeli
 * time — a member abroad still reads "Tue 20:47" in that time.
 */
export const NOTICE_TIME_ZONE = 'Asia/Jerusalem';

/** Read one subject and word it; null when the item is gone or the read failed. */
export async function loadSubjectNotice(
  subject: NoticeSubject,
  strapi: SubjectReader,
  opts: { actorName?: string | null; fetch?: typeof fetch } = {}
): Promise<SubjectNotice | null> {
  try {
    // The service token, not the actor's: what the rikma is told about is what
    // its members already see, and a timegrama run has no actor at all.
    const res = await strapi.execute(
      '460noticeSubject',
      { pid: subject.projectId, id: subject.id, ...subjectQueryFlags(subject.kind) },
      undefined,
      opts.fetch
    );
    return subjectNoticeFrom(subject.kind, res?.data, { actorName: opts.actorName });
  } catch (e) {
    console.warn(`[notifications] subject ${subject.kind}:${subject.id} not read (template kept):`, e);
    return null;
  }
}

/** Per-language strings — every locale the notices speak. */
export type LocaleStrings = Record<NoticeLocale, string>;

/**
 * The notification body in every locale: the sentence, the figures on the
 * table, and — when a silence clock runs — when silence completes it.
 */
export function subjectBodies(
  notice: SubjectNotice,
  opts: { clock?: boolean; now?: number } = {}
): LocaleStrings {
  const out = {} as LocaleStrings;
  for (const locale of NOTICE_LOCALES) {
    const t = serverTranslator(locale);
    const lines = [resolveNoticeText(notice.sentence, t, locale)];
    const figures = notice.terms.map((term) => resolveTerm(term, t, locale)).filter(Boolean);
    if (figures.length) lines.push(figures.join(' · '));
    if (opts.clock && notice.deadline) {
      const when = formatDeadline(notice.deadline, locale, opts.now ?? Date.now(), NOTICE_TIME_ZONE);
      if (when) lines.push(t('notices.ui.clock', { when }));
    }
    out[locale] = lines.filter((l) => l && l.trim()).join('\n');
  }
  return out;
}

/** One way to open the item, labelled for its reader. */
export interface NotifyLink {
  /** `rikma` — the rikma's vote page; `lev` — the heart, filtered. */
  kind: 'rikma' | 'lev';
  /** A path on the site. */
  href: string;
  label: LocaleStrings;
}

/**
 * The places to answer it, the first one the default (a tap on the notification
 * itself): the rikma's page for that one vote, where there is one — it loads the
 * single item, fast even from an email — then the heart filtered to its kind and
 * rikma. Each channel offers all of them, so the reader chooses.
 */
export function notifyLinks(links: NoticeLinks | null): NotifyLink[] {
  if (!links) return [];
  const label = (key: string): LocaleStrings => {
    const out = {} as LocaleStrings;
    for (const locale of NOTICE_LOCALES) out[locale] = serverTranslator(locale)(key);
    return out;
  };
  const list: NotifyLink[] = [];
  if (links.rikma) list.push({ kind: 'rikma', href: links.rikma, label: label('notices.notify.openRikma') });
  list.push({ kind: 'lev', href: links.lev, label: label('notices.notify.openLev') });
  return list;
}

/** A subject's links, the decision's card kind refined once the decision was read. */
export function linksFor(subject: NoticeSubject, notice: SubjectNotice | null): NoticeLinks | null {
  if (notice && subject.kind === 'decision' && !subject.ani) return subjectLinks({ ...subject, ani: notice.ani });
  return subjectLinks(subject);
}
