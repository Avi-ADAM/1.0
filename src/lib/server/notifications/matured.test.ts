import { describe, it, expect, vi } from 'vitest';
import { tellMatured, maturedRecipients, type MaturedNotice, type MaturedNotifier } from './matured';

const fetch = vi.fn() as unknown as typeof globalThis.fetch;
const text = { he: 'א', en: 'a', ar: 'ا' };

function fake(members: string[] = []) {
  const calls: any[] = [];
  const notifier: MaturedNotifier = {
    notify: vi.fn(async (config, params, result, context) => {
      calls.push({ config, params, result, context });
    }),
    projectMemberIds: vi.fn(async () => members)
  };
  return { notifier, calls };
}

const notice = (to: MaturedNotice['to'], intent: MaturedNotice['intent'] = 'outcome'): MaturedNotice => ({
  kind: 'pendm',
  intent,
  to,
  title: text,
  body: text,
  url: '/moach/7/open'
});

describe('maturedRecipients', () => {
  it('a rikma goes to its members', () => {
    expect(maturedRecipients({ projectId: 7 })).toEqual({
      rule: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
      result: { projectId: '7' }
    });
  });

  it('people go by id, deduplicated, blanks dropped', () => {
    expect(maturedRecipients({ userIds: [3, '3', null, '', 5] })?.result).toEqual({ recipientIds: ['3', '5'] });
  });

  it('nobody is nobody — never the whole rikma', () => {
    expect(maturedRecipients({ userIds: [] })).toBeNull();
    expect(maturedRecipients({ userIds: [null, undefined] })).toBeNull();
    expect(maturedRecipients({ projectId: null })).toBeNull();
  });
});

describe('tellMatured', () => {
  it('sends through the orchestrator with the intent, a matured:<kind> type and no initiator', async () => {
    const { notifier, calls } = fake();
    await tellMatured(notice({ projectId: 7 }, 'consent'), fetch, notifier);
    expect(calls).toHaveLength(1);
    const { config, result, context } = calls[0];
    expect(config.intent).toBe('consent');
    expect(config.channels).toBeUndefined();
    expect(config.metadata).toMatchObject({ type: 'matured:pendm', url: '/moach/7/open', priority: 'high' });
    expect(result).toEqual({ projectId: '7' });
    // A clock did this: nobody may be dropped from push/telegram/email as "the sender".
    expect(context.userId).toBe('');
    expect(context.fetch).toBe(fetch);
  });

  it('`except` tells the rest of the rikma, by id', async () => {
    const { notifier, calls } = fake(['1', '2', '3']);
    await tellMatured(notice({ projectId: 7, except: [2] }), fetch, notifier);
    expect(calls[0].config.recipients.type).toBe('specificUsers');
    expect(calls[0].result).toEqual({ recipientIds: ['1', '3'] });
  });

  it('a rikma of only the excepted person tells nobody', async () => {
    const { notifier, calls } = fake(['2']);
    await tellMatured(notice({ projectId: 7, except: ['2'] }), fetch, notifier);
    expect(calls).toHaveLength(0);
  });

  it('sends each notice of a list', async () => {
    const { notifier, calls } = fake();
    await tellMatured([notice({ userIds: [1] }), notice({ userIds: [2] }, 'personal')], fetch, notifier);
    expect(calls.map((c) => c.result.recipientIds)).toEqual([['1'], ['2']]);
  });

  it('never throws — the maturation already happened', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const notifier: MaturedNotifier = { notify: vi.fn(async () => Promise.reject(new Error('down'))) };
    await expect(tellMatured(notice({ userIds: [1] }), fetch, notifier)).resolves.toBeUndefined();
  });

  it('does nothing without a fetch', async () => {
    const { notifier, calls } = fake();
    await tellMatured(notice({ userIds: [1] }), undefined, notifier);
    expect(calls).toHaveLength(0);
  });
});
