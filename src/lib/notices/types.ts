/**
 * A notice — one sentence about something that waits for the viewer, instead of
 * the full card (docs/inprogress/PLAN_SMART_NOTICES.md).
 *
 * Everything here is data, never markup and never a resolved string: the module
 * is pure and has no `$t()`, so text travels as `{ text }` (words a person wrote,
 * shown as they are) or `{ key, params }` (a `$t()` lookup the row resolves). A
 * param may itself be a `{ key }` — "a decision in the rikma X: <what the
 * decision is>", where the second half is an existing label.
 */

export type NoticeText = { text: string } | { key: string; params?: Record<string, NoticeParam> };
export type NoticeParam = string | number | NoticeText;

/**
 * A figure the notice states. The kinds that exist in `lev.list.fact.*` render
 * through those keys, so a figure reads the same in a notice and in the list
 * view; the rest live in `notices.term.*`. Every template takes `{{value}}`.
 */
export type TermKind = 'hours' | 'rate' | 'price' | 'qty' | 'amount' | 'raise' | 'round';

export interface NoticeTerm {
  kind: TermKind;
  value: number;
}

export const LEV_FACT_TERMS: ReadonlySet<TermKind> = new Set(['hours', 'rate', 'price', 'qty', 'amount', 'round']);

/** The translation key a term renders through. */
export function termKey(kind: TermKind): string {
  return LEV_FACT_TERMS.has(kind) ? `lev.list.fact.${kind}` : `notices.term.${kind}`;
}

/**
 * Approving from the notice: the action the full card runs, with the params it
 * sends. `terms` is every figure the approval signs — each one must also be in
 * the notice's own `terms`, i.e. on screen (PLAN §3.3; a test holds every
 * builder to it). `round` is the round the notice showed; it travels to the
 * action as `expectRound`, which refuses with ROUND_MOVED when the terms moved
 * since — for the actions in ROUND_GUARDED_ACTIONS. The others ignore it today.
 */
export interface ApproveSpec {
  actionKey: string;
  params: Record<string, unknown>;
  terms: NoticeTerm[];
  round: number | null;
}

/**
 * Actions whose server side refuses terms that moved since the notice showed
 * them — `expectRound` (ROUND_MOVED, `assertStandingRound`), or for
 * `confirmDealPartReceived`, which has no rounds, `expectAmount`
 * (AMOUNT_MOVED). A notice offers one-tap approval only through these; a test
 * holds every builder to it.
 */
export const ROUND_GUARDED_ACTIONS: ReadonlySet<string> = new Set([
  'voteOnAskm',
  'finalizeAskmAcceptance',
  'finalizeAskAcceptance',
  'finalizeJoinAcceptance',
  'addVote',
  'acceptRatsonProposal',
  'acceptWishOffer',
  'signDealEdit',
  'signDealOffer',
  'confirmDealPartReceived'
]);

export type NoticeSource = 'lev' | 'wish' | 'deal';

export type NoticeExpand =
  | { kind: 'href'; href: string }
  /**
   * A heart item. On the heart a host opens it in place (LevSheet) by the id the
   * deck keys it on; anywhere else `href` is the heart filtered to its kind and
   * rikma — the deep link the hub's chips already use.
   */
  | { kind: 'lev'; ani: string; coinlapach: string; href: string };

export interface Notice {
  /**
   * Stable while the terms are the same, different once they move — the
   * dismissal key (PLAN §2). Hiding "5 hours" does not hide the counter of 8.
   */
  key: string;
  /**
   * What the notice is about, whatever the version and whichever page built it
   * — `proposal:<id>` from the concierge and from the heart's `wishoffer` alike —
   * so the same thing is never two rows (`mergeNotices`).
   */
  subject: string;
  source: NoticeSource;
  /** `ani` for heart items, `wishOffer` / `dealEdit` / … for the others. */
  kind: string;
  sentence: NoticeText;
  /** A second line when there is one worth reading — a counter's reason, a description. */
  detail: NoticeText | null;
  terms: NoticeTerm[];
  where: { kind: 'rikma' | 'wish' | 'deal'; id: string; name: string } | null;
  /** When the silence clock (or the deadline) runs out, if there is one. */
  deadline: string | null;
  urgent: boolean;
  /**
   * Silence completes this one when `deadline` passes. Hiding a notice does not
   * stop that clock, and the row has to say so before it hides (PLAN §4).
   * Never true for a customer's signature: her silence is not her yes.
   */
  clockRuns: boolean;
  approve: ApproveSpec | null;
  expand: NoticeExpand;
  /** When it started waiting — the tie-breaker for "longest waiting first". */
  at: string | null;
  /**
   * The viewer hid this one (`dismissNotice`). Kept in the list, not dropped:
   * nothing disappears without a way back ("show hidden").
   */
  hidden?: boolean;
  /**
   * Set by `groupNotices` on a row that stands for several identical ones — the
   * same sentence, figures and place (e.g. three cycles of a recurring expense,
   * each "a report from Asus on delivering 'server cost'"). `groupKeys` are all
   * their keys: hiding the row hides every one of them.
   */
  count?: number;
  groupKeys?: string[];
}

/** A row of `notice-dismissal`, as qid 423 reads it. */
export interface NoticeDismissal {
  noticeKey: string;
  /** null = until the terms move (a new round is a new key). */
  until: string | null;
}

/**
 * Mark the notices the viewer hid. A dismissal with a passed `until` no longer
 * hides; one whose key matches nothing simply never matches (the daily digest
 * cleans those up — there is no invalidation on this path).
 */
export function applyDismissals<T extends Notice>(list: T[], dismissals: NoticeDismissal[], now: number = Date.now()): T[] {
  const active = new Set(
    dismissals
      .filter((d) => !d.until || Date.parse(d.until) > now)
      .map((d) => d.noticeKey)
  );
  return list.map((n) => (active.has(n.key) ? { ...n, hidden: true } : n));
}

/** Plain text, or null when there is none — so `??` chains work. */
export const txt = (v: unknown): NoticeText | null => {
  if (v == null || typeof v === 'object') return null;
  const s = String(v).trim();
  return s ? { text: s } : null;
};

/** A `$t()` lookup. Params with a null/undefined value are dropped. */
export const k = (key: string, params?: Record<string, NoticeParam | null | undefined>): NoticeText => {
  if (!params) return { key };
  const clean: Record<string, NoticeParam> = {};
  for (const [name, value] of Object.entries(params)) if (value != null) clean[name] = value;
  return { key, params: clean };
};

/** Positive finite numbers only; anything else is not a figure worth stating. */
export const pos = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : v == null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const term = (kind: TermKind, value: unknown): NoticeTerm | null => {
  const n = pos(value);
  return n == null ? null : { kind, value: n };
};

/** Drop the empties, keep at most three — a fourth wraps and eats a line. */
export const terms = (...list: (NoticeTerm | null)[]): NoticeTerm[] =>
  list.filter((t): t is NoticeTerm => t !== null).slice(0, 3);

/**
 * A version stamp for things that have no round counter of their own: the
 * figures themselves. A changed figure is a different notice.
 */
export const figuresStamp = (list: NoticeTerm[]): string =>
  list.map((t) => `${t.kind}${t.value}`).join('-') || '0';
