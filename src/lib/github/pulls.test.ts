import { describe, it, expect } from 'vitest';
import {
  CLAIM_MAX_HOURS,
  SUGGEST_MAX_HOURS,
  branchIssueNumber,
  claimIntervals,
  claimNote,
  claimOfTimer,
  closingIssueNumbers,
  countedReviews,
  isValidClaimHours,
  loggedHoursFor,
  pullWorkRefs,
  suggestClaimHours,
  toMergedPull
} from './pulls.js';
import { totalHours } from '$lib/timers/intervals.js';

const repo = { owner: 'acme', name: 'widget' };

describe('closingIssueNumbers', () => {
  it('reads the closing keywords GitHub reads', () => {
    expect(closingIssueNumbers('Fixes #12 and closes #3.\nResolved: #40', repo).sort((a, b) => a - b)).toEqual([
      3, 12, 40
    ]);
  });

  it('accepts an owner/repo reference and a URL only for this repository', () => {
    const body =
      'closes acme/widget#7, fixes other/thing#8, resolves https://github.com/acme/widget/issues/9 ' +
      'fix https://github.com/other/thing/issues/10';
    expect(closingIssueNumbers(body, repo).sort((a, b) => a - b)).toEqual([7, 9]);
  });

  it('ignores a mention without a keyword', () => {
    expect(closingIssueNumbers('related to #5, see #6', repo)).toEqual([]);
    expect(closingIssueNumbers(null, repo)).toEqual([]);
  });
});

describe('branchIssueNumber', () => {
  it.each([
    ['12-fix-login', 12],
    ['issue-12', 12],
    ['fix/12', 12],
    ['feature/gh-34-thing', 34],
    ['issues_7', 7]
  ])('%s → %s', (branch, n) => expect(branchIssueNumber(branch)).toBe(n));

  it.each(['main', 'v2-migration', 'release-candidate', 'feature/login'])('%s → null', (branch) =>
    expect(branchIssueNumber(branch)).toBeNull()
  );
});

describe('toMergedPull', () => {
  const json = {
    number: 21,
    title: '  Add the badge ',
    merged_at: '2026-09-10T12:00:00Z',
    body: 'Closes #4',
    head: { ref: '5-badge' },
    user: { id: 99, login: 'dana', type: 'User' },
    additions: 120,
    deletions: 30,
    changed_files: 4
  };

  it('keeps what the claim needs, with the canonical URL', () => {
    const pull = toMergedPull(json, repo)!;
    expect(pull.url).toBe('https://github.com/acme/widget/pull/21');
    expect(pull.title).toBe('Add the badge');
    expect(pull.authorId).toBe('99');
    expect(pull.authorIsBot).toBe(false);
    expect(pull.closes.sort()).toEqual([4, 5]);
  });

  it('is null for a PR that was closed without merging', () => {
    expect(toMergedPull({ ...json, merged_at: null }, repo)).toBeNull();
  });

  it('marks bots', () => {
    expect(toMergedPull({ ...json, user: { id: 1, login: 'dependabot[bot]', type: 'Bot' } }, repo)!.authorIsBot).toBe(
      true
    );
  });

  it('lists the PR and the issues it closes as the refs hours may point at', () => {
    const refs = pullWorkRefs(toMergedPull(json, repo)!);
    expect(refs.map((r) => `${r.kind}:${r.number}`)).toEqual(['pull:21', 'issue:4', 'issue:5']);
  });
});

describe('countedReviews', () => {
  const reviews = [
    { state: 'COMMENTED', user: { id: 2, login: 'a' }, submitted_at: '2026-09-01T00:00:00Z' },
    { state: 'CHANGES_REQUESTED', user: { id: 2, login: 'a' }, submitted_at: '2026-09-02T00:00:00Z' },
    { state: 'APPROVED', user: { id: 2, login: 'a' }, submitted_at: '2026-09-03T00:00:00Z' },
    { state: 'APPROVED', user: { id: 9, login: 'author' }, submitted_at: '2026-09-03T00:00:00Z' },
    { state: 'APPROVED', user: { id: 5, login: 'ci[bot]', type: 'Bot' }, submitted_at: '2026-09-03T00:00:00Z' }
  ];

  it('one review per person, the latest, never the author or a bot, never a bare comment', () => {
    const counted = countedReviews(reviews, '9');
    expect(counted).toHaveLength(1);
    expect(counted[0]).toMatchObject({ reviewerId: '2', state: 'approved' });
  });
});

