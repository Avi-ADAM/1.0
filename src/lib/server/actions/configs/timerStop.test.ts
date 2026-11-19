/**
 * timerStop — a Stop never reopens a timer that is already saved.
 *
 * The case it guards: an approved hourly-value change closes the running timer
 * at T (stamped with the old value) and hands the member a new one at the new
 * value (src/lib/server/timers/flushRateChange.ts). A tab that missed that
 * still shows the old timer running; its Stop closed the old interval at *now*,
 * writing the minutes after T onto the old-value timer as well.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const runMock = vi.fn();
vi.mock('$lib/server/archive/gql.js', () => ({
  run: (...args: unknown[]) => runMock(...args),
  gqlStr: (v: unknown) => JSON.stringify(String(v)),
}));
vi.mock('$lib/server/archive/exec.js', () => ({ execFromContext: () => vi.fn() }));

import { timerStopConfig } from './timerStop.js';

const handler = timerStopConfig.graphqlOperation as any;
const context = { jwt: 'jwt', fetch: vi.fn(), userId: '2' } as any;
const params = {
  timerId: '700',
  projectId: '5',
  userId: '2',
  isActive: false,
  totalHours: 3.5,
  timers: [{ start: '2026-08-20T10:00:00.000Z', stop: '2026-08-20T13:30:00.000Z' }],
};

describe('timerStop', () => {
  let execute: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    runMock.mockReset();
    execute = vi.fn(async () => ({ data: { updateTimer: { data: { id: '700' } } } }));
  });

  it('leaves a saved timer exactly as the server closed it', async () => {
    const stored = {
      id: '700',
      attributes: {
        saved: true,
        isActive: false,
        rate: 50,
        totalHours: 2,
        timers: [{ start: '2026-08-20T10:00:00.000Z', stop: '2026-08-20T12:00:00.000Z' }],
      },
    };
    runMock.mockResolvedValue({ timer: { data: stored } });

    const res = await handler(params, context, { strapi: { execute } });

    expect(execute).not.toHaveBeenCalled();
    expect(res.alreadySaved).toBe(true);
    expect(res.data.updateTimer.data).toBe(stored);
  });

  it('stops an unsaved timer as before', async () => {
    runMock.mockResolvedValue({ timer: { data: { id: '700', attributes: { saved: false, isActive: true } } } });
    await handler(params, context, { strapi: { execute } });
    expect(execute).toHaveBeenCalledWith('34UpdateTimer', params, 'jwt', context.fetch);
  });

  it('still stops when the timer cannot be read first', async () => {
    runMock.mockRejectedValue(new Error('strapi down'));
    await handler(params, context, { strapi: { execute } });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
