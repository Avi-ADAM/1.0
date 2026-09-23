import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { DEFAULT_ICE_SERVERS, iceServers, mintTicket, p2pTicketSecret, readTicket } from './ticket.js';

const SECRET = 'a-long-enough-test-secret';

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
});

describe('tickets', () => {
  it('round-trips user, rikma and expiry', () => {
    const { ticket, expiresAt } = mintTicket('7', '82', SECRET, 1000, 5000);
    expect(expiresAt).toBe(6000);
    expect(readTicket(ticket, SECRET, 2000)).toEqual({ uid: '7', projectId: '82', expiresAt: 6000 });
  });

  it('is dead after expiry, under another secret, or with any byte changed', () => {
    const { ticket } = mintTicket('7', '82', SECRET, 1000, 5000);
    expect(readTicket(ticket, SECRET, 6000)).toBeNull();
    expect(readTicket(ticket, 'another-long-secret-value', 2000)).toBeNull();

    // Swap the rikma inside the payload but keep the old signature.
    const [, mac] = ticket.split('.');
    const forged = Buffer.from(JSON.stringify({ v: 1, u: '7', p: '99', exp: 6000 })).toString('base64url');
    expect(readTicket(`${forged}.${mac}`, SECRET, 2000)).toBeNull();
    expect(readTicket('garbage', SECRET, 2000)).toBeNull();
  });

  it('treats a missing or short secret as "pilot off"', () => {
    expect(p2pTicketSecret()).toBeNull();
    env.P2P_TICKET_SECRET = 'short';
    expect(p2pTicketSecret()).toBeNull();
    env.P2P_TICKET_SECRET = SECRET;
    expect(p2pTicketSecret()).toBe(SECRET);
  });
});

describe('iceServers', () => {
  it('defaults to public STUN — what the pilot is measuring', () => {
    expect(iceServers()).toEqual(DEFAULT_ICE_SERVERS);
  });

  it('takes a well-formed override and ignores a broken one', () => {
    env.P2P_ICE_SERVERS = JSON.stringify([{ urls: ['turn:t.example:3478'], username: 'u', credential: 'c' }]);
    expect(iceServers()[0].urls).toEqual(['turn:t.example:3478']);
    env.P2P_ICE_SERVERS = '{not json';
    expect(iceServers()).toEqual(DEFAULT_ICE_SERVERS);
    env.P2P_ICE_SERVERS = JSON.stringify([{ nope: 1 }]);
    expect(iceServers()).toEqual(DEFAULT_ICE_SERVERS);
  });
});
