/**
 * Where a notification about a rikma vote takes its reader — both places it can
 * be answered, so the reader picks (docs/inprogress/PLAN_SMART_NOTICES.md §6.6):
 *
 * - **the heart**, filtered to that kind in that rikma — `/lev?focus=<ani>&project=<id>`,
 *   the deep link the hub's chips and notices already use;
 * - **the rikma's vote page** for that one item — `/moach/<id>/votes/<kind>/<id>`,
 *   which loads the single entity and nothing else (fast from an email, too).
 *
 * Pure: the orchestrator, the notices and the tests share it, so a link can never
 * be spelled two ways.
 */

/** The kinds the rikma's vote page renders (`src/params/votekind.js`). */
export const VOTE_KINDS = ['pendm', 'pmash', 'ask', 'askm', 'tosplit', 'decision', 'fini'] as const;
export type VoteKind = (typeof VOTE_KINDS)[number];

/** A vote kind, or a delivery report (`maap`) — answered in the heart only. */
export type SubjectKind = VoteKind | 'maap';

/** What a notification is about: one item that waits for the rikma's answer. */
export interface NoticeSubject {
  kind: SubjectKind;
  id: string;
  projectId: string;
  /** The heart card kind(s), when the caller knows better than the default (`ANI_OF`). */
  ani?: string;
}

/**
 * The heart card kind each subject renders as — its `?focus=` value. A decision
 * is one of three cards depending on what it decides; until the decision itself
 * is read, the link shows all three (the heart's focus takes a comma list).
 */
export const ANI_OF: Readonly<Record<SubjectKind, string>> = {
  pendm: 'pends',
  pmash: 'pmashes',
  ask: 'askedcoin',
  askm: 'askedm',
  fini: 'fiapp',
  tosplit: 'haluk',
  decision: 'hachla,archObject,stipend',
  maap: 'wegets'
};

/** The heart card a decision of this `kind` renders as. */
export function decisionAni(kind: string | null | undefined): string {
  if (kind === 'archiveObject' || kind === 'editObject') return 'archObject';
  if (kind === 'stipendPledge' || kind === 'stipendProgram') return 'stipend';
  return kind ? 'hachla' : ANI_OF.decision;
}

const isVoteKind = (k: string): k is VoteKind => (VOTE_KINDS as readonly string[]).includes(k);

/** The heart, filtered to these card kinds (and to one rikma when given). */
export function levFocusHref(focus: string, projectId?: string | number | null): string {
  const project = projectId != null && String(projectId) !== '' ? `&project=${encodeURIComponent(String(projectId))}` : '';
  return `/lev?focus=${encodeURIComponent(focus)}${project}`;
}

/** The rikma's page for one vote. */
export function voteHref(projectId: string | number, kind: VoteKind, id: string | number): string {
  return `/moach/${projectId}/votes/${kind}/${id}`;
}

export interface NoticeLinks {
  /** The rikma's vote page for this item; null for what has none (a delivery report). */
  rikma: string | null;
  /** The heart, filtered to this kind in this rikma. */
  lev: string;
}

/** A subject's two destinations — null when it is missing an id or a rikma. */
export function subjectLinks(subject: NoticeSubject | null | undefined): NoticeLinks | null {
  if (!subject) return null;
  const id = String(subject.id ?? '').trim();
  const projectId = String(subject.projectId ?? '').trim();
  if (!id || !projectId) return null;
  return {
    rikma: isVoteKind(subject.kind) ? voteHref(projectId, subject.kind, id) : null,
    lev: levFocusHref(subject.ani || ANI_OF[subject.kind], projectId)
  };
}

/**
 * A subject from loose ids — params and results carry them as numbers, strings
 * or not at all. Null when either is missing, so a config can write
 * `subject: (p, r) => noticeSubject('ask', r?.data?.askId, p.projectId)` and an
 * empty run simply has no subject.
 */
export function noticeSubject(
  kind: SubjectKind,
  id: unknown,
  projectId: unknown,
  ani?: string
): NoticeSubject | null {
  const sid = id == null ? '' : String(id).trim();
  const pid = projectId == null ? '' : String(projectId).trim();
  if (!sid || !pid || sid === 'undefined' || pid === 'undefined') return null;
  return ani ? { kind, id: sid, projectId: pid, ani } : { kind, id: sid, projectId: pid };
}
