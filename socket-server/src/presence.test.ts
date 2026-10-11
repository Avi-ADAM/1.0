import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { PresenceBook, presenceRoom, registerPresenceHandlers } from './presence.js';

const KEY = 'a-long-enough-test-secret';

/** Same derivation as 1.0main/src/lib/server/p2p/ticket.ts mintTicket. */
function mint(u: string, p: string, key = KEY): string {
  const b64 = Buffer.from(JSON.stringify({ v: 1, u, p, exp: Date.now() + 60_000 })).toString('base64url');
  return `${b64}.${createHmac('sha256', key).update(b64).digest('base64url')}`;
}

describe('PresenceBook', () => {
  it('a user is on the roster while any of their tabs is', () => {
    const b = new PresenceBook();
    expect(b.join('82', 's1', '7')).toBe(true);
    expect(b.join('82', 's2', '7')).toBe(false);
    expect(b.join('82', 's3', '9')).toBe(true);
    expect(b.roster('82')).toEqual(['7', '9']);
    expect(b.leave('82', 's1')).toBe(false);
    expect(b.roster('82')).toEqual(['7', '9']);
    expect(b.leave('82', 's2')).toBe(true);
    expect(b.roster('82')).toEqual(['9']);
  });

  it('rikmas are separate, and a disconnect knows every room the socket was in', () => {
    const b = new PresenceBook();
    b.join('82', 's1', '7');
    b.join('90', 's1', '7');
    b.join('90', 's2', '9');
    expect(b.roomsOf('s1').sort()).toEqual(['82', '90']);
    expect(b.roster('82')).toEqual(['7']);
    expect(b.leave('90', 's1')).toBe(true);
    expect(b.roster('90')).toEqual(['9']);
  });

  it('leaving a room one was never in changes nothing', () => {
    const b = new PresenceBook();
    expect(b.leave('82', 'ghost')).toBe(false);
    expect(b.roster('82')).toEqual([]);
  });
});

/** Just enough of socket.io to drive the handlers. */
function harness() {
  const emitted: Array<{ room: string; event: string; data: any }> = [];
  const io = { to: (room: string) => ({ emit: (event: string, data: any) => emitted.push({ room, event, data }) }) };
  const book = new PresenceBook();
  const connect = (id: string, userId?: string) => {
    const handlers = new Map<string, (...a: any[]) => void>();
    const rooms = new Set<string>();
    const socket = {
      id,
      data: { userId },
      rooms,
      on: (e: string, h: (...a: any[]) => void) => handlers.set(e, h),
      join: (r: string) => rooms.add(r),
      leave: (r: string) => rooms.delete(r)
    };
    registerPresenceHandlers(io as any, socket as any, book);
    const call = (e: string, data?: unknown) =>
      new Promise<any>((resolve) => {
        const h = handlers.get(e);
        if (!h) return resolve(undefined);
        h(data, resolve);
        if (e !== 'presence:join') resolve(undefined);
      });
    return { socket, call, handlers };
  };
  return { emitted, connect, book };
}

describe('registerPresenceHandlers', () => {
  const saved = process.env.P2P_TICKET_SECRET;
  beforeEach(() => {
    process.env.P2P_TICKET_SECRET = KEY;
  });
  afterEach(() => {
    process.env.P2P_TICKET_SECRET = saved;
  });

  it('a member with a ticket joins, gets the roster, and the room hears of it', async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    expect(await a.call('presence:join', { ticket: mint('7', '82') })).toEqual({ ok: true, members: ['7'] });
    expect(a.socket.rooms.has(presenceRoom('82'))).toBe(true);
    const b = connect('s2', '9');
    expect(await b.call('presence:join', { ticket: mint('9', '82') })).toEqual({ ok: true, members: ['7', '9'] });
    expect(emitted.at(-1)).toEqual({
      room: 'rikma:82',
      event: 'presence:roster',
      data: { projectId: '82', members: ['7', '9'] }
    });
  });

  it("someone else's ticket, a forged one, or no secret at all seats nobody", async () => {
    const { emitted, connect } = harness();
    const a = connect('s1', '7');
    expect(await a.call('presence:join', { ticket: mint('9', '82') })).toEqual({ ok: false, error: 'ticket' });
    expect(await a.call('presence:join', { ticket: mint('7', '82', 'not-the-real-secret!') })).toEqual({
      ok: false,
      error: 'ticket'
    });
    process.env.P2P_TICKET_SECRET = '';
    expect(await a.call('presence:join', { ticket: mint('7', '82') })).toEqual({ ok: false, error: 'ticket' });
    expect(a.socket.rooms.size).toBe(0);
    expect(emitted).toEqual([]);
  });

  it('a second tab is not news; closing the last one is', async () => {
    const { emitted, connect } = harness();
    const a1 = connect('s1', '7');
    const a2 = connect('s2', '7');
    await a1.call('presence:join', { ticket: mint('7', '82') });
    const before = emitted.length;
    await a2.call('presence:join', { ticket: mint('7', '82') });
    expect(emitted.length).toBe(before);
    await a1.call('disconnect');
    expect(emitted.length).toBe(before);
    await a2.call('presence:leave', { projectId: '82' });
    expect(emitted.at(-1)?.data).toEqual({ projectId: '82', members: [] });
  });

  it('a guest socket (no user) gets no presence handlers at all', () => {
    const { connect } = harness();
    expect(connect('g1').handlers.size).toBe(0);
  });
});
