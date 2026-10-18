import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendBulkWithResult = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/notifications/EmailService', () => ({
  EmailService: class {
    sendBulk(...args: unknown[]) {
      return sendBulkWithResult(...args);
    }
    sendBulkWithResult(...args: unknown[]) {
      return sendBulkWithResult(...args);
    }
  }
}));

import { invitePartnerToOpenEntities } from './engine.js';

const depsFor = (
  user?: { id: string; attributes?: Record<string, unknown> },
  failSuggestions = false,
  invitedBy = '1',
  existingSuggestions: Record<string, any[]> = {},
  failLookup = false
) => {
  const execute = vi.fn(async (qid: string, vars: Record<string, any>) => {
    if (qid === '370findUserForInvite') {
      if (failLookup) throw new Error('user lookup unavailable');
      return { data: { usersPermissionsUsers: { data: user ? [user] : [] } } };
    }
    if (qid === '210findMatchSuggestionsByMission' || qid === '211findMatchSuggestionsByMashaabim') {
      return { data: { matchSuggestions: { data: existingSuggestions[qid] ?? [] } } };
    }
    if (qid === '207createMatchSuggestion') {
      if (failSuggestions) throw new Error('suggestion write failed');
      return { data: { createMatchSuggestion: { data: { id: 'new-suggestion' } } } };
    }
    throw new Error(`Unexpected qid ${qid}`);
  });
  return {
    strapi: { execute },
    fetch: vi.fn(async () => new Response('ok')) as unknown as typeof fetch,
    invitedBy,
    projectId: '77',
    lang: 'en',
    execute
  };
};

beforeEach(() => {
  sendBulkWithResult.mockReset();
  sendBulkWithResult.mockResolvedValue({ attempted: 1, sent: 1, failed: 0, skipped: 0 });
});

