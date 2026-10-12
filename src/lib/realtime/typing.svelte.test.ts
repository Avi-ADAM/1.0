import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sock = vi.hoisted(() => {
  const handlers = new Map<string, Set<(d: any) => void>>();
  return {
    handlers,
    sent: [] as Array<[string, any]>,
    requests: [] as Array<[string, any]>,
    emit(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data));
    }
  };
});

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/socketClient', () => ({
  socketClient: {
    onReady: (l: () => void) => {
      l();
      return () => {};
    },
    on: (event: string, h: (d: any) => void) => {
      if (!sock.handlers.has(event)) sock.handlers.set(event, new Set());
      sock.handlers.get(event)!.add(h);
      return () => sock.handlers.get(event)!.delete(h);
    },
    request: async (event: string, data: unknown) => {
      sock.requests.push([event, data]);
      return { ok: true };
    },
    send: (event: string, data: unknown) => sock.sent.push([event, data])
  }
}));
const action = vi.hoisted(() => ({
  answer: { success: true, data: { available: true, hidden: false, ticket: 'FT', expiresAt: 0 } } as any,
  fn: vi.fn()
}));
vi.mock('$lib/client/actionClient', () => ({
  executeAction: (...a: unknown[]) => {
    action.fn(...a);
    return Promise.resolve(action.answer);
  }
}));

const { ForumTyping, PING_MS, EXPIRE_MS } = await import('./typing.svelte');

/** Lets the ticket → join chain settle under fake timers. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  vi.useFakeTimers();
  sock.handlers.clear();
  sock.sent.length = 0;
  sock.requests.length = 0;
  action.fn.mockClear();
  action.answer = {
    success: true,
    data: { available: true, hidden: false, ticket: 'FT', expiresAt: Date.now() + 3_600_000 }
  };
});
afterEach(() => vi.useRealTimers());

describe('ForumTyping', () => {
  it('asks for a seat in this forum and joins with it', async () => {
    new ForumTyping('12').start();
    await settle();
    expect(action.fn).toHaveBeenCalledWith('getForumTypingTicket', { forumId: '12' });
    expect(sock.requests).toEqual([['typing:join', { ticket: 'FT' }]]);
  });

  it('pings at most once per interval while typing, and says "stopped" once', async () => {
    const t = new ForumTyping('12');
    t.start();
    await settle();
    const now = Date.now();
    t.ping(now);
    t.ping(now + 100);
    t.ping(now + PING_MS + 1);
    t.stopped();
    t.stopped();
    expect(sock.sent).toEqual([
      ['typing:set', { forumId: '12', typing: true }],
      ['typing:set', { forumId: '12', typing: true }],
      ['typing:set', { forumId: '12', typing: false }]
    ]);
  });

  it('shows who types in this forum, and fades a "typing" nobody refreshes', async () => {
    const t = new ForumTyping('12');
    t.start();
    await settle();
    sock.emit('typing:update', { forumId: '13', uid: '9', name: 'Avi', typing: true });
    sock.emit('typing:update', { forumId: '12', uid: '7', name: 'Dana', typing: true });
    expect(t.names).toEqual(['Dana']);
    vi.advanceTimersByTime(EXPIRE_MS - 1);
    sock.emit('typing:update', { forumId: '12', uid: '7', name: 'Dana', typing: true });
    vi.advanceTimersByTime(EXPIRE_MS - 1);
    expect(t.names).toEqual(['Dana']);
    vi.advanceTimersByTime(2);
    expect(t.names).toEqual([]);
  });

  it('"stopped" from the room clears at once', async () => {
    const t = new ForumTyping('12');
    t.start();
    await settle();
    sock.emit('typing:update', { forumId: '12', uid: '7', name: 'Dana', typing: true });
    sock.emit('typing:update', { forumId: '12', uid: '7', name: 'Dana', typing: false });
    expect(t.names).toEqual([]);
  });

  it('presence switched off (or no secret) — no seat, no pings', async () => {
    action.answer = { success: true, data: { available: true, hidden: true } };
    const t = new ForumTyping('12');
    t.start();
    await settle();
    t.ping();
    expect(sock.requests).toEqual([]);
    expect(sock.sent).toEqual([]);
  });

  it('teardown says "stopped" and leaves the room', async () => {
    const t = new ForumTyping('12');
    const stop = t.start();
    await settle();
    t.ping();
    stop();
    expect(sock.sent).toEqual([
      ['typing:set', { forumId: '12', typing: true }],
      ['typing:set', { forumId: '12', typing: false }],
      ['typing:leave', { forumId: '12' }]
    ]);
  });
});
