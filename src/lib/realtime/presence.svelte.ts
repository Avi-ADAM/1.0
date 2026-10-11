/**
 * "Who is here" in a rikma — the client half of socket-server/src/presence.ts
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md, the separate stage).
 *
 * Decided 2026-10-12: visible to the rikma's members by default, anyone can
 * switch it off, and it is symmetric — whoever hides is not seen and does not
 * see. The symmetry is not enforced here: a hidden member gets no ticket from
 * `/api/v1/presence/ticket`, and without a seat in the room the roster never
 * reaches them. This class only follows what the server says.
 *
 * Same room mechanics as the P2P pilot (`$lib/p2p/pilot.svelte.ts`): a signed
 * ticket, re-joined after every socket reconnect, refreshed before it expires.
 */

import { browser } from '$app/environment';
import { socketClient } from '$lib/stores/socketClient';
import { executeAction } from '$lib/client/actionClient';
import { realtimeBus } from './bus.svelte';

/**
 * - `here` — in the room; `members` is live.
 * - `hidden` — this member switched presence off.
 * - `unavailable` — the server has no ticket secret; show nothing.
 * - `offline` — no socket, or the ticket could not be had; try again on reconnect.
 */
export type PresenceStatus = 'off' | 'connecting' | 'here' | 'hidden' | 'unavailable' | 'offline';

type TicketAnswer = { kind: 'ticket'; value: string; expiresAt: number } | { kind: 'hidden' | 'unavailable' | 'error' };

export class RikmaPresence {
  status = $state<PresenceStatus>('off');
  /** User ids in the room, including this one. */
  members = $state<string[]>([]);
  /** A hide/show write in flight. */
  busy = $state(false);

  private ticket: { value: string; expiresAt: number } | null = null;
  private roomOffs: Array<() => void> = [];
  private offUser: (() => void) | null = null;

  constructor(
    private readonly projectId: string,
    private readonly uid: string
  ) {}

  /** The other members who are here right now. */
  get others(): string[] {
    return this.members.filter((m) => m !== this.uid);
  }

  /** Called by the component on mount. Returns the teardown. */
  start(): () => void {
    if (!browser) return () => {};
    void this.enter();
    // The switch was flipped in another tab or device: `updateUserBasic`
    // publishes `user:<me>` to this member's own devices.
    this.offUser = realtimeBus.subscribe([`user:${this.uid}`], () => void this.recheck());
    return () => {
      this.offUser?.();
      this.offUser = null;
      this.leave();
      this.status = 'off';
    };
  }

  /** Switch presence off (or back on). Off: not seen, and not seeing. */
  async setHidden(hidden: boolean): Promise<boolean> {
    this.busy = true;
    try {
      const res = await executeAction('updateUserBasic', { hidePresence: hidden });
      if (!res?.success) return false;
      if (hidden) {
        this.leave();
        this.status = 'hidden';
      } else {
        await this.enter();
      }
      return true;
    } finally {
      this.busy = false;
    }
  }

  // ─── room ────────────────────────────────────────────────────────────────

  private async fetchTicket(): Promise<TicketAnswer> {
    try {
      const res = await fetch('/api/v1/presence/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: this.projectId })
      });
      if (res.status === 404) return { kind: 'unavailable' };
      if (!res.ok) return { kind: 'error' };
      const body = await res.json();
      if (body?.hidden) return { kind: 'hidden' };
      if (typeof body?.ticket !== 'string') return { kind: 'error' };
      return { kind: 'ticket', value: body.ticket, expiresAt: Number(body.expiresAt) };
    } catch {
      return { kind: 'error' };
    }
  }

  private settle(answer: TicketAnswer): boolean {
    if (answer.kind === 'ticket') {
      this.ticket = { value: answer.value, expiresAt: answer.expiresAt };
      return true;
    }
    this.ticket = null;
    this.status = answer.kind === 'hidden' ? 'hidden' : answer.kind === 'unavailable' ? 'unavailable' : 'offline';
    return false;
  }

  private async enter() {
    this.leave();
    this.status = 'connecting';
    if (!this.settle(await this.fetchTicket())) return;

    const join = async () => {
      // A reconnect can come an hour later; a stale ticket would be refused.
      if (!this.ticket || this.ticket.expiresAt - Date.now() < 60_000) {
        if (!this.settle(await this.fetchTicket())) return;
      }
      const res = await socketClient.request<{ ok: boolean; members?: string[] }>('presence:join', {
        ticket: this.ticket!.value
      });
      if (res?.ok) {
        this.status = 'here';
        this.members = Array.isArray(res.members) ? res.members.map(String) : [];
      } else {
        this.status = 'offline';
      }
    };

    this.roomOffs.push(
      socketClient.onReady(() => void join()),
      socketClient.on('presence:roster', (m: { projectId?: unknown; members?: unknown }) => {
        if (String(m?.projectId) !== this.projectId || !Array.isArray(m.members)) return;
        this.members = m.members.map(String);
      }),
      socketClient.on('disconnect', () => {
        // The server dropped us from the room with the socket; onReady re-joins.
        if (this.status === 'here') this.status = 'offline';
        this.members = [];
      })
    );
    if (!socketClient.isReady()) this.status = 'offline';
  }

  private leave() {
    this.roomOffs.splice(0).forEach((off) => off());
    if (this.status === 'here') socketClient.send('presence:leave', { projectId: this.projectId });
    this.members = [];
  }

  /** Something about me changed elsewhere; follow it only if it was this switch. */
  private async recheck() {
    if (this.busy) return;
    const answer = await this.fetchTicket();
    if (answer.kind === 'hidden' && this.status !== 'hidden') {
      this.leave();
      this.status = 'hidden';
    } else if (answer.kind === 'ticket' && this.status === 'hidden') {
      await this.enter();
    }
  }
}