describe('invitePartnerToOpenEntities', () => {
  it('creates exact mission/resource invitation cards and sends one email with both links', async () => {
    const deps = depsFor({
      id: '42',
      attributes: { username: 'Dana', email: 'dana@example.com', lang: 'en', noMail: false }
    });
    const result = await invitePartnerToOpenEntities(
      ' Dana@Example.com ',
      {
        openMissions: [{ id: '51', name: 'Design the identity' }],
        openMashaabims: [{ id: '61', name: 'Camera' }]
      },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({
      result: 'invited',
      userId: '42',
      created: 2,
      joinUrl: 'https://www.1lev1.com/project/77/join',
      emailStatus: 'sent'
    });
    const suggestionCalls = deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion');
    expect(suggestionCalls).toHaveLength(2);
    expect(suggestionCalls[0][1]).toMatchObject({
      userId: '42', openMissionId: '51', kind: 'mission', source: 'invited', status: 'notified'
    });
    expect(suggestionCalls[1][1]).toMatchObject({
      userId: '42', openMashaabimId: '61', kind: 'resource', source: 'invited', status: 'notified'
    });

    expect(sendBulkWithResult).toHaveBeenCalledOnce();
    const [recipients, notification] = sendBulkWithResult.mock.calls[0];
    expect(recipients[0]).toMatchObject({ id: '42', email: 'dana@example.com', username: 'Dana' });
    expect(notification.links).toEqual([
      expect.objectContaining({ kind: 'rikma', href: '/project/77/join' }),
      expect.objectContaining({ kind: 'lev', href: '/lev' })
    ]);
    expect(notification.body.en).toContain('Design the identity');
    expect(notification.body.en).toContain('Camera');
  });

  it('reuses an existing active match card instead of creating a duplicate', async () => {
    const deps = depsFor(
      { id: '42', attributes: { username: 'Dana', email: 'dana@example.com', lang: 'en' } },
      false,
      '1',
      { '210findMatchSuggestionsByMission': [{ id: 'existing', attributes: { status: 'notified' } }] }
    );
    const result = await invitePartnerToOpenEntities(
      'dana@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({ result: 'invited', created: 1, emailStatus: 'sent' });
    expect(deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion')).toHaveLength(0);
    expect(sendBulkWithResult).toHaveBeenCalledOnce();
  });

  it('emails the public join link to a person without an account', async () => {
    const deps = depsFor();
    const result = await invitePartnerToOpenEntities(
      'new-partner@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [{ id: '61', name: 'Camera' }] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({
      result: 'notRegistered',
      created: 0,
      joinUrl: 'https://www.1lev1.com/project/77/join',
      emailStatus: 'sent'
    });
    expect(deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion')).toHaveLength(0);
    expect(sendBulkWithResult.mock.calls[0][0][0]).toMatchObject({
      id: 'external', email: 'new-partner@example.com', noMail: false
    });
    expect(sendBulkWithResult.mock.calls[0][1].links).toHaveLength(1);
    expect(sendBulkWithResult.mock.calls[0][1].links[0].href).toBe('/project/77/join');
  });

  it('sends a join email during a user-lookup outage and reports the missing work cards', async () => {
    const deps = depsFor(undefined, false, '1', {}, true);
    const result = await invitePartnerToOpenEntities(
      'new-partner@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [{ id: '61', name: 'Camera' }] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({
      result: 'invited',
      created: 0,
      suggestionFailures: 2,
      emailStatus: 'sent',
      joinUrl: 'https://www.1lev1.com/project/77/join'
    });
    expect(deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion')).toHaveLength(0);
    expect(sendBulkWithResult).toHaveBeenCalledOnce();
  });

  it('does not claim an email was sent when delivery fails, and returns the manual link', async () => {
    sendBulkWithResult.mockResolvedValueOnce({ attempted: 1, sent: 0, failed: 1, skipped: 0 });
    const result = await invitePartnerToOpenEntities(
      'new-partner@example.com',
      { openMissions: [], openMashaabims: [] },
      'Studio Gefen',
      depsFor()
    );

    expect(result).toMatchObject({
      result: 'emailFailed',
      created: 0,
      emailStatus: 'failed',
      joinUrl: 'https://www.1lev1.com/project/77/join'
    });
  });

  it('sends a general rikma invitation even if no mission or resource was linked', async () => {
    const deps = depsFor({
      id: '42',
      attributes: { username: 'Dana', email: 'dana@example.com', lang: 'en', noMail: false }
    });
    const result = await invitePartnerToOpenEntities(
      'dana@example.com',
      { openMissions: [], openMashaabims: [] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({ result: 'invited', created: 0, emailStatus: 'sent' });
    expect(deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion')).toHaveLength(0);
    expect(sendBulkWithResult).toHaveBeenCalledOnce();
  });

  it('keeps a registered partner invitation truthful when the email preference suppresses mail', async () => {
    sendBulkWithResult.mockResolvedValueOnce({ attempted: 0, sent: 0, failed: 0, skipped: 1 });
    const deps = depsFor({
      id: '42',
      attributes: { username: 'Dana', email: 'dana@example.com', lang: 'en', noMail: true }
    });
    const result = await invitePartnerToOpenEntities(
      'dana@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({ result: 'invited', created: 1, emailStatus: 'skipped' });
    expect(sendBulkWithResult.mock.calls[0][0][0].noMail).toBe(true);
  });

  it('reports a failed contribution card while still sending the join link', async () => {
    const deps = depsFor(
      { id: '42', attributes: { username: 'Dana', email: 'dana@example.com', lang: 'en' } },
      true
    );
    const result = await invitePartnerToOpenEntities(
      'dana@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [] },
      'Studio Gefen',
      deps
    );

    expect(result).toMatchObject({ result: 'invited', created: 0, suggestionFailures: 1, emailStatus: 'sent' });
    expect(sendBulkWithResult.mock.calls[0][1].links[0].href).toBe('/project/77/join');
  });

  it('does not invite the caller themselves', async () => {
    const deps = depsFor({ id: '1', attributes: { email: 'owner@example.com' } });
    const result = await invitePartnerToOpenEntities(
      'owner@example.com',
      { openMissions: [{ id: '51', name: 'Design' }], openMashaabims: [] },
      'Studio Gefen',
      deps
    );

    expect(result.result).toBe('self');
    expect(sendBulkWithResult).not.toHaveBeenCalled();
    expect(deps.execute.mock.calls.filter(([qid]) => qid === '207createMatchSuggestion')).toHaveLength(0);
  });

  it('limits each inviter to twenty invitation emails per rolling hour', async () => {
    const deps = depsFor(undefined, false, 'rate-limit-user');
    const results = [];
    for (let i = 0; i < 21; i++) {
      results.push(
        await invitePartnerToOpenEntities(
          `partner-${i}@example.com`,
          { openMissions: [], openMashaabims: [] },
          'Studio Gefen',
          deps
        )
      );
    }

    expect(results.slice(0, 20).every((result) => result.emailStatus === 'sent')).toBe(true);
    expect(results[20]).toMatchObject({ result: 'rateLimited', created: 0, joinUrl: 'https://www.1lev1.com/project/77/join' });
    expect(results[20].retryAfterSeconds).toBeGreaterThan(0);
    expect(sendBulkWithResult).toHaveBeenCalledTimes(20);
    expect(deps.execute).toHaveBeenCalledTimes(20);
  });
});
