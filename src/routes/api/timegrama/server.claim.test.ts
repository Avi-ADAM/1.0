// A clock due within the hour is seen by every 10-minute run until it fires.
// Each run used to give it its own timer, so tg#479 (an Ask due ~1h out) got six
// timers that fired together and materialized the mission six times.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sendToAdmin = vi.fn();
const ask = vi.fn();

vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'test' } }));
vi.mock('$lib/server/sendToAdmin.js', () => ({ SendToAdmin: (...a: unknown[]) => sendToAdmin(...a) }));
vi.mock('./ask.svelte', () => ({ Ask: (...a: unknown[]) => ask(...a) }));

const { GET } = await import('./+server.js');

const dueIn = (ms: number) => ({
  data: {
    timegramas: {
      data: [{ id: '479', attributes: { whatami: 'ask', date: new Date(Date.now() + ms).toISOString(), ask: { data: { id: '171' } } } }],
    },
  },
});

describe('timegrama run: one clock, one finalizer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sendToAdmin.mockReset();
    ask.mockReset();
    ask.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('does not stack a second timer on a clock an earlier run already scheduled', async () => {
    sendToAdmin.mockImplementation(async () => dueIn(55 * 60 * 1000));
    for (let run = 0; run < 6; run++) {
      await GET({ fetch } as any);
      await vi.advanceTimersByTimeAsync(60 * 1000);
    }
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('picks the clock up again once its finalizer has left it open', async () => {
    sendToAdmin.mockImplementation(async () => dueIn(-1000));
    await GET({ fetch } as any);
    await GET({ fetch } as any);
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('skips a due clock whose finalizer is still running', async () => {
    let finish: () => void = () => {};
    ask.mockImplementation(() => new Promise<void>((r) => (finish = r)));
    sendToAdmin.mockImplementation(async () => dueIn(-1000));
    const first = GET({ fetch } as any);
    await vi.advanceTimersByTimeAsync(0);
    await GET({ fetch } as any);
    expect(ask).toHaveBeenCalledTimes(1);
    finish();
    await first;
  });
});
