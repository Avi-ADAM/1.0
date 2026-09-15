import { describe, it, expect } from 'vitest';
import {
  githubIssueExternalId,
  githubRefLabel,
  githubRefsIn,
  githubRefUrl,
  parseGithubIssueExternalId,
  parseGithubRef,
  sameGithubRef
} from './refs.js';

describe('parseGithubRef', () => {
  it('reads a pull request and an issue', () => {
    expect(parseGithubRef('https://github.com/Avi-ADAM/1.0/pull/482')).toEqual({
      owner: 'Avi-ADAM',
      repo: '1.0',
      kind: 'pull',
      number: 482
    });
    expect(parseGithubRef('https://github.com/o/r/issues/7')).toMatchObject({ kind: 'issue', number: 7 });
  });

  it('accepts sub-pages and anchors of the same item', () => {
    expect(parseGithubRef('https://www.github.com/o/r/pull/12/files')).toMatchObject({ number: 12 });
    expect(parseGithubRef('https://github.com/o/r/issues/3#issuecomment-1')).toMatchObject({ number: 3 });
  });

  it.each([
    'https://github.com/o/r',
    'https://github.com/o/r/commit/abc',
    'https://github.com/o/r/pull/0',
    'https://gitlab.com/o/r/-/issues/1',
    'https://github.com.evil.com/o/r/pull/1',
    'javascript:alert(1)',
    'not a url',
    null
  ])('is null for %s', (value) => {
    expect(parseGithubRef(value)).toBeNull();
  });
});

describe('githubRefUrl / githubRefLabel', () => {
  it('writes the canonical form, whatever spelling came in', () => {
    const ref = parseGithubRef('https://www.github.com/o/r/pull/12/files')!;
    expect(githubRefUrl(ref)).toBe('https://github.com/o/r/pull/12');
    expect(githubRefLabel(ref)).toBe('r#12');
    expect(parseGithubRef(githubRefUrl(ref))).toEqual(ref);
  });
});

describe('sameGithubRef / githubRefsIn', () => {
  it('ignores case and kind — issues and PRs share one number sequence', () => {
    const a = parseGithubRef('https://github.com/Owner/Repo/issues/5')!;
    const b = parseGithubRef('https://github.com/owner/repo/pull/5')!;
    expect(sameGithubRef(a, b)).toBe(true);
  });

  it('keeps only GitHub items, once each', () => {
    const refs = githubRefsIn([
      'https://1lev1.com/x',
      'https://github.com/o/r/pull/1',
      'https://github.com/o/r/pull/1/files',
      'https://github.com/o/r/issues/2'
    ]);
    expect(refs.map((r) => r.number)).toEqual([1, 2]);
  });
});

describe('issue external id', () => {
  it('round-trips and refuses anything else', () => {
    expect(githubIssueExternalId('123456', 42)).toBe('gh:123456#42');
    expect(parseGithubIssueExternalId('gh:123456#42')).toEqual({ repoId: '123456', number: 42 });
    expect(parseGithubIssueExternalId('gh:o/r#42')).toBeNull();
    expect(parseGithubIssueExternalId('site-report:1')).toBeNull();
    expect(parseGithubIssueExternalId(undefined)).toBeNull();
  });
});
