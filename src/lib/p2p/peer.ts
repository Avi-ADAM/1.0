/**
 * One file over one WebRTC connection (docs/PLAN_P2P_PILOT.md §1).
 *
 * Both halves live here so they cannot drift: `fetchFromPeer` (the member who
 * wants the file — makes the offer, opens the channel, verifies what arrives)
 * and `serveToPeer` (the member who has it — answers, streams from the local
 * cache with backpressure). Signaling is injected as a tiny `Signal` pipe, so
 * this module knows nothing about socket.io.
 *
 * A connection never outlives its file: set up, transfer, close. That keeps
 * the pilot's numbers honest — each attempt pays the full ICE cost, which is
 * exactly what H1 is about.
 */

import { Assembler, CHUNK_SIZE, P2P_MAX_BYTES, chunks, decodeControl, encodeControl } from './wire.js';
import { verifySha256 } from './hash.js';
import { classifyCandidate, type CandidateType, type PeerFailure } from './telemetry.js';

/** The two-way signaling pipe for one (peer, request) pair. */
export interface Signal {
  send(data: unknown): void;
  onData(handler: (data: any) => void): () => void;
}

export type PeerResult =
  | { ok: true; data: Uint8Array<ArrayBuffer>; candidate: CandidateType }
  | { ok: false; failure: Exclude<PeerFailure, 'none' | 'no-peer' | 'offline' | 'skipped'>; candidate: CandidateType | null };

/** How long ICE may take before we call the path unreachable (H1's failure). */
export const ICE_TIMEOUT_MS = 8000;
/** A floor of 250 KB/s after connecting; slower than that, the origin wins anyway. */
const transferBudgetMs = (size: number) => 5000 + (size / (250 * 1024)) * 1000;

type SdpOrIce = { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit | null };

function wire(pc: RTCPeerConnection, signal: Signal): () => void {
  pc.onicecandidate = (e) => signal.send({ candidate: e.candidate ? e.candidate.toJSON() : null } satisfies SdpOrIce);
  // A candidate can overtake the description it belongs to (the two sides
  // trickle independently); addIceCandidate would throw, so hold it until the
  // remote description is in place.
  const early: RTCIceCandidateInit[] = [];
  return signal.onData(async (msg: SdpOrIce) => {
    try {
      if (msg?.sdp) {
        await pc.setRemoteDescription(msg.sdp);
        for (const c of early.splice(0)) await pc.addIceCandidate(c).catch(() => {});
        if (msg.sdp.type === 'offer') {
          await pc.setLocalDescription(await pc.createAnswer());
          signal.send({ sdp: pc.localDescription!.toJSON() } satisfies SdpOrIce);
        }
      } else if (msg && 'candidate' in msg && msg.candidate) {
        if (!pc.remoteDescription) early.push(msg.candidate);
        else await pc.addIceCandidate(msg.candidate);
      }
    } catch {
      /* a bad candidate or late description — ICE simply fails to connect */
    }
  });
}

async function candidateOf(pc: RTCPeerConnection): Promise<CandidateType> {
  try {
    const stats = await pc.getStats();
    return classifyCandidate(stats.values());
  } catch {
    return 'unknown';
  }
}

/**
 * Ask one peer for one file. Resolves — never rejects — with the verified
 * bytes or the reason it did not work, and always closes the connection.
 */
