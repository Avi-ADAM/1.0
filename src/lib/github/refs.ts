/**
 * GitHub issues and pull requests as the rest of 1lev1 names them. Pure, and
 * safe on the client: the timer dialog, the approval cards and the server all
 * read a link the same way (PLAN_CODE_RIKMA §4).
 *
 * Two identities, for two different jobs:
 *
 *  - **the URL** — what a member attaches to a timer (`Timer.saveLinks`) and
 *    what other members click. Always the canonical
 *    `https://github.com/<owner>/<repo>/(issues|pull)/<n>`, so two spellings of
 *    the same PR are one link.
 *  - **the external id** — `gh:<repoId>#<n>`, written on the Act an issue
 *    becomes. It keys on GitHub's numeric repository id rather than the name,
 *    because a repository can be renamed or transferred and the Act must still
 *    be found by the next webhook. The `gh:` prefix is reserved: the External
 *    Tasks API refuses it, so only the GitHub webhook can create one.
 */

export type GithubRefKind = 'issue' | 'pull';

export interface GithubRef {
  owner: string;
  repo: string;
  kind: GithubRefKind;
  number: number;
}

/** GitHub's own limits: owner ≤ 39 chars, repository ≤ 100. */
const REF_PATH = /^\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})\/(issues|pull)\/(\d{1,9})(?:\/.*)?$/;

/**
 * A link → the issue or pull request it points at, or `null` when it is not
 * one. Sub-pages (`/pull/12/files`, `/issues/3#issuecomment-…`) name the same
 * item and are accepted.
 */
export function parseGithubRef(link: unknown): GithubRef | null {
  if (typeof link !== 'string' || !link.trim()) return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.hostname.toLowerCase().replace(/^www\./, '') !== 'github.com') return null;
  const m = REF_PATH.exec(url.pathname);
  if (!m) return null;
  const number = Number(m[4]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return { owner: m[1], repo: m[2], kind: m[3] === 'pull' ? 'pull' : 'issue', number };
}

/** The canonical URL — the one form a ref is ever stored in. */
export function githubRefUrl(ref: GithubRef): string {
  const segment = ref.kind === 'pull' ? 'pull' : 'issues';
  return `https://github.com/${ref.owner}/${ref.repo}/${segment}/${ref.number}`;
}

/** `repo#123` — how GitHub itself writes a reference, minus the owner. */
export function githubRefLabel(ref: GithubRef): string {
  return `${ref.repo}#${ref.number}`;
}

/**
 * Do two refs name the same item? Issues and pull requests share one number
 * sequence per repository, so the kind is not compared; GitHub treats owner
 * and repository names case-insensitively, so neither is this.
 */
export function sameGithubRef(a: GithubRef, b: GithubRef): boolean {
  return (
    a.number === b.number &&
    a.owner.toLowerCase() === b.owner.toLowerCase() &&
    a.repo.toLowerCase() === b.repo.toLowerCase()
  );
}

/** The GitHub items among a list of links, de-duplicated, in order. */
export function githubRefsIn(links: unknown): GithubRef[] {
  if (!Array.isArray(links)) return [];
  const out: GithubRef[] = [];
  for (const link of links) {
    const ref = parseGithubRef(link);
    if (ref && !out.some((r) => sameGithubRef(r, ref))) out.push(ref);
  }
  return out;
}

// ── The external id an issue's Act carries ────────────────────────────────

export const GITHUB_EXTERNAL_PREFIX = 'gh:';

export function githubIssueExternalId(repoId: string | number, number: number): string {
  return `${GITHUB_EXTERNAL_PREFIX}${repoId}#${number}`;
}

export function parseGithubIssueExternalId(
  externalId: unknown
): { repoId: string; number: number } | null {
  if (typeof externalId !== 'string') return null;
  const m = /^gh:(\d{1,20})#(\d{1,9})$/.exec(externalId);
  if (!m) return null;
  const number = Number(m[2]);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return { repoId: m[1], number };
}
