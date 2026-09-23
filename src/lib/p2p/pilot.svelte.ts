/**
 * The P2P pilot for one rikma's library (docs/PLAN_P2P_PILOT.md).
 *
 * One instance per open docs tab. It
 *  - joins the rikma's signaling room with a ticket (membership checked by the
 *    app, re-joined after every socket reconnect),
 *  - seeds: answers other members' `want` for files in this device's cache,
 *  - opens files: cache → a peer → the origin, verifying sha256 on every path
 *    that is not the origin's own authority, and reports one telemetry line
 *    per attempt.
 *
 * Opt-in per device (localStorage). Off, it does nothing at all — no room, no
 * seeding, no telemetry — and files open the stage-1/2 way.
 */

import { browser } from '$app/environment';
import { socketClient } from '$lib/stores/socketClient';
import { cacheUsage, clearCache, getCached, hasCached, putVerified } from './blobCache.js';
import { isSha256Hex, verifySha256 } from './hash.js';
import { P2P_MAX_BYTES } from './wire.js';
import { fetchFromPeer, serveToPeer, type Signal } from './peer.js';
import type { CandidateType, Outcome, P2pAttempt, PeerFailure } from './telemetry.js';

const OPT_IN_KEY = 'lev.p2pPilot.optIn';
/** How long to wait for any member to say "I have it" — H2's clock. */
export const HAVE_WAIT_MS = 2500;
/** A seeder serves at most this many transfers at once. */
const MAX_CONCURRENT_SERVES = 2;
/** Peers tried per open before falling back to the origin. */
const MAX_PEERS_TRIED = 2;

export type PilotStatus = 'off' | 'connecting' | 'joined' | 'unavailable' | 'offline';

export interface OpenableDoc {
  id: string;
  sha256: string;
  privateFile: boolean;
  href: string;
  size: number;
  fileName: string;
  mime: string;
}

export interface OpenResult {
  blob: Blob;
  source: Outcome;
}

const readOptIn = () => {
  try {
    return browser && localStorage.getItem(OPT_IN_KEY) === '1';
  } catch {
    return false;
  }
};

const newReqId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

export class RikmaP2p {
  optedIn = $state(readOptIn());
  status = $state<PilotStatus>('off');
  peers = $state(0);
  usage = $state({ count: 0, bytes: 0 });
  serving = $state(0);
  /** Files this device delivered to other members this session. */
  served = $state(0);

  private iceServers: RTCIceServer[] = [];
  private ticket: { value: string; expiresAt: number } | null = null;
  private offs: Array<() => void> = [];
  private signalHandlers = new Map<string, (data: any) => void>();
  private haveWaiters = new Map<string, (from: string) => void>();

  constructor(private readonly projectId: string) {}

  /** Called by the tab on mount. Returns the teardown. */
  start(): () => void {
    if (!browser) return () => {};
    void this.refreshUsage();
    if (this.optedIn) void this.join();
    return () => this.stop();
  }

  async setOptIn(on: boolean) {
    this.optedIn = on;
    try {
      localStorage.setItem(OPT_IN_KEY, on ? '1' : '0');
    } catch {
      /* private mode — the choice lasts for this page only */
    }
    if (on) await this.join();
    else this.stop();
  }

  async clearLocalCache() {
    await clearCache();
    await this.refreshUsage();
  }

  async refreshUsage() {
    this.usage = await cacheUsage();
  }

  // ─── room ────────────────────────────────────────────────────────────────

