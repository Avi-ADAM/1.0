import { describe, it, expect } from 'vitest';
import { matchesWorkItem, rankWorkItems, toWorkItem } from './workItems';

const repo = { owner: 'o', name: 'r' };

describe('toWorkItem', () => {
  it('tells a pull request from an issue, and a merge from a close', () => {
    expect(toWorkItem({ number: 1, title: 'Bug', state: 'open', updated_at: '2026-09-01' }, repo)).toMatchObject({
      kind: 'issue',
      state: 'open',
      url: 'https://github.com/o/r/issues/1'
    });
    expect(
      toWorkItem({ number: 2, title: 'Fix', state: 'closed', pull_request: { merged_at: '2026-09-02' } }, repo)
    ).toMatchObject({ kind: 'pull', state: 'merged', url: 'https://github.com/o/r/pull/2' });
    expect(toWorkItem({ number: 3, state: 'closed', pull_request: { merged_at: null } }, repo)).toMatchObject({
      state: 'closed'
    });
  });

  it('refuses an entry without a number', () => {
    expect(toWorkItem({ title: 'x' }, repo)).toBeNull();
  });
});

describe('rankWorkItems', () => {
  it('puts the most recently updated first and caps the list', () => {
    const items = ['2026-09-01', '2026-09-03', '2026-09-02'].map(
      (updated_at, i) => toWorkItem({ number: i + 1, title: 't', updated_at }, repo)!
    );
    expect(rankWorkItems(items).map((i) => i.number)).toEqual([2, 3, 1]);
    expect(rankWorkItems(items, 1)).toHaveLength(1);
  });
});

describe('matchesWorkItem', () => {
  const item = { repo: 'web', number: 42, title: 'Login button does nothing' };

  it('matches by number, with or without # and repo', () => {
    expect(matchesWorkItem(item, '#42')).toBe(true);
    expect(matchesWorkItem(item, '42')).toBe(true);
    expect(matchesWorkItem(item, 'web#42')).toBe(true);
    expect(matchesWorkItem(item, 'api#42')).toBe(false);
    expect(matchesWorkItem(item, '#4')).toBe(false);
  });

  it('matches a title fragment, and everything for an empty query', () => {
    expect(matchesWorkItem(item, 'LOGIN')).toBe(true);
    expect(matchesWorkItem(item, 'signup')).toBe(false);
    expect(matchesWorkItem(item, '  ')).toBe(true);
  });
});
