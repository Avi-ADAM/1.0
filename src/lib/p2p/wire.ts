/**
 * What travels over one DataChannel in the P2P pilot (docs/PLAN_P2P_PILOT.md §1).
 *
 * One channel carries one file. Control messages are JSON strings; the file
 * itself is binary messages in order (the channel is ordered + reliable, so
 * no sequence numbers are needed):
 *
 *   requester → seeder   {t:'req', hash}
 *   seeder    → requester {t:'meta', hash, size}   then N binary chunks, then {t:'done'}
 *                         or {t:'err', code}        at any point
 *
 * Pure: no RTCPeerConnection here, so the framing and — more importantly —
 * the assembler's refusal to grow past the announced size are testable.
 * That refusal is the memory-safety half of "a peer cannot hurt you"; the
 * hash check is the integrity half.
 */

import { isSha256Hex } from './hash.js';

/**
 * 16 KiB: the largest message size every browser pair (including Safari) has
 * delivered reliably. Throughput comes from keeping the buffer full
 * (`bufferedAmountLowThreshold`), not from bigger messages.
 */
export const CHUNK_SIZE = 16 * 1024;

/** The pilot refuses anything larger over P2P; the origin still serves it. */
export const P2P_MAX_BYTES = 100 * 1024 * 1024;

export type ControlMessage =
  | { t: 'req'; hash: string }
  | { t: 'meta'; hash: string; size: number }
  | { t: 'done' }
  | { t: 'err'; code: 'missing' | 'busy' | 'too-large' | 'aborted' };

const ERR_CODES = new Set(['missing', 'busy', 'too-large', 'aborted']);

export function encodeControl(msg: ControlMessage): string {
  return JSON.stringify(msg);
}

/** Parse a control string from a peer. Anything malformed is null — never a throw. */
export function decodeControl(raw: unknown): ControlMessage | null {
  if (typeof raw !== 'string' || raw.length > 512) return null;
  let m: any;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  switch (m?.t) {
    case 'req':
      return isSha256Hex(m.hash) ? { t: 'req', hash: m.hash } : null;
    case 'meta': {
      const size = Number(m.size);
      if (!isSha256Hex(m.hash) || !Number.isSafeInteger(size) || size < 0) return null;
      return { t: 'meta', hash: m.hash, size };
    }
    case 'done':
      return { t: 'done' };
    case 'err':
      return ERR_CODES.has(m.code) ? { t: 'err', code: m.code } : null;
    default:
      return null;
  }
}

/** Slice a buffer into channel-sized pieces, in order. */
export function* chunks(buffer: ArrayBuffer, size = CHUNK_SIZE): Generator<ArrayBuffer> {
  for (let offset = 0; offset < buffer.byteLength; offset += size) {
    yield buffer.slice(offset, Math.min(offset + size, buffer.byteLength));
  }
}

export type AssemblerState =
  | { phase: 'waiting' }
  | { phase: 'receiving'; received: number; size: number }
  | { phase: 'complete'; data: Uint8Array<ArrayBuffer> }
  | { phase: 'failed'; reason: 'protocol' | 'overflow' | 'short' | 'peer-error' | 'wrong-file' | 'too-large' };

/**
 * Receives one file. Feed it every message in arrival order; it ends in
 * `complete` or `failed` and ignores everything after that.
 */
export class Assembler {
  private parts: Uint8Array[] = [];
  private received = 0;
  private size = -1;
  state: AssemblerState = { phase: 'waiting' };

  constructor(
    private readonly expectedHash: string,
    private readonly maxBytes = P2P_MAX_BYTES
  ) {}

  push(message: string | ArrayBuffer | Uint8Array): AssemblerState {
    if (this.state.phase === 'complete' || this.state.phase === 'failed') return this.state;

    if (typeof message === 'string') {
      const ctl = decodeControl(message);
      if (!ctl) return this.fail('protocol');
      if (ctl.t === 'err') return this.fail('peer-error');
      if (ctl.t === 'meta') {
        if (this.state.phase !== 'waiting') return this.fail('protocol');
        if (ctl.hash !== this.expectedHash) return this.fail('wrong-file');
        if (ctl.size > this.maxBytes) return this.fail('too-large');
        this.size = ctl.size;
        return (this.state = { phase: 'receiving', received: 0, size: ctl.size });
      }
      if (ctl.t === 'done') {
        if (this.state.phase !== 'receiving') return this.fail('protocol');
        if (this.received !== this.size) return this.fail('short');
        const data = new Uint8Array(this.size);
        let offset = 0;
        for (const part of this.parts) {
          data.set(part, offset);
          offset += part.byteLength;
        }
        this.parts = [];
        return (this.state = { phase: 'complete', data });
      }
      return this.fail('protocol');
    }

    // Binary before meta, or past the announced size: the peer is either
    // broken or trying to make us allocate — stop at once, keep nothing.
    if (this.state.phase !== 'receiving') return this.fail('protocol');
    const part = message instanceof Uint8Array ? message : new Uint8Array(message);
    if (this.received + part.byteLength > this.size) return this.fail('overflow');
    this.parts.push(part);
    this.received += part.byteLength;
    return (this.state = { phase: 'receiving', received: this.received, size: this.size });
  }

  private fail(reason: Extract<AssemblerState, { phase: 'failed' }>['reason']): AssemblerState {
    this.parts = [];
    return (this.state = { phase: 'failed', reason });
  }
}
