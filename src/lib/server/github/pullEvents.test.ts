import { describe, it, expect } from 'vitest';
import { classifyWebhook } from './events';

const base = {
  installation: { id: 555 },
  repository: { id: 42, name: 'widget', full_name: 'acme/widget', owner: { login: 'acme' } }
};
const pr = {
  number: 21,
  title: 'Add badge',
  merged_at: '2026-09-10T12:00:00Z',
  body: 'Fixes #4',
  head: { ref: 'badge' },
  user: { id: 99, login: 'dana', type: 'User' }
};

describe('classifyWebhook — pull requests (S4)', () => {
  it('a merged PR is claimable work for its author', () => {
    const intent = classifyWebhook('pull_request', { ...base, action: 'closed', pull_request: pr });
    expect(intent.type).toBe('claimableWork');
    if (intent.type !== 'claimableWork') return;
    expect(intent.work).toMatchObject({
      kind: 'pull',
      installationId: '555',
      repoId: '42',
      workerGithubId: '99',
      at: '2026-09-10T12:00:00Z'
    });
    expect(intent.work.pull.closes).toEqual([4]);
  });

  it('ignores a PR closed without merging, one merged by a bot, and every other action', () => {
    expect(classifyWebhook('pull_request', { ...base, action: 'closed', pull_request: { ...pr, merged_at: null } }).type).toBe(
      'ignored'
    );
    expect(
      classifyWebhook('pull_request', {
        ...base,
        action: 'closed',
        pull_request: { ...pr, user: { id: 1, login: 'dependabot[bot]', type: 'Bot' } }
      }).type
    ).toBe('ignored');
    expect(classifyWebhook('pull_request', { ...base, action: 'opened', pull_request: pr }).type).toBe('ignored');
  });
});

describe('classifyWebhook — reviews (S4)', () => {
  const review = (state: string, id = 7) => ({
    ...base,
    action: 'submitted',
    pull_request: { ...pr, merged_at: null },
    review: { state, user: { id, login: 'rev' }, submitted_at: '2026-09-09T08:00:00Z' }
  });

  it('an approval or a change request is claimable work for the reviewer, even before the merge', () => {
    for (const state of ['approved', 'changes_requested']) {
      const intent = classifyWebhook('pull_request_review', review(state));
      expect(intent.type).toBe('claimableWork');
      if (intent.type !== 'claimableWork') continue;
      expect(intent.work).toMatchObject({ kind: 'review', workerGithubId: '7', at: '2026-09-09T08:00:00Z' });
    }
  });

  it('a comment, or the author reviewing their own PR, is not', () => {
    expect(classifyWebhook('pull_request_review', review('commented')).type).toBe('ignored');
    expect(classifyWebhook('pull_request_review', review('approved', 99)).type).toBe('ignored');
  });
});
