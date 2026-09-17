/**
 * Merged pull requests and reviews as work a rikma can be asked to count
 * (PLAN_CODE_RIKMA S4, §4.2). Pure, and safe on the client.
 *
 * **Lines of code never become a share.** A merged PR is not a claim; it is the
 * *occasion* for one. What the rikma signs is hours × the mission's rate, filed
 * through the same approval the timer's hours go through (`Finiapruval`, with
 * the rikma's `restime`). Everything here is either evidence for that claim or
 * a *suggestion* of its size that the member is free to ignore.
 *
 * Two kinds of work, two claimants:
 *  - `pull`   — the PR's author, once it is merged;
 *  - `review` — whoever approved it or asked for changes. Without this the
 *    maintainer who mostly reviews is paid less than whoever mostly writes.
 */

import { githubRefUrl, parseGithubRef, sameGithubRef, type GithubRef } from './refs.js';

export type ContributionKind = 'pull' | 'review';

// ── Which issues a pull request closes ────────────────────────────────────

/**
 * GitHub's closing keywords (`closes #12`, `fixes owner/repo#3`, `resolved
 * https://github.com/o/r/issues/7`). Only issues in the PR's own repository
 * are returned — a keyword aimed at another repository is not this rikma's.
 */
const CLOSING = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b:?\s+((?:[\w.-]+\/[\w.-]+)?#\d{1,9}|https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d{1,9})/gi;

export function closingIssueNumbers(body: unknown, repo: { owner: string; name: string }): number[] {
  if (typeof body !== 'string' || !body) return [];
  const out = new Set<number>();
  for (const m of body.matchAll(CLOSING)) {
    const target = m[1];
    if (target.startsWith('http')) {
      const ref = parseGithubRef(target);
      if (ref && sameGithubRef(ref, { owner: repo.owner, repo: repo.name, kind: 'issue', number: ref.number })) {
        out.add(ref.number);
      }
      continue;
    }
    const [path, num] = target.split('#');
    if (path) {
      const [o, r] = path.split('/');
      if (o.toLowerCase() !== repo.owner.toLowerCase() || r.toLowerCase() !== repo.name.toLowerCase()) continue;
    }
    const n = Number(num);
    if (Number.isSafeInteger(n) && n > 0) out.add(n);
  }
  return [...out];
}

/**
 * The issue a branch is named after — `12-fix-login`, `issue-12`, `fix/12`,
 * `feature/gh-12-x`. A bare number somewhere in the middle (`v2-migration`) is
 * not enough: it has to lead the branch or a path segment, or follow `issue`/`gh`.
 */
export function branchIssueNumber(branch: unknown): number | null {
  if (typeof branch !== 'string') return null;
  const m = /(?:^|\/)(?:(?:issue|issues|gh)[-_]?)?(\d{1,9})(?:[-_]|$)/i.exec(branch);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Every GitHub item a PR's hours may have been logged against: itself and the issues it closes. */
export function pullWorkRefs(pull: {
  owner: string;
  repo: string;
  number: number;
  closes: number[];
}): GithubRef[] {
  const refs: GithubRef[] = [{ owner: pull.owner, repo: pull.repo, kind: 'pull', number: pull.number }];
  for (const n of pull.closes) {
    if (n !== pull.number) refs.push({ owner: pull.owner, repo: pull.repo, kind: 'issue', number: n });
  }
  return refs;
}

// ── A merged pull request, as the code tab and the webhook read it ─────────

export interface PullInfo {
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  authorId: string | null;
  authorLogin: string | null;
  authorIsBot: boolean;
  /** `null` while the PR is open, or when it was closed without merging. */
  mergedAt: string | null;
  closes: number[];
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
}

const TITLE_MAX = 200;

const isBot = (user: any) =>
  user?.type === 'Bot' || /\[bot\]$/i.test(String(user?.login ?? ''));

/** A pull request JSON (REST listing, single fetch, or webhook) → what a claim reads, or `null` when malformed. */
export function toPull(json: any, repo: { owner: string; name: string }): PullInfo | null {
  const number = Number(json?.number);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const closes = new Set(closingIssueNumbers(json.body, repo));
  const fromBranch = branchIssueNumber(json.head?.ref);
  if (fromBranch && fromBranch !== number) closes.add(fromBranch);
  const num = (v: any) => (Number.isFinite(Number(v)) && v != null ? Number(v) : null);
  return {
    owner: repo.owner,
    repo: repo.name,
    number,
    title: String(json.title ?? '').trim().slice(0, TITLE_MAX),
    url: githubRefUrl({ owner: repo.owner, repo: repo.name, kind: 'pull', number }),
    authorId: json.user?.id != null ? String(json.user.id) : null,
    authorLogin: json.user?.login ? String(json.user.login) : null,
    authorIsBot: isBot(json.user),
    mergedAt: json.merged_at ? String(json.merged_at) : null,
    closes: [...closes],
    additions: num(json.additions),
    deletions: num(json.deletions),
    changedFiles: num(json.changed_files)
  };
}

export type MergedPull = PullInfo & { mergedAt: string };

/** Only a merged PR is claimable by its author. */
export function toMergedPull(json: any, repo: { owner: string; name: string }): MergedPull | null {
  const pull = toPull(json, repo);
  return pull?.mergedAt ? (pull as MergedPull) : null;
}

// ── Reviews ────────────────────────────────────────────────────────────────

export interface PullReview {
  reviewerId: string;
  reviewerLogin: string | null;
  state: 'approved' | 'changes_requested';
  submittedAt: string;
}

/**
 * The reviews that count as work: an approval or a request for changes.
 * A bare comment is a conversation, not a review; the PR's own author
 * reviewing their PR is not a second claim; bots do not claim. One entry per
 * reviewer — the latest — so three rounds of "changes requested" by the same
 * person are one review of the PR, and the size of that work is theirs to
 * state.
 */
export function countedReviews(reviews: any[], prAuthorId: string | null): PullReview[] {
  const byReviewer = new Map<string, PullReview>();
  for (const r of Array.isArray(reviews) ? reviews : []) {
    const state = String(r?.state ?? '').toLowerCase();
    if (state !== 'approved' && state !== 'changes_requested') continue;
    if (r?.user?.id == null || isBot(r.user)) continue;
    const reviewerId = String(r.user.id);
    if (prAuthorId && reviewerId === prAuthorId) continue;
    const entry: PullReview = {
      reviewerId,
      reviewerLogin: r.user.login ? String(r.user.login) : null,
      state,
      submittedAt: String(r.submitted_at ?? '')
    };
    const prev = byReviewer.get(reviewerId);
    if (!prev || entry.submittedAt > prev.submittedAt) byReviewer.set(reviewerId, entry);
  }
  return [...byReviewer.values()];
}

// ── The suggested size of a claim ─────────────────────────────────────────

/**
 * A starting figure for the hours field — never the value filed. It grows with
 * the log of the change size, because a 2,000-line PR is rarely ten times the
 * work of a 200-line one (generated files, renames, lockfiles), and is capped
 * so it cannot anchor a negotiation somewhere absurd. `null` when GitHub told
 * us nothing about the size.
 */
export const SUGGEST_MAX_HOURS = 16;

export function suggestClaimHours(
  kind: ContributionKind,
  size: { additions: number | null; deletions: number | null; changedFiles: number | null }
): number | null {
  if (size.additions == null && size.deletions == null) return null;
  const lines = Math.max(0, (size.additions ?? 0) + (size.deletions ?? 0));
  const files = Math.max(0, size.changedFiles ?? 0);
  const base = 0.5 + Math.log10(1 + lines) * 1.5 + Math.min(files, 40) * 0.05;
  const hours = kind === 'review' ? base / 4 : base;
  return Math.min(SUGGEST_MAX_HOURS, Math.max(0.25, Math.round(hours * 4) / 4));
}

// ── Turning a claim into hours on a timer ─────────────────────────────────

/** A claim above this is a conversation to have with the rikma, not one form. */
export const CLAIM_MAX_HOURS = 80;
const CHUNK_HOURS = 8;
const HOUR_MS = 3_600_000;

export function isValidClaimHours(hours: unknown): hours is number {
  return typeof hours === 'number' && Number.isFinite(hours) && hours > 0 && hours <= CLAIM_MAX_HOURS;
}

/**
 * The intervals a claim is recorded as. Hours that were never on a timer still
 * need dates — the approval is filed under the month the work happened, and the
 * time editor refuses an interval over a day — so the claim is laid out
 * backwards from the moment the work landed (the merge, or the review), at most
 * eight hours a day. Rounded to the minute so the total is exactly the claim.
 */
export function claimIntervals(endIso: string, hours: number): { start: string; stop: string }[] {
  const end = Date.parse(endIso);
  if (!Number.isFinite(end) || !isValidClaimHours(hours)) return [];
  const out: { start: string; stop: string }[] = [];
  let left = Math.round(hours * 60);
  for (let day = 0; left > 0; day++) {
    const minutes = Math.min(left, CHUNK_HOURS * 60);
    const stop = end - day * 24 * HOUR_MS;
    out.push({ start: new Date(stop - minutes * 60_000).toISOString(), stop: new Date(stop).toISOString() });
    left -= minutes;
  }
  return out.reverse();
}

/** The note a claim is filed with, so the approval says what the hours are for. */
export function claimNote(kind: ContributionKind, pull: { repo: string; number: number; title: string }, note: string): string {
  const head = `${kind === 'review' ? 'Review' : 'PR'} ${pull.repo}#${pull.number}${pull.title ? ` — ${pull.title}` : ''}`;
  const extra = note.trim();
  return extra ? `${head}\n${extra}` : head;
}

// ── Hours already logged against a contribution ───────────────────────────

export interface LoggedTimer {
  userId: string;
  hours: number;
  links: string[];
}

/**
 * The hours a member has already logged against a PR or the issues it closes,
 * so a claim for the same work is seen before it is filed twice. Only that
 * member's timers count: another member's hours on the same issue are theirs.
 */
export function loggedHoursFor(refs: GithubRef[], userId: string, timers: LoggedTimer[]): number {
  let hours = 0;
  for (const t of timers) {
    if (t.userId !== userId) continue;
    const hit = t.links.some((link) => {
      const ref = parseGithubRef(link);
      return !!ref && refs.some((r) => sameGithubRef(r, ref));
    });
    if (hit) hours += t.hours;
  }
  return Math.round(hours * 100) / 100;
}

/**
 * What a saved timer claims, when it is a claim: the kind and the PR's
 * canonical URL. Read from the note's first line (`PR repo#12 — …` /
 * `Review repo#12 — …`) together with a link to that PR, so an ordinary timer
 * that merely mentions a PR is not mistaken for a claim.
 */
export function claimOfTimer(saveText: unknown, links: string[]): { kind: ContributionKind; url: string } | null {
  if (typeof saveText !== 'string') return null;
  const m = /^(PR|Review) ([A-Za-z0-9._-]{1,100})#(\d{1,9})(?: — |\n|$)/.exec(saveText);
  if (!m) return null;
  const kind: ContributionKind = m[1] === 'Review' ? 'review' : 'pull';
  const number = Number(m[3]);
  for (const link of links) {
    const ref = parseGithubRef(link);
    if (ref && ref.kind === 'pull' && ref.number === number && ref.repo.toLowerCase() === m[2].toLowerCase()) {
      return { kind, url: githubRefUrl(ref) };
    }
  }
  return null;
}
