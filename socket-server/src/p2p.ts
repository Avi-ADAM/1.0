/**
 * Signaling for the P2P pilot (1.0main docs/PLAN_P2P_PILOT.md).
 *
 * This server never sees a file byte. It only lets two members of the same
 * rikma find each other and swap WebRTC offers/answers/ICE candidates; the
 * file then flows browser-to-browser. What it enforces:
 *
 * - **Who may sit in a rikma's room.** Joining needs a ticket signed by the
 *   main app (which checked membership) whose user id equals this socket's
 *   own authenticated user. No ticket, no room.
 * - **Who may be addressed.** `have` and `signal` are forwarded only when the
 *   sender AND the target socket are both in that rikma's room — a socket id
 *   learned elsewhere is useless.
 * - **How often.** `want` is rate-limited per socket; payloads are size-capped.
 *
 * Token format and secret: see `1.0main/src/lib/server/p2p/ticket.ts`
 * (P2P_TICKET_SECRET, same value in both). Fails closed when unset.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { Server, Socket } from 'socket.io';

export interface P2pTicket {
  uid: string;
  projectId: string;
  expiresAt: number;
}

function secret(): string | null {
  const raw = (process.env.P2P_TICKET_SECRET || '').trim();
  return raw.length >= 16 ? raw : null;
}

export function verifyP2pTicket(ticket: unknown, key: string | null, now = Date.now()): P2pTicket | null {
  if (!key || typeof ticket !== 'string' || ticket.length > 1024) return null;
  const [payload, mac] = ticket.split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(createHmac('sha256', key).update(payload).digest('base64url'));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (p?.v !== 1 || !p.u || !/^\d+$/.test(String(p.p)) || !(Number(p.exp) > now)) return null;
    return { uid: String(p.u), projectId: String(p.p), expiresAt: Number(p.exp) };
  } catch {
    return null;
  }
}

export const p2pRoom = (projectId: string) => `p2p:${projectId}`;

/** Sliding one-minute window per socket. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000
  ) {}
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
  forget(key: string) {
    this.hits.delete(key);
  }
}

const HEX64 = /^[0-9a-f]{64}$/;
const REQ_ID = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_SIGNAL_BYTES = 16 * 1024;

const pidOf = (v: unknown) => (typeof v === 'string' && /^\d{1,12}$/.test(v) ? v : null);

/** Both ends in the same rikma room — the only case a message is relayed. */
export function sameRoom(sender: Set<string>, target: Set<string> | undefined, room: string): boolean {
  return sender.has(room) && !!target?.has(room);
}

const wants = new RateLimiter(60);

/**
 * Wire the pilot's events onto a registered user's socket. Guests (meeting
 * invitees) never get these: they are not rikma members.
 */
export function registerP2pHandlers(io: Server, socket: Socket): void {
  const userId: string | undefined = socket.data.userId;
  if (!userId) return;

  socket.on('p2p:join', (data: { ticket?: unknown }, ack?: (r: unknown) => void) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const t = verifyP2pTicket(data?.ticket, secret());
    if (!t || t.uid !== String(userId)) return reply({ ok: false, error: 'ticket' });
    const room = p2pRoom(t.projectId);
    socket.join(room);
    const size = io.sockets.adapter.rooms.get(room)?.size ?? 1;
    reply({ ok: true, peers: size - 1 });
  });

  socket.on('p2p:leave', (data: { projectId?: unknown }) => {
    const pid = pidOf(data?.projectId);
    if (pid) socket.leave(p2pRoom(pid));
  });

  socket.on('p2p:want', (data: { projectId?: unknown; hash?: unknown; reqId?: unknown }, ack?: (r: unknown) => void) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const pid = pidOf(data?.projectId);
    if (!pid || typeof data?.hash !== 'string' || !HEX64.test(data.hash)) return reply({ ok: false });
    if (typeof data?.reqId !== 'string' || !REQ_ID.test(data.reqId)) return reply({ ok: false });
    const room = p2pRoom(pid);
    if (!socket.rooms.has(room)) return reply({ ok: false, error: 'not-joined' });
    if (!wants.allow(socket.id)) return reply({ ok: false, error: 'rate' });
    const peers = (io.sockets.adapter.rooms.get(room)?.size ?? 1) - 1;
    socket.to(room).emit('p2p:want', { from: socket.id, projectId: pid, hash: data.hash, reqId: data.reqId });
    reply({ ok: true, peers });
  });

  /** have + signal: point-to-point, both ends must share the rikma room. */
  const relay = (event: 'p2p:have' | 'p2p:signal') => (data: any) => {
    const pid = pidOf(data?.projectId);
    if (!pid || typeof data?.to !== 'string' || typeof data?.reqId !== 'string' || !REQ_ID.test(data.reqId)) return;
    const room = p2pRoom(pid);
    const target = io.sockets.sockets.get(data.to);
    if (!target || target.id === socket.id || !sameRoom(socket.rooms, target.rooms, room)) return;
    const out: Record<string, unknown> = { from: socket.id, projectId: pid, reqId: data.reqId };
    if (event === 'p2p:signal') {
      let size = 0;
      try {
        size = JSON.stringify(data.data ?? null).length;
      } catch {
        return;
      }
      if (size > MAX_SIGNAL_BYTES) return;
      out.data = data.data;
    }
    target.emit(event, out);
  };
  socket.on('p2p:have', relay('p2p:have'));
  socket.on('p2p:signal', relay('p2p:signal'));

  socket.on('disconnect', () => wants.forget(socket.id));
}
