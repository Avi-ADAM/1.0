import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 2026-10-07: reloading /moach/92/progress showed "הדף לא נמצא" while Strapi
 * was timing out. `sendToSer` hands back /api/send's error body instead of
 * throwing, and this load read the missing `data` as a missing rikma. Every
 * moach tab runs it on a direct load, so a slow backend must read as "try
 * again" (503), and only a real empty answer as "not found" (404).
 */

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...a: unknown[]) => sendToSer(...a) }));

const { load } = await import('./+layout.server');

const event = () =>
  ({ params: { projectId: '92' }, fetch: (() => {}) as unknown as typeof fetch, depends: () => {} }) as any;

const reply = (project: unknown, me: unknown = { id: '258' }) => ({ data: { project, me } });
const rikma = (memberIds: string[]) => ({
  data: { id: '92', attributes: { projectName: 'ר', user_1s: { data: memberIds.map((id) => ({ id })) } } }
});

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 200;
  } catch (e: any) {
    return { status: e.status, code: e.body?.code };
  }
}

describe('moach layout load', () => {
  beforeEach(() => sendToSer.mockReset());

  it('answers 503 "unreachable", not 404, when /api/send timed out', async () => {
    sendToSer.mockResolvedValue({ message: 'Gateway Timeout: The server did not respond in time.' });
    expect(await statusOf(load(event()) as Promise<unknown>)).toEqual({ status: 503, code: 'unreachable' });
  });

  it('answers 503 when Strapi returned errors and no data', async () => {
    sendToSer.mockResolvedValue({ data: null, errors: [{ message: 'connect ETIMEDOUT' }] });
    expect(await statusOf(load(event()) as Promise<unknown>)).toEqual({ status: 503, code: 'unreachable' });
  });

  it('still answers 404 for a rikma that really does not exist', async () => {
    sendToSer.mockResolvedValue(reply({ data: null }));
    expect(await statusOf(load(event()) as Promise<unknown>)).toMatchObject({ status: 404 });
  });

  it('answers 403 to a signed-in non-member', async () => {
    sendToSer.mockResolvedValue(reply(rikma(['1'])));
    expect(await statusOf(load(event()) as Promise<unknown>)).toMatchObject({ status: 403 });
  });

  it('loads for a member', async () => {
    sendToSer.mockResolvedValue(reply(rikma(['1', '258'])));
    const out: any = await load(event());
    expect(out).toMatchObject({ projectId: '92', uid: '258', memberCount: 2, memberIds: ['1', '258'] });
  });
});
