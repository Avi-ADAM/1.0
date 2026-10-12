/**
 * "X is typing…" in a forum (1.0main docs/inprogress/SPEC_SOCKET_REALTIME.md stage 5).
 *
 * A member with a forum open sits in `typing:<forumId>`, seated by a forum
 * ticket the main app minted after its own participant check
 * (`getForumTypingTicket`, the same rule that guards posting there). Nothing
 * is stored: a `typing:set` is relayed to the others in the room, and a socket
 * that goes away says "stopped" on its own way out. Clients expire a "typing"
 * they stop hearing about, so a lost "stopped" only lingers for seconds.
 *
 * Only `{ forumId, uid, name, typing }` travels — the name from the signed
 * ticket, never a character of the text.
 */

import type { Server, Socket } from 'socket.io';
import { RateLimiter, roomTicketSecret, verifyRoomTicket } from './p2p.js';

export const typingRoom = (forumId: string) => `typing:${forumId}`;

const fidOf = (v: unknown) => (typeof v === 'string' && /^\d{1,12}$/.test(v) ? v : null);

/** Typing pings arrive every few seconds while someone types; this is generous. */
const pings = new RateLimiter(60);

export function registerTypingHandlers(io: Server, socket: Socket, limiter = pings): void {
  const userId: string | undefined = socket.data.userId;
  if (!userId) return;
  const uid = String(userId);
  // The signed name per forum this socket joined — what the others read.
  const names = (): Record<string, string> => (socket.data.typingNames ??= {});
  const update = (forumId: string, typing: boolean) => ({ forumId, uid, name: names()[forumId] ?? '', typing });

  socket.on('typing:join', (data: { ticket?: unknown }, ack?: (r: unknown) => void) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const t = verifyRoomTicket(data?.ticket, roomTicketSecret(), 'forum');
    if (!t || t.uid !== uid) return reply({ ok: false, error: 'ticket' });
    socket.join(typingRoom(t.projectId));
    names()[t.projectId] = t.name ?? '';
    reply({ ok: true });
  });

  socket.on('typing:leave', (data: { forumId?: unknown }) => {
    const fid = fidOf(data?.forumId);
    if (!fid) return;
    const room = typingRoom(fid);
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit('typing:update', update(fid, false));
    socket.leave(room);
  });

  socket.on('typing:set', (data: { forumId?: unknown; typing?: unknown }) => {
    const fid = fidOf(data?.forumId);
    if (!fid || typeof data?.typing !== 'boolean') return;
    const room = typingRoom(fid);
    if (!socket.rooms.has(room)) return;
    if (data.typing && !limiter.allow(socket.id)) return;
    socket.to(room).emit('typing:update', update(fid, data.typing));
  });

  // `disconnecting`, not `disconnect`: the rooms are still on the socket here.
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (!room.startsWith('typing:')) continue;
      socket.to(room).emit('typing:update', update(room.slice('typing:'.length), false));
    }
    limiter.forget(socket.id);
  });
}
