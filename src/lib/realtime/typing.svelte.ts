/**
 * "X is typing…" in one forum — the client half of socket-server/src/typing.ts
 * (docs/inprogress/SPEC_SOCKET_REALTIME.md stage 5).
 *
 * The seat comes from `getForumTypingTicket` (participants only; nobody with
 * presence switched off). While the person types, a ping goes out at most
 * every PING_MS; sending or leaving the box says "stopped". On the receiving
 * side a "typing" that is not refreshed within EXPIRE_MS fades on its own, so
 * a lost "stopped" (a closed laptop) never leaves a ghost typing forever.
 */

import { browser } from '$app/environment';
import { socketClient } from '$lib/stores/socketClient';
import { executeAction } from '$lib/client/actionClient';

export const PING_MS = 3_000;
export const EXPIRE_MS = 6_000;

type Ticket = { value: string; expiresAt: number };

export class ForumTyping {
  /** Who else is typing now: uid → the name their ticket carries. */
  typers = $state<Record<string, string>>({});

  private ticket: Ticket | null = null;
  private joined = false;
  private lastPing = 0;
  private offs: Array<() => void> = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly forumId: string) {}

  /** The names to show, in arrival order; '' for one the server could not name. */
  get names(): string[] {
    return Object.values(this.typers);
  }

  /** Called by the chat on mount. Returns the teardown. */
  start(): () => void {
    if (!browser || !/^\d+$/.test(this.forumId)) return () => {};
    void this.enter();
    return () => this.stop();
  }

  /** The person typed. Cheap to call on every keystroke. */
  ping(now = Date.now()) {
    if (!this.joined || now - this.lastPing < PING_MS) return;
    this.lastPing = now;
    socketClient.send('typing:set', { forumId: this.forumId, typing: true });
  }

  /** Sent, cleared, or left the box. */
  stopped() {
    if (!this.joined || this.lastPing === 0) return;
    this.lastPing = 0;
    socketClient.send('typing:set', { forumId: this.forumId, typing: false });
  }

  private async fetchTicket(): Promise<boolean> {
    try {
      const res = await executeAction('getForumTypingTicket', { forumId: this.forumId });
      const d = res?.success ? (res.data as any) : null;
      if (!d?.available || d.hidden || typeof d.ticket !== 'string') return false;
      this.ticket = { value: d.ticket, expiresAt: Number(d.expiresAt) };
      return true;
    } catch {
      return false;
    }
  }

  private async enter() {
    if (!(await this.fetchTicket())) return;
    const join = async () => {
      this.joined = false;
      // A reconnect can come an hour later; a stale ticket would be refused.
      if (!this.ticket || this.ticket.expiresAt - Date.now() < 60_000) {
        if (!(await this.fetchTicket())) return;
      }
      const res = await socketClient.request<{ ok: boolean }>('typing:join', { ticket: this.ticket!.value });
      this.joined = !!res?.ok;
    };
    this.offs.push(
      socketClient.onReady(() => void join()),
      socketClient.on('typing:update', (m: { forumId?: unknown; uid?: unknown; name?: unknown; typing?: unknown }) => {
        if (String(m?.forumId) !== this.forumId || m?.uid == null) return;
        this.mark(String(m.uid), typeof m.name === 'string' ? m.name : '', m.typing === true);
      }),
      socketClient.on('disconnect', () => {
        this.joined = false;
        this.clear();
      })
    );
  }

  private mark(uid: string, name: string, typing: boolean) {
    clearTimeout(this.timers.get(uid));
    this.timers.delete(uid);
    if (!typing) {
      const { [uid]: _gone, ...rest } = this.typers;
      this.typers = rest;
      return;
    }
    this.typers = { ...this.typers, [uid]: name };
    this.timers.set(
      uid,
      setTimeout(() => this.mark(uid, name, false), EXPIRE_MS)
    );
  }

  private clear() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.typers = {};
  }

  private stop() {
    this.stopped();
    this.offs.splice(0).forEach((off) => off());
    if (this.joined) socketClient.send('typing:leave', { forumId: this.forumId });
    this.joined = false;
    this.clear();
  }
}
