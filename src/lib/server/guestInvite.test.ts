/**
 * The invite token is a contract between two repos: it is minted in one app and
 * verified in the other, with nothing but a shared secret in between. Nobody
 * finds a drift in the payload shape by reading the code — it shows up as a
 * guest link that silently refuses to open. These tests pin the shape.
 */

vi.mock('$env/dynamic/private', () => ({
  env: { GUEST_INVITE_SECRET: 'test-secret' }
}));

import { describe, it, expect, vi } from 'vitest';
import { createInviteToken, verifyInviteToken, isSignedToken } from './guestInvite.js';

describe('guest invite tokens', () => {
  it('round-trips a minted token', () => {
    const { token, expiresAt } = createInviteToken({
      meetingId: '4321',
      email: 'Someone@Example.COM',
      meetingName: 'דמו אישי · רות'
    });

    expect(isSignedToken(token)).toBe(true);

    const res = verifyInviteToken(token);
    expect(res.valid).toBe(true);
    expect(res.payload).toMatchObject({
      meetingId: '4321',
      // Emails are normalised at mint time, so the registration-side comparison
      // in importInvitedMeeting can be a plain lowercase equality.
      email: 'someone@example.com',
      meetingName: 'דמו אישי · רות'
    });
    expect(res.payload?.expiresAt).toBe(expiresAt);
  });

  it('produces the payload shape the meetings app decodes (v/m/e/n/exp)', () => {
    const { token } = createInviteToken({
      meetingId: 7,
      email: 'a@b.co',
      meetingName: 'X'
    });
    const payload = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString('utf8')
    );
    expect(Object.keys(payload).sort()).toEqual(['e', 'exp', 'm', 'n', 'v']);
    expect(payload.v).toBe(1);
    expect(payload.m).toBe('7');
  });

  it('rejects a tampered payload', () => {
    const { token } = createInviteToken({ meetingId: '1', email: 'a@b.co' });
    const forged = Buffer.from(JSON.stringify({ v: 1, m: '999', e: 'a@b.co', n: '', exp: Date.now() + 1000 }))
      .toString('base64url');

    const res = verifyInviteToken(`${forged}.${token.split('.')[1]}`);
    expect(res.valid).toBe(false);
    expect(res.error).toBe('bad_signature');
  });

  it('rejects an expired token', () => {
    const { token } = createInviteToken({
      meetingId: '1',
      email: 'a@b.co',
      ttlMs: -1
    });
    const res = verifyInviteToken(token);
    expect(res.valid).toBe(false);
    expect(res.error).toBe('expired');
  });

  it('treats a bare meeting id as unsigned, not as a bad signature', () => {
    // The meetings app still honours legacy links whose token *is* the meeting
    // id; verification must say "unsigned" so that path stays distinguishable.
    const res = verifyInviteToken('12345');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('unsigned');
  });
});
