import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { registerTypingHandlers, typingRoom } from './typing.js';
import { RateLimiter, verifyP2pTicket, verifyRoomTicket } from './p2p.js';

const KEY = 'a-long-enough-test-secret';

/** Same derivation as 1.0main/src/lib/server/p2p/ticket.ts. */
function mint(payload: Record<string, unknown>, key = KEY): string {
  const b64 = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + 60_000, ...payload })).toString('base64url');
  return `${b64}.${createHmac('sha256', key).update(b64).digest('base64url')}`;
}

describe('ticket kinds', () => {
  it('a forum ticket never opens a rikma room, and a rikma ticket never opens a forum', () => {
    const forum = mint({ k: 'forum', u: '7', p: '82' });
    const rikma = mint({ u: '7', p: '82' });
    expect(verifyRoomTicket(forum, KEY, 'forum')?.projectId).toBe('82');
    expect(verifyP2pTicket(forum, KEY)).toBeNull();
    expect(verifyRoomTicket(rikma, KEY, 'forum')).toBeNull();
    expect(verifyP2pTicket(rikma, KEY)?.projectId).toBe('82');
  });
});

/** Just enough of socket.io: rooms per socket, and what `socket.to(room)` emits. */
function harness(limiter = new RateLimiter(60)) {
  const emitted: Array<{ from: string; room: string; event: string; data: any }> = [];
  const connect = (id: string, userId?: string) => {
    const handlers = new Map<string, (...a: any[]) => void>();
    const rooms = new Set<string>([id]);
    const socket = {
      id,
      data: { userId },
      rooms,
      on: (e: string, h: (...a: any[]) => void) => handlers.set(e, h),
      join: (r: string) => rooms.add(r),
      leave: (r: string) => rooms.delete(r),
      to: (room: string) => ({ emit: (event: string, data: any) => emitted.push({ from: id, room, event, data }) })
    };
    registerTypingHandlers({} as any, socket as any, limiter);
    const call = (e: string, data?: unknown) =>
      new Promise<any>((resolve) => {
        const h = handlers.get(e);
        if (!h) return resolve(undefined);
        h(data, resolve);
        if (e !== 'typing:join') resolve(undefined);
      });
    return { socket, call, handlers };
  };
  return { emitted, connect };
}

describe('registerTypingHandlers', () => {
  const saved = process.env.P2P_TICKET_SECRET;
  beforeEach(() => {
    process.env.P2P_TICKET_SECRET = KEY;
  });
  afterEach(() => {
    process.env.P2P_TICKET_SECRET = saved;
  });

  it('a participant with a forum ticket joins, and the others hear that they type', async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    expect(await a.call('typing:join', { ticket: mint({ k: 'forum', u: '7', p: '12', n: 'Dana' }) })).toEqual({ ok: true });
    expect(a.socket.rooms.has(typingRoom('12'))).toBe(true);
    await a.call('typing:set', { forumId: '12', typing: true });
    expect(emitted).toEqual([
      { from: 's1', room: 'typing:12', event: 'typing:update', data: { forumId: '12', uid: '7', name: 'Dana', typing: true } }
    ]);
  });

  it("no room without a forum ticket of one's own; nothing relayed for a room one is not in", async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    expect(await a.call('typing:join', { ticket: mint({ k: 'forum', u: '9', p: '12' }) })).toEqual({ ok: false, error: 'ticket' });
    expect(await a.call('typing:join', { ticket: mint({ u: '7', p: '12' }) })).toEqual({ ok: false, error: 'ticket' });
    await a.call('typing:set', { forumId: '12', typing: true });
    expect(emitted).toEqual([]);
  });

  it('only a boolean, only a numeric forum id', async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    await a.call('typing:join', { ticket: mint({ k: 'forum', u: '7', p: '12' }) });
    await a.call('typing:set', { forumId: '12', typing: 'hello there' });
    await a.call('typing:set', { forumId: '12 OR 1', typing: true });
    expect(emitted).toEqual([]);
  });

  it('a flood of pings is cut, but "stopped" always goes through', async () => {
    const { emitted, connect } = harness(new RateLimiter(2));
    const a = connect('s1', '7');
    await a.call('typing:join', { ticket: mint({ k: 'forum', u: '7', p: '12' }) });
    for (let i = 0; i < 5; i++) await a.call('typing:set', { forumId: '12', typing: true });
    await a.call('typing:set', { forumId: '12', typing: false });
    expect(emitted.map((e) => e.data.typing)).toEqual([true, true, false]);
  });

  it('leaving or dropping says "stopped" to the room', async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    await a.call('typing:join', { ticket: mint({ k: 'forum', u: '7', p: '12' }) });
    await a.call('typing:join', { ticket: mint({ k: 'forum', u: '7', p: '13' }) });
    await a.call('typing:leave', { forumId: '12' });
    expect(emitted.at(-1)).toMatchObject({ room: 'typing:12', data: { typing: false } });
    await a.call('disconnecting');
    expect(emitted.at(-1)).toMatchObject({ room: 'typing:13', data: { forumId: '13', uid: '7', typing: false } });
  });

  it('a guest socket gets no typing handlers', () => {
    const { connect } = harness();
    expect(connect('g1').handlers.size).toBe(0);
  });
});