  /** 'unavailable' = the server has no pilot configured (404) — hide it. */
  private async fetchTicket(): Promise<'ok' | 'unavailable' | 'error'> {
    try {
      const res = await fetch('/api/v1/p2p/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: this.projectId })
      });
      if (res.status === 404) return 'unavailable';
      if (!res.ok) return 'error';
      const body = await res.json();
      this.ticket = { value: body.ticket, expiresAt: Number(body.expiresAt) };
      this.iceServers = Array.isArray(body.iceServers) ? body.iceServers : [];
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async join() {
    this.stop();
    this.status = 'connecting';
    const got = await this.fetchTicket();
    if (got !== 'ok') {
      this.status = got === 'unavailable' ? 'unavailable' : 'offline';
      return;
    }

    const rejoin = async () => {
      // A reconnect can come an hour later; a stale ticket would be refused.
      if (!this.ticket || this.ticket.expiresAt - Date.now() < 60_000) {
        if ((await this.fetchTicket()) !== 'ok') return;
      }
      const res = await socketClient.request<{ ok: boolean; peers?: number }>('p2p:join', {
        ticket: this.ticket!.value
      });
      if (res?.ok) {
        this.status = 'joined';
        this.peers = res.peers ?? 0;
      } else {
        this.status = 'offline';
      }
    };

    this.offs.push(
      socketClient.onReady(() => void rejoin()),
      socketClient.on('p2p:want', (m) => void this.onWant(m)),
      socketClient.on('p2p:have', (m) => {
        if (m?.projectId !== this.projectId) return;
        this.haveWaiters.get(m.reqId)?.(m.from);
      }),
      socketClient.on('p2p:signal', (m) => {
        if (m?.projectId !== this.projectId) return;
        this.signalHandlers.get(`${m.from}|${m.reqId}`)?.(m.data);
      })
    );
    if (!socketClient.isReady()) this.status = 'offline';
  }

  stop() {
    this.offs.splice(0).forEach((off) => off());
    this.signalHandlers.clear();
    this.haveWaiters.clear();
    if (this.status === 'joined') socketClient.send('p2p:leave', { projectId: this.projectId });
    if (this.status !== 'unavailable') this.status = 'off';
  }

  private signalFor(peer: string, reqId: string): Signal {
    const key = `${peer}|${reqId}`;
    return {
      send: (data) => socketClient.send('p2p:signal', { to: peer, projectId: this.projectId, reqId, data }),
      onData: (handler) => {
        this.signalHandlers.set(key, handler);
        return () => this.signalHandlers.delete(key);
      }
    };
  }

  // ─── seeding ─────────────────────────────────────────────────────────────

  private async onWant(m: any) {
    if (!this.optedIn || this.status !== 'joined') return;
    if (m?.projectId !== this.projectId || !isSha256Hex(m.hash) || typeof m.from !== 'string') return;
    if (this.serving >= MAX_CONCURRENT_SERVES) return;
    if (!(await hasCached(m.hash))) return;

    this.serving += 1;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      this.serving = Math.max(0, this.serving - 1);
    };
    // Set up the answering side *before* saying "have", so the offer that
    // follows finds a handler waiting.
    serveToPeer({
      signal: this.signalFor(m.from, m.reqId),
      iceServers: this.iceServers,
      getBlob: async (hash) => {
        const blob = await getCached(hash);
        if (blob) this.served += 1;
        return blob;
      },
      onDone: done
    });
    socketClient.send('p2p:have', { to: m.from, projectId: this.projectId, reqId: m.reqId });
  }

  /** Put bytes this device just uploaded into the cache, so it seeds them. */
  async seedUploaded(hash: string, file: Blob) {
    if (!this.optedIn || !isSha256Hex(hash)) return;
    await putVerified(hash, file);
    await this.refreshUsage();
  }

  // ─── opening ─────────────────────────────────────────────────────────────

