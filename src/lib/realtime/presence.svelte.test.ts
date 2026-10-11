import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The client half of "who is here": it follows what the ticket endpoint and
 * the room say. The symmetry itself lives server-side (no ticket ⇒ no roster).
 */

const sock = vi.hoisted(() => {
  const handlers = new Map<string, Set<(d: any) => void>>();
  const ready = new Set<() => void>();
  return {
    handlers,
    ready,
    connected: true,
    sent: [] as Array<[string, unknown]>,
    requests: [] as Array<[string, unknown]>,
    joinAnswer: { ok: true, members: ['7', '9'] } as any,
    emit(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data));
    }
  };
});

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/socketClient', () => ({
  socketClient: {
    isReady: () => sock.connected,
    onReady: (l: () => void) => {
      sock.ready.add(l);
      if (sock.connected) l();
      return () => sock.ready.delete(l);
    },
    on: (event: string, h: (d: any) => void) => {
      if (!sock.handlers.has(event)) sock.handlers.set(event, new Set());
      sock.handlers.get(event)!.add(h);
      return () => sock.handlers.get(event)!.delete(h);
    },
    request: async (event: string, data: unknown) => {
      sock.requests.push([event, data]);
      return sock.joinAnswer;
    },
    send: (event: string, data: unknown) => sock.sent.push([event, data])
  }
}));
const userChanged = vi.hoisted(() => ({ fire: () => {} }));
vi.mock('./bus.svelte', () => ({
  realtimeBus: {
    subscribe: (_p: string[], h: () => void) => {
      userChanged.fire = h;
      return () => {};
    }
  }
}));
const action = vi.hoisted(() => ({ fn: vi.fn(async () => ({ success: true })) }));
vi.mock('$lib/client/actionClient', () => ({ executeAction: action.fn }));

const { RikmaPresence } = await import('./presence.svelte');

let ticketAnswer: { status: number; body: any };
const fetchMock = vi.fn(async () => ({
  status: ticketAnswer.status,
  ok: ticketAnswer.status < 300,
  json: async () => ticketAnswer.body
}));
vi.stubGlobal('fetch', fetchMock);

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  sock.handlers.clear();
  sock.ready.clear();
  sock.sent.length = 0;
  sock.requests.length = 0;
  sock.connected = true;
  sock.joinAnswer = { ok: true, members: ['7', '9'] };
  action.fn.mockClear();
  ticketAnswer = { status: 200, body: { hidden: false, ticket: 'T', expiresAt: Date.now() + 3_600_000 } };
});

describe('RikmaPresence', () => {
  it('joins with the ticket and lists the others who are here', async () => {
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    expect(sock.requests).toEqual([['presence:join', { ticket: 'T' }]]);
    expect(p.status).toBe('here');
    expect(p.others).toEqual(['9']);
  });

  it("follows the room's roster — for this rikma only", async () => {
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    sock.emit('presence:roster', { projectId: '90', members: ['7', '11'] });
    expect(p.others).toEqual(['9']);
    sock.emit('presence:roster', { projectId: '82', members: ['7', '9', '11'] });
    expect(p.others).toEqual(['9', '11']);
  });

  it('a hidden member gets no ticket, so never joins and sees nobody', async () => {
    ticketAnswer = { status: 200, body: { hidden: true } };
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    expect(p.status).toBe('hidden');
    expect(sock.requests).toEqual([]);
    expect(p.others).toEqual([]);
  });

  it('no secret on the server (404) — unavailable, and the bar stays away', async () => {
    ticketAnswer = { status: 404, body: null };
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    expect(p.status).toBe('unavailable');
  });

  it('hiding saves the choice, leaves the room and forgets the roster', async () => {
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    expect(await p.setHidden(true)).toBe(true);
    expect(action.fn).toHaveBeenCalledWith('updateUserBasic', { hidePresence: true });
    expect(sock.sent).toContainEqual(['presence:leave', { projectId: '82' }]);
    expect(p.status).toBe('hidden');
    expect(p.others).toEqual([]);
    // A roster that was already on its way changes nothing.
    sock.emit('presence:roster', { projectId: '82', members: ['7', '9'] });
    expect(p.others).toEqual([]);
  });

  it('a failed save keeps things as they were', async () => {
    action.fn.mockResolvedValueOnce({ success: false } as any);
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    expect(await p.setHidden(true)).toBe(false);
    expect(p.status).toBe('here');
    expect(p.others).toEqual(['9']);
  });

  it('switched off on another device: this tab follows', async () => {
    const p = new RikmaPresence('82', '7');
    p.start();
    await flush();
    ticketAnswer = { status: 200, body: { hidden: true } };
    userChanged.fire();
    await flush();
    expect(p.status).toBe('hidden');
    expect(sock.sent).toContainEqual(['presence:leave', { projectId: '82' }]);
  });

  it('teardown leaves the room', async () => {
    const p = new RikmaPresence('82', '7');
    const stop = p.start();
    await flush();
    stop();
    expect(sock.sent).toContainEqual(['presence:leave', { projectId: '82' }]);
    expect(sock.handlers.get('presence:roster')?.size ?? 0).toBe(0);
  });
});
