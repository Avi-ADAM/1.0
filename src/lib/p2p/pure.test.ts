import { describe, it, expect } from 'vitest';
import { isSha256Hex, sha256Hex, verifySha256 } from './hash.js';
import { Assembler, chunks, decodeControl, encodeControl, CHUNK_SIZE } from './wire.js';
import { planEviction } from './cachePolicy.js';
import { classifyCandidate, sizeBucket, validateAttempt } from './telemetry.js';

const bytes = (n: number, seed = 1) => {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = (i * 31 + seed) & 0xff;
  return a;
};

describe('hash', () => {
  it('matches the known sha256 of "abc"', async () => {
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('verifies only an exact match, and only a well-formed hash', async () => {
    const data = bytes(1000);
    const h = await sha256Hex(data);
    expect(await verifySha256(data, h)).toBe(true);
    expect(await verifySha256(bytes(1000, 2), h)).toBe(false);
    expect(await verifySha256(data, h.toUpperCase())).toBe(false);
    expect(isSha256Hex('x'.repeat(64))).toBe(false);
  });
});

describe('wire', () => {
  const HASH = 'a'.repeat(64);

  it('round-trips control messages and rejects junk without throwing', () => {
    const meta = { t: 'meta', hash: HASH, size: 10 } as const;
    expect(decodeControl(encodeControl(meta))).toEqual(meta);
    expect(decodeControl('{')).toBeNull();
    expect(decodeControl(JSON.stringify({ t: 'meta', hash: 'nope', size: 1 }))).toBeNull();
    expect(decodeControl(JSON.stringify({ t: 'meta', hash: HASH, size: -1 }))).toBeNull();
    expect(decodeControl(JSON.stringify({ t: 'err', code: 'whatever' }))).toBeNull();
    expect(decodeControl('x'.repeat(600))).toBeNull();
    expect(decodeControl(42)).toBeNull();
  });

  it('slices and reassembles a file byte for byte', () => {
    const file = bytes(CHUNK_SIZE * 3 + 123);
    const asm = new Assembler(HASH);
    asm.push(encodeControl({ t: 'meta', hash: HASH, size: file.byteLength }));
    const pieces = [...chunks(file.buffer)];
    expect(pieces).toHaveLength(4);
    for (const p of pieces) asm.push(p);
    const end = asm.push(encodeControl({ t: 'done' }));
    expect(end.phase).toBe('complete');
    expect((end as any).data).toEqual(file);
  });

  it('refuses to grow past the announced size', () => {
    const asm = new Assembler(HASH);
    asm.push(encodeControl({ t: 'meta', hash: HASH, size: 10 }));
    expect(asm.push(bytes(11)).phase).toBe('failed');
    expect((asm.state as any).reason).toBe('overflow');
  });

  it('refuses binary before meta, a short file, a different file, and an oversize one', () => {
    expect(new Assembler(HASH).push(bytes(4)).phase).toBe('failed');

    const short = new Assembler(HASH);
    short.push(encodeControl({ t: 'meta', hash: HASH, size: 10 }));
    short.push(bytes(5));
    expect((short.push(encodeControl({ t: 'done' })) as any).reason).toBe('short');

    const other = new Assembler(HASH);
    expect((other.push(encodeControl({ t: 'meta', hash: 'b'.repeat(64), size: 1 })) as any).reason).toBe(
      'wrong-file'
    );

    const big = new Assembler(HASH, 100);
    expect((big.push(encodeControl({ t: 'meta', hash: HASH, size: 101 })) as any).reason).toBe('too-large');
  });

  it('stops at a peer error and ignores anything after the end', () => {
    const asm = new Assembler(HASH);
    expect((asm.push(encodeControl({ t: 'err', code: 'busy' })) as any).reason).toBe('peer-error');
    expect(asm.push(encodeControl({ t: 'meta', hash: HASH, size: 1 })).phase).toBe('failed');
  });

  it('handles an empty file', () => {
    const asm = new Assembler(HASH);
    asm.push(encodeControl({ t: 'meta', hash: HASH, size: 0 }));
    expect(asm.push(encodeControl({ t: 'done' })).phase).toBe('complete');
  });
});

describe('planEviction', () => {
  const e = (hash: string, size: number, lastUsed: number) => ({ hash, size, lastUsed });

  it('evicts least recently used until the newcomer fits', () => {
    const plan = planEviction([e('a', 40, 3), e('b', 40, 1), e('c', 40, 2)], 100, 50);
    expect(plan).toEqual({ fits: true, evict: ['b', 'c'] });
  });

  it('evicts nothing when there is room', () => {
    expect(planEviction([e('a', 10, 1)], 100, 50)).toEqual({ fits: true, evict: [] });
  });

  it('never evicts the entry being kept, and says so when it cannot fit', () => {
    expect(planEviction([e('a', 90, 1)], 100, 20, 'a')).toEqual({ fits: false });
    expect(planEviction([], 100, 101)).toEqual({ fits: false });
  });
});

describe('telemetry', () => {
  const good = {
    v: 1,
    pid: '82',
    outcome: 'peer',
    peerFailure: 'none',
    peersAnswered: 2,
    candidate: 'srflx',
    bytes: 5000,
    ms: 900,
    peerMs: 700
  };

  it('keeps a well-formed line and nothing else from it', () => {
    expect(validateAttempt({ ...good, userId: '7', fileName: 'secret.pdf' })).toEqual(good);
  });

  it('rejects unknown outcomes, a non-numeric project and a wrong version', () => {
    expect(validateAttempt({ ...good, outcome: 'magic' })).toBeNull();
    expect(validateAttempt({ ...good, pid: '82; drop' })).toBeNull();
    expect(validateAttempt({ ...good, v: 2 })).toBeNull();
    expect(validateAttempt(null)).toBeNull();
  });

  it('clamps numbers and drops an unknown candidate type', () => {
    const out = validateAttempt({ ...good, ms: 1e12, candidate: 'wormhole' });
    expect(out?.ms).toBe(600000);
    expect(out?.candidate).toBeNull();
  });

  it('reads the selected path out of getStats, spec-style and legacy-style', () => {
    const spec = [
      { id: 'T', type: 'transport', selectedCandidatePairId: 'P' },
      { id: 'P', type: 'candidate-pair', localCandidateId: 'L' },
      { id: 'L', type: 'local-candidate', candidateType: 'relay' }
    ];
    expect(classifyCandidate(spec)).toBe('relay');

    const firefox = [
      { id: 'P', type: 'candidate-pair', selected: true, state: 'succeeded', localCandidateId: 'L' },
      { id: 'L', type: 'local-candidate', candidateType: 'host' }
    ];
    expect(classifyCandidate(firefox)).toBe('host');
    expect(classifyCandidate([])).toBe('unknown');
  });

  it('buckets sizes', () => {
    expect(sizeBucket(1000)).toBe('<256K');
    expect(sizeBucket(30 * 1024 * 1024)).toBe('20M+');
  });
});
