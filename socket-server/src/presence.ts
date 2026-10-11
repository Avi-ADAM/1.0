/**
 * Who is in the rikma right now (1.0main docs/inprogress/PLAN_REALTIME_MIGRATION.md,
 * the separate realtime stage; docs/tbd/SPEC_SOCKET_REALTIME.md stage 2).
 *
 * A member's open moach tab sits in `rikma:<projectId>`. Everyone in the room
 * gets the room's roster — the user ids with at least one socket there — and
 * nothing else. What it enforces:
 *
 * - **Who may sit in the room.** The same signed ticket as the P2P room
 *   (p2p.ts): the main app checked membership, and the ticket's user must be
 *   this socket's own authenticated user. This server never asks Strapi.
 * - **Seeing is being seen.** There is no way to read the roster without being
 *   on it: the roster goes to the room, and joining the room puts you on it.
 *   A member who switched presence off gets no ticket from the app, so they
 *   are neither seen nor see — the symmetric opt-out, held by structure
 *   rather than by a flag someone has to remember to check.
 * - **Nothing about the work.** Only user ids. No page, no mission, no text.
 */

import type { Server, Socket } from 'socket.io';
import { roomTicketSecret, verifyP2pTicket } from './p2p.js';

export const presenceRoom = (projectId: string) => `rikma:${projectId}`;

const pidOf = (v: unknown) => (typeof v === 'string' && /^\d{1,12}$/.test(v) ? v : null);

/**
 * Which sockets of which users sit in which rikma. Pure, so the counting
 * (several tabs, a disconnect that takes all of them) is tested on its own.
 */
export class PresenceBook {
  /** projectId → socketId → userId */
  private rooms = new Map<string, Map<string, string>>();

  /** Returns true when the roster changed (the user was not there before). */
  join(projectId: string, socketId: string, userId: string): boolean {
    const room = this.rooms.get(projectId) ?? new Map<string, string>();
    this.rooms.set(projectId, room);
    const before = this.has(room, userId);
    room.set(socketId, userId);
    return !before;
  }

  /** Returns true when the roster changed (that was the user's last socket). */
  leave(projectId: string, socketId: string): boolean {
    const room = this.rooms.get(projectId);
    const userId = room?.get(socketId);
    if (!room || userId === undefined) return false;
    room.delete(socketId);
    if (room.size === 0) this.rooms.delete(projectId);
    return !this.has(room, userId);
  }

  /** Every rikma the socket was in — what a disconnect has to leave. */
  roomsOf(socketId: string): string[] {
    return [...this.rooms].filter(([, room]) => room.has(socketId)).map(([pid]) => pid);
  }

  roster(projectId: string): string[] {
    return [...new Set(this.rooms.get(projectId)?.values() ?? [])].sort();
  }

  private has(room: Map<string, string>, userId: string): boolean {
    for (const uid of room.values()) if (uid === userId) return true;
    return false;
  }
}

const book = new PresenceBook();

/**
 * Wire presence onto a registered user's socket. Meeting guests never get it:
 * they are not rikma members. Inert until P2P_TICKET_SECRET is set.
 */
export function registerPresenceHandlers(io: Server, socket: Socket, presence = book): void {
  const userId: string | undefined = socket.data.userId;
  if (!userId) return;

  const announce = (projectId: string) =>
    io.to(presenceRoom(projectId)).emit('presence:roster', { projectId, members: presence.roster(projectId) });

  socket.on('presence:join', (data: { ticket?: unknown }, ack?: (r: unknown) => void) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const t = verifyP2pTicket(data?.ticket, roomTicketSecret());
    if (!t || t.uid !== String(userId)) return reply({ ok: false, error: 'ticket' });
    socket.join(presenceRoom(t.projectId));
    const changed = presence.join(t.projectId, socket.id, String(userId));
    reply({ ok: true, members: presence.roster(t.projectId) });
    if (changed) announce(t.projectId);
  });

  socket.on('presence:leave', (data: { projectId?: unknown }) => {
    const pid = pidOf(data?.projectId);
    if (!pid) return;
    socket.leave(presenceRoom(pid));
    if (presence.leave(pid, socket.id)) announce(pid);
  });

  socket.on('disconnect', () => {
    for (const pid of presence.roomsOf(socket.id)) {
      if (presence.leave(pid, socket.id)) announce(pid);
    }
  });
}
