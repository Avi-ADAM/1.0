import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/oauth/secret.js', async () => {
  const crypto = await import('crypto');
  return {
    uploadSessionKey: () => Buffer.alloc(32, 7),
    b64url: (b: Buffer | string) => Buffer.from(b).toString('base64url'),
    fromB64url: (s: string) => Buffer.from(s, 'base64url'),
    safeEqual: (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  };
});

const { mintUploadSession, verifyUploadSession, sessionCaption, clampMaxFiles } = await import('./uploadSession');

const NOW = 1_800_000_000_000;

describe('upload session tokens', () => {
  it('round-trips who, where, how many and until when', () => {
    const { token, session } = mintUploadSession({ userId: '42', projectId: '89', productId: '5', maxFiles: 4, now: NOW });
    const check = verifyUploadSession(token, NOW + 1000);
    expect(check).toEqual({ ok: true, session });
    expect(session.expiresAt).toBe(NOW + 60 * 60_000);
    expect(token.length).toBeLessThan(110);
  });

  it('an expired token is refused for upload', () => {
    const { token } = mintUploadSession({ userId: '42', projectId: '89', now: NOW });
    expect(verifyUploadSession(token, NOW + 61 * 60_000)).toEqual({ ok: false, reason: 'expired' });
  });

  it('an edited token fails the signature', () => {
    const { token } = mintUploadSession({ userId: '42', projectId: '89', maxFiles: 2, now: NOW });
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(Buffer.from(payload, 'base64url').toString().replace('.2.', '.20.')).toString('base64url');
    expect(verifyUploadSession(`${forged}.${sig}`, NOW)).toEqual({ ok: false, reason: 'signature' });
  });

  it('garbage is malformed, not a crash', () => {
    expect(verifyUploadSession('nope', NOW).ok).toBe(false);
    expect(verifyUploadSession(undefined, NOW).ok).toBe(false);
  });

  it('caps the file count and rejects non-numeric ids', () => {
    expect(clampMaxFiles(999)).toBe(20);
    expect(clampMaxFiles(0)).toBe(10);
    expect(() => mintUploadSession({ userId: '42', projectId: '89; drop' })).toThrow();
  });

  it('each session has its own caption', () => {
    const a = mintUploadSession({ userId: '1', projectId: '2' }).session;
    const b = mintUploadSession({ userId: '1', projectId: '2' }).session;
    expect(sessionCaption(a.nonce)).not.toBe(sessionCaption(b.nonce));
  });
});
