import { beforeEach, describe, expect, it, vi } from 'vitest';

const render = vi.hoisted(() => vi.fn(async () => '<html>mail</html>'));

vi.mock('svelty-email', () => ({ render }));
vi.mock('$lib/components/mail/simpleNuti.svelte', () => ({ default: 'SimpleNuti' }));

import { EmailService } from './EmailService.js';
import type { NotificationData, UserProfile } from './NotificationOrchestrator.js';

const notification: NotificationData = {
  title: { he: 'הזמנה', en: 'Invitation' },
  body: { he: 'הצטרפו', en: 'Join us' }
};

const context = (fetch: typeof globalThis.fetch) => ({ fetch, lang: 'en' });
const recipient = (over: Partial<UserProfile> = {}): UserProfile => ({
  id: '42',
  username: 'Dana',
  email: 'dana@example.com',
  lang: 'en',
  machshirs: [],
  ...over
});

beforeEach(() => render.mockClear());

describe('EmailService.sendBulkWithResult', () => {
  it('counts noMail and missing-address recipients as skipped without contacting the relay', async () => {
    const fetch = vi.fn(async () => new Response('should not send'));
    const service = new EmailService();
    const result = await service.sendBulkWithResult(
      [recipient({ noMail: true }), recipient({ id: '43', email: '' })],
      notification,
      'SimpleNuti',
      context(fetch as unknown as typeof globalThis.fetch)
    );

    expect(result).toEqual({ attempted: 0, sent: 0, failed: 0, skipped: 2 });
    expect(fetch).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it('reports relay rejections as failed instead of counting them as sent', async () => {
    const fetch = vi.fn(async () => new Response('smtp failed', { status: 502 }));
    const service = new EmailService();
    const result = await service.sendBulkWithResult(
      [recipient()],
      notification,
      'SimpleNuti',
      context(fetch as unknown as typeof globalThis.fetch)
    );

    expect(result).toEqual({ attempted: 1, sent: 0, failed: 1, skipped: 0 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('counts successful relay responses and keeps sendBulk backward-compatible', async () => {
    const fetch = vi.fn(async () => new Response('sent', { status: 200 }));
    const service = new EmailService();
    const summary = await service.sendBulkWithResult(
      [recipient()],
      notification,
      'SimpleNuti',
      context(fetch as unknown as typeof globalThis.fetch)
    );

    expect(summary).toEqual({ attempted: 1, sent: 1, failed: 0, skipped: 0 });
    await expect(service.sendBulk([recipient()], notification, 'SimpleNuti', context(fetch as unknown as typeof globalThis.fetch))).resolves.toBeUndefined();
  });
});
