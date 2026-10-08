/**
 * Smart notices — docs/inprogress/PLAN_SMART_NOTICES.md.
 *
 * Pure: sentences are `{ key, params }` for `$t()`, built from data the pages
 * already load. No AI on this path — every sentence is a template, and a
 * figure such as "add 3 hours" is arithmetic over the rounds, not language.
 */

export * from './types';
export { wishNotice, wishNotices, type WishNoticeInput, type WishNegotiationLike } from './wish';
export { dealNotices, type DealNoticeInput } from './deal';
export { levNotice, levNotices } from './lev';
export { resolveNoticeText, resolveTerm, formatDeadline, type Translate } from './render';
export { EMPTY_PREFS, readNoticePrefs, type NoticePrefs } from './prefs';

import type { Notice } from './types';

/**
 * Most pressing first: urgent, then the nearest deadline, then whatever has
 * waited longest — the hub feed's order (`compareFeedItems`), on notices.
 */
export function compareNotices(a: Notice, b: Notice): number {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  const ad = a.deadline ? Date.parse(a.deadline) : Infinity;
  const bd = b.deadline ? Date.parse(b.deadline) : Infinity;
  if (ad !== bd) return (Number.isFinite(ad) ? ad : Infinity) - (Number.isFinite(bd) ? bd : Infinity) || 0;
  const aa = a.at ? Date.parse(a.at) : Infinity;
  const ba = b.at ? Date.parse(b.at) : Infinity;
  return (Number.isFinite(aa) ? aa : Infinity) - (Number.isFinite(ba) ? ba : Infinity) || 0;
}

/**
 * The same thing twice — a wish offer seen from the heart (`wishoffer`) and
 * from the concierge, a candidacy on a customer's part seen from the heart and
 * from the deal — would be two rows. Keep the first of each `subject`, so pass
 * the richer source first (`mergeNotices(wish, deal, lev)`: the concierge knows
 * the round and whose move it is, the heart's item does not), then sort.
 */
/**
 * Fold identical rows into one, keeping the first's place. A heart can hold
 * several items that read the same — three cycles of one recurring expense are
 * three "report from Asus on delivering 'server cost'" — and three equal lines
 * read as a bug, not as three things. The row says how many (`count`), and
 * hiding it hides all of them (`groupKeys`).
 */
export function groupNotices(list: Notice[]): Notice[] {
  const out: Notice[] = [];
  const byIdentity = new Map<string, Notice>();
  for (const n of list) {
    // Something to sign is never folded into a pile: which one would "approve" sign?
    if (n.approve) {
      out.push(n);
      continue;
    }
    const id = JSON.stringify([n.kind, n.sentence, n.terms, n.where?.id ?? null, !!n.hidden]);
    const head = byIdentity.get(id);
    if (head) {
      head.count = (head.count ?? 1) + 1;
      head.groupKeys = [...(head.groupKeys ?? [head.key]), n.key];
      continue;
    }
    const copy = { ...n };
    byIdentity.set(id, copy);
    out.push(copy);
  }
  return out;
}

export function mergeNotices(...lists: Notice[][]): Notice[] {
  const seen = new Set<string>();
  const out: Notice[] = [];
  for (const n of lists.flat()) {
    if (seen.has(n.subject)) continue;
    seen.add(n.subject);
    out.push(n);
  }
  return out.sort(compareNotices);
}
