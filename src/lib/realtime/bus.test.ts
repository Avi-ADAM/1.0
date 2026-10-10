import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRealtimeBus, parseChange } from './bus';
import { RT_EVENT } from './scopes';

function fakeSocket() {
  const handlers = new Map<string, (d: any) => void>();
  const ready = new Set<() => void>();
  return {
    on: vi.fn((event: string, h: (d: any) => void) => {
      handlers.set(event, h);
      return () => handlers.delete(event);
    }),
    onReady: vi.fn((l: () => void) => {
      ready.add(l);
      return () => ready.delete(l);
    }),
    emit: (event: string, data: unknown) => handlers.get(event)?.(data),
    reconnect: () => ready.forEach((l) => l())
  };
}

function setup() {
  const socket = fakeSocket();
  const invalidated: string[][] = [];
  const deps = ['rt:project:12', 'rt:mission:*', 'rt:wish:9', 'https://x/api/send'];
  const invalidate = vi.fn(async (pred: (u: URL) => boolean) => {
    invalidated.push(deps.filter((d) => pred(new URL(d))));
  });
  const bus = createRealtimeBus({
    on: socket.on,
    onReady: socket.onReady,
    clientId: () => 'tab-me',
    invalidate,
    windowMs: 250,
    log: () => {}
  });
  bus.start();
  return { socket, bus, invalidate, invalidated };
}

const change = (scopes: string[], over: Record<string, unknown> = {}) => ({
  scopes,
  actionKey: 'a',
  at: '2026-10-08T00:00:00Z',
  ...over
});

describe('realtime bus', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('re-runs exactly the loads whose rt: key covers a changed scope', async () => {
    const { socket, invalidated } = setup();
    socket.emit(RT_EVENT, change(['project:12', 'mission:7']));
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidated).toEqual([['rt:project:12', 'rt:mission:*']]);
  });

  it('a burst inside the window is one refresh', async () => {
    const { socket, invalidate } = setup();
    socket.emit(RT_EVENT, change(['project:12', 'decision:pendm:1']));
    socket.emit(RT_EVENT, change(['project:12', 'decision:pendm:1']));
    socket.emit(RT_EVENT, change(['project:12', 'decision:pendm:2']));
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("drops the echo of the tab that ran the action, keeps the user's other tabs", async () => {
    const { socket, invalidate } = setup();
    socket.emit(RT_EVENT, change(['project:12'], { originClientId: 'tab-me' }));
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).not.toHaveBeenCalled();

    socket.emit(RT_EVENT, change(['project:12'], { originClientId: 'tab-other' }));
    await vi.advanceTimersByTimeAsync(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('hands a subscriber only the changes its patterns cover, one by one', async () => {
    const { socket, bus } = setup();
    const seen = vi.fn();
    bus.subscribe(['project:12'], seen);
    socket.emit(RT_EVENT, change(['project:12', 'mission:7']));
    socket.emit(RT_EVENT, change(['project:13', 'mission:8']));
    await vi.advanceTimersByTimeAsync(250);
    expect(seen).toHaveBeenCalledTimes(1);
    const batch = seen.mock.calls[0][0];
    expect(batch.resync).toBe(false);
    expect(batch.changes.map((c: any) => c.scopes)).toEqual([['project:12', 'mission:7']]);
  });

  it('a subscriber that throws does not stop the others', async () => {
    const { socket, bus } = setup();
    const ok = vi.fn();
    bus.subscribe(['mission:*'], () => {
      throw new Error('boom');
    });
    bus.subscribe(['mission:*'], ok);
    socket.emit(RT_EVENT, change(['mission:1']));
    await vi.advanceTimersByTimeAsync(250);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('after a reconnect — not the first connect — everything resyncs once', async () => {
    const { socket, bus, invalidated } = setup();
    const seen = vi.fn();
    bus.subscribe(['project:12'], seen);

    socket.reconnect(); // the first ready
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).not.toHaveBeenCalled();

    socket.reconnect(); // back after a gap
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toHaveBeenCalledWith({ changes: [], scopes: [], resync: true });
    expect(invalidated.at(-1)).toEqual(['rt:project:12', 'rt:mission:*', 'rt:wish:9']);
  });

  it('ignores what is not a change, and unknown scopes inside one', () => {
    expect(parseChange(null)).toBeNull();
    expect(parseChange({ scopes: 'project:1' })).toBeNull();
    expect(parseChange({ scopes: ['pends', 'mission:*'] })).toBeNull();
    expect(parseChange({ scopes: ['pends', 'mission:3'], actionKey: 'x' })?.scopes).toEqual(['mission:3']);
  });

  it('start is idempotent; stop detaches', () => {
    const { socket, bus } = setup();
    bus.start();
    expect(socket.on).toHaveBeenCalledTimes(1);
    bus.stop();
    bus.start();
    expect(socket.on).toHaveBeenCalledTimes(2);
  });
});