export function fetchFromPeer(opts: {
  signal: Signal;
  iceServers: RTCIceServer[];
  hash: string;
  expectedSize?: number;
}): Promise<PeerResult> {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: opts.iceServers });
    const dc = pc.createDataChannel('file', { ordered: true });
    dc.binaryType = 'arraybuffer';
    const asm = new Assembler(opts.hash);
    let connected = false;
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const unwire = wire(pc, opts.signal);
    const finish = async (r: PeerResult | (() => Promise<PeerResult>)) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const result = typeof r === 'function' ? await r() : r;
      unwire();
      try {
        dc.close();
        pc.close();
      } catch {
        /* already closed */
      }
      resolve(result);
    };

    // Phase 1: the path. No open channel within the ICE budget = unreachable.
    timer = setTimeout(() => finish({ ok: false, failure: 'ice', candidate: null }), ICE_TIMEOUT_MS);

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') finish({ ok: false, failure: connected ? 'timeout' : 'ice', candidate: null });
    };

    dc.onopen = () => {
      connected = true;
      clearTimeout(timer);
      // Phase 2: the transfer, budgeted by size once we know it.
      timer = setTimeout(
        () => finish(async () => ({ ok: false, failure: 'timeout', candidate: await candidateOf(pc) })),
        transferBudgetMs(opts.expectedSize ?? P2P_MAX_BYTES)
      );
      dc.send(encodeControl({ t: 'req', hash: opts.hash }));
    };

    dc.onmessage = (e) => {
      const state = asm.push(e.data);
      if (state.phase === 'failed') {
        const failure = state.reason === 'peer-error' || state.reason === 'too-large' ? 'refused' : 'protocol';
        finish(async () => ({ ok: false, failure, candidate: await candidateOf(pc) }));
      } else if (state.phase === 'complete') {
        const data = state.data;
        finish(async () => {
          const candidate = await candidateOf(pc);
          return (await verifySha256(data, opts.hash))
            ? { ok: true, data, candidate }
            : { ok: false, failure: 'hash', candidate };
        });
      }
    };

    dc.onclose = () => {
      if (!settled && connected) finish({ ok: false, failure: 'protocol', candidate: null });
    };

    (async () => {
      try {
        await pc.setLocalDescription(await pc.createOffer());
        opts.signal.send({ sdp: pc.localDescription!.toJSON() } satisfies SdpOrIce);
      } catch {
        finish({ ok: false, failure: 'ice', candidate: null });
      }
    })();
  });
}

/**
 * Answer one peer's offer and stream the one file it asks for, if we have it.
 * `getBlob` must return only verified bytes (the cache guarantees that).
 */
export function serveToPeer(opts: {
  signal: Signal;
  iceServers: RTCIceServer[];
  getBlob: (hash: string) => Promise<Blob | null>;
  onDone?: () => void;
}): () => void {
  const pc = new RTCPeerConnection({ iceServers: opts.iceServers });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(hardStop);
    clearTimeout(noShow);
    unwire();
    try {
      pc.close();
    } catch {
      /* already closed */
    }
    opts.onDone?.();
  };
  // Nobody holds a seeder's connection open forever…
  const hardStop = setTimeout(close, ICE_TIMEOUT_MS + transferBudgetMs(P2P_MAX_BYTES));
  // …and a "have" that the requester never followed up (it already took
  // another peer) frees its serving slot as soon as ICE would have given up.
  const noShow = setTimeout(close, ICE_TIMEOUT_MS * 2);
  const unwire = wire(pc, opts.signal);

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') close();
  };

  pc.ondatachannel = (e) => {
    clearTimeout(noShow);
    const dc = e.channel;
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = 1024 * 1024;
    let served = false;

    dc.onmessage = async (msg) => {
      const ctl = decodeControl(msg.data);
      if (served || ctl?.t !== 'req') return;
      served = true;
      const blob = await opts.getBlob(ctl.hash);
      if (!blob) return dc.send(encodeControl({ t: 'err', code: 'missing' }));
      if (blob.size > P2P_MAX_BYTES) return dc.send(encodeControl({ t: 'err', code: 'too-large' }));

      dc.send(encodeControl({ t: 'meta', hash: ctl.hash, size: blob.size }));
      const buffer = await blob.arrayBuffer();
      for (const piece of chunks(buffer, CHUNK_SIZE)) {
        if (closed || dc.readyState !== 'open') return;
        if (dc.bufferedAmount > 4 * 1024 * 1024) {
          await new Promise<void>((res) => {
            dc.onbufferedamountlow = () => {
              dc.onbufferedamountlow = null;
              res();
            };
          });
        }
        dc.send(piece);
      }
      dc.send(encodeControl({ t: 'done' }));
    };
    // The requester closes once it has verified the file.
    dc.onclose = close;
  };

  return close;
}
