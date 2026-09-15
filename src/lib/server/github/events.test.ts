import { describe, it, expect } from 'vitest';
import { classifyWebhook } from './events';

const installation = { id: 555 };

describe('classifyWebhook', () => {
  it('answers ping', () => {
    expect(classifyWebhook('ping', { zen: 'hi' })).toEqual({ type: 'ping' });
  });

  it('maps installation lifecycle to a repo status', () => {
    expect(classifyWebhook('installation', { action: 'deleted', installation })).toEqual({
      type: 'installationStatus',
      installationId: '555',
      status: 'removed'
    });
    expect(classifyWebhook('installation', { action: 'suspend', installation })).toMatchObject({ status: 'suspended' });
    expect(classifyWebhook('installation', { action: 'unsuspend', installation })).toMatchObject({ status: 'active' });
  });

  it('does not attach a new installation to any rikma', () => {
    expect(classifyWebhook('installation', { action: 'created', installation }).type).toBe('ignored');
  });

  it('reads added and removed repositories', () => {
    expect(
      classifyWebhook('installation_repositories', {
        action: 'added',
        installation,
        repositories_added: [{ id: 1, name: 'a', full_name: 'o/a', private: false }, { name: 'broken' }]
      })
    ).toMatchObject({ type: 'reposAdded', installationId: '555', repos: [{ repoId: '1', owner: 'o', name: 'a' }] });

    expect(
      classifyWebhook('installation_repositories', {
        action: 'removed',
        installation,
        repositories_removed: [{ id: 1 }, { id: 2 }]
      })
    ).toEqual({ type: 'reposRemoved', installationId: '555', repoIds: ['1', '2'] });
  });

  it('hands issues to the label rule', () => {
    const payload = {
      action: 'opened',
      installation,
      repository: { id: 1, name: 'a', full_name: 'o/a' },
      issue: { number: 3, title: 't', labels: [{ name: '1lev1' }], user: { id: 7 } }
    };
    expect(classifyWebhook('issues', payload)).toMatchObject({ type: 'issueTask', issue: { repoId: '1', number: 3 } });
    expect(classifyWebhook('issues', { ...payload, action: 'closed' }).type).toBe('issueClosed');
    expect(classifyWebhook('issues', { ...payload, issue: { ...payload.issue, labels: [] } }).type).toBe('ignored');
  });

  it('acknowledges events of later stages without acting', () => {
    expect(classifyWebhook('pull_request', { action: 'closed', installation }).type).toBe('ignored');
    expect(classifyWebhook(null, {}).type).toBe('ignored');
  });
});