describe('suggestClaimHours', () => {
  it('is only a suggestion — null without a size, capped, and smaller for a review', () => {
    expect(suggestClaimHours('pull', { additions: null, deletions: null, changedFiles: null })).toBeNull();
    const pull = suggestClaimHours('pull', { additions: 200, deletions: 50, changedFiles: 6 })!;
    const review = suggestClaimHours('review', { additions: 200, deletions: 50, changedFiles: 6 })!;
    expect(pull).toBeGreaterThan(review);
    expect(suggestClaimHours('pull', { additions: 1e9, deletions: 1e9, changedFiles: 1e5 })).toBeLessThanOrEqual(
      SUGGEST_MAX_HOURS
    );
    expect(review).toBeGreaterThanOrEqual(0.25);
  });
});

describe('claimIntervals', () => {
  it('adds up to exactly the claim, ends at the merge, no interval over eight hours', () => {
    const ivs = claimIntervals('2026-09-10T12:00:00.000Z', 19.5);
    expect(totalHours(ivs)).toBeCloseTo(19.5, 5);
    expect(ivs.at(-1)!.stop).toBe('2026-09-10T12:00:00.000Z');
    for (const iv of ivs) expect(Date.parse(iv.stop) - Date.parse(iv.start)).toBeLessThanOrEqual(8 * 3_600_000);
    // chronological, and not overlapping
    for (let i = 1; i < ivs.length; i++) expect(ivs[i].start >= ivs[i - 1].stop).toBe(true);
  });

  it('refuses what is not a claim', () => {
    expect(claimIntervals('2026-09-10T12:00:00Z', 0)).toEqual([]);
    expect(claimIntervals('2026-09-10T12:00:00Z', CLAIM_MAX_HOURS + 1)).toEqual([]);
    expect(claimIntervals('not a date', 2)).toEqual([]);
    expect(isValidClaimHours(Number.NaN)).toBe(false);
  });
});

describe('claimNote', () => {
  it('says what the hours are for, then the member’s own words', () => {
    expect(claimNote('review', { repo: 'widget', number: 3, title: 'Fix' }, ' careful pass ')).toBe(
      'Review widget#3 — Fix\ncareful pass'
    );
  });
});

describe('loggedHoursFor', () => {
  const refs = pullWorkRefs({ owner: 'acme', repo: 'widget', number: 21, closes: [4] });
  const timers = [
    { userId: '7', hours: 2, links: ['https://github.com/acme/widget/pull/21'] },
    { userId: '7', hours: 1.5, links: ['https://github.com/ACME/widget/issues/4#x'] },
    { userId: '7', hours: 3, links: ['https://github.com/acme/widget/issues/5'] },
    { userId: '8', hours: 9, links: ['https://github.com/acme/widget/pull/21'] }
  ];

  it('counts only this member’s hours on the PR or the issues it closes', () => {
    expect(loggedHoursFor(refs, '7', timers)).toBe(3.5);
  });
});

describe('claimOfTimer', () => {
  const url = 'https://github.com/acme/widget/pull/21';
  it('recognises a claim by its first line and its link', () => {
    expect(claimOfTimer('PR widget#21 — Add badge\nlong night', [url])).toEqual({ kind: 'pull', url });
    expect(claimOfTimer('Review widget#21', [url])).toEqual({ kind: 'review', url });
  });
  it('is not fooled by a note that only mentions the PR, or a link to another one', () => {
    expect(claimOfTimer('worked on PR widget#21', [url])).toBeNull();
    expect(claimOfTimer('PR widget#21', ['https://github.com/acme/widget/pull/22'])).toBeNull();
  });
});