  /** Ask the room; resolve with the socket ids that said "have", in order. */
  private askPeers(hash: string, reqId: string): Promise<{ answered: string[]; failure: PeerFailure }> {
    return new Promise(async (resolve) => {
      if (this.status !== 'joined') return resolve({ answered: [], failure: 'offline' });
      const answered: string[] = [];
      let timer: ReturnType<typeof setTimeout>;
      const settle = () => {
        clearTimeout(timer);
        this.haveWaiters.delete(reqId);
        resolve({ answered, failure: answered.length ? 'none' : 'no-peer' });
      };
      this.haveWaiters.set(reqId, (from) => {
        if (!answered.includes(from)) answered.push(from);
        // The first answer is enough to start; a second one is a fallback.
        if (answered.length === 1) timer = setTimeout(settle, 250);
      });
      const ack = await socketClient.request<{ ok: boolean; peers?: number }>('p2p:want', {
        projectId: this.projectId,
        hash,
        reqId
      });
      if (!ack?.ok) {
        this.haveWaiters.delete(reqId);
        return resolve({ answered: [], failure: 'offline' });
      }
      this.peers = ack.peers ?? this.peers;
      if (!ack.peers) return settle();
      if (!answered.length) timer = setTimeout(settle, HAVE_WAIT_MS);
    });
  }

  private async fromOrigin(doc: OpenableDoc): Promise<Blob> {
    let url = doc.href;
    if (doc.privateFile) {
      const res = await fetch(`${doc.href}?format=json`);
      if (!res.ok) throw new Error(`origin ${res.status}`);
      url = (await res.json()).url;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`origin ${res.status}`);
    return res.blob();
  }

  private report(line: Omit<P2pAttempt, 'v' | 'pid'>) {
    const body: P2pAttempt = { v: 1, pid: this.projectId, ...line };
    fetch('/api/v1/p2p/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => {});
  }

  /**
   * Get a library file's bytes: cache, then peers, then origin. Every path
   * except the origin must match `doc.sha256`; the origin is the authority, so
   * its bytes are delivered even on a mismatch — they just are not cached,
   * and never seeded.
   */
  async open(doc: OpenableDoc): Promise<OpenResult> {
    const t0 = performance.now();
    const ms = () => Math.round(performance.now() - t0);

    const cached = await getCached(doc.sha256);
    if (cached) {
      this.report({ outcome: 'cache', peerFailure: 'none', peersAnswered: 0, candidate: null, bytes: cached.size, ms: ms(), peerMs: null });
      return { blob: cached, source: 'cache' };
    }

    let peerFailure: PeerFailure = 'skipped';
    let peersAnswered = 0;
    let candidate: CandidateType | null = null;
    let peerMs: number | null = null;

    if (doc.size <= P2P_MAX_BYTES) {
      const p0 = performance.now();
      const reqId = newReqId();
      const asked = await this.askPeers(doc.sha256, reqId);
      peersAnswered = asked.answered.length;
      peerFailure = asked.failure;

      for (const peer of asked.answered.slice(0, MAX_PEERS_TRIED)) {
        // fetchFromPeer removes its own signal handler when it settles.
        const result = await fetchFromPeer({
          signal: this.signalFor(peer, reqId),
          iceServers: this.iceServers,
          hash: doc.sha256,
          expectedSize: doc.size
        });
        candidate = result.candidate;
        if (result.ok === true) {
          peerMs = Math.round(performance.now() - p0);
          const blob = new Blob([result.data], { type: doc.mime || 'application/octet-stream' });
          await putVerified(doc.sha256, blob);
          void this.refreshUsage();
          this.report({ outcome: 'peer', peerFailure: 'none', peersAnswered, candidate, bytes: blob.size, ms: ms(), peerMs });
          return { blob, source: 'peer' };
        }
        // jsconfig has no strictNullChecks, so `ok` does not narrow the union.
        if ('failure' in result) peerFailure = result.failure;
      }
      peerMs = Math.round(performance.now() - p0);
    }

    try {
      const blob = await this.fromOrigin(doc);
      if (await verifySha256(blob, doc.sha256)) {
        await putVerified(doc.sha256, blob);
        void this.refreshUsage();
      }
      this.report({ outcome: 'origin', peerFailure, peersAnswered, candidate, bytes: blob.size, ms: ms(), peerMs });
      return { blob, source: 'origin' };
    } catch (e) {
      this.report({ outcome: 'failed', peerFailure, peersAnswered, candidate, bytes: 0, ms: ms(), peerMs });
      throw e;
    }
  }
}

/** Hand a blob to the member as a download under its real name. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'file';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
