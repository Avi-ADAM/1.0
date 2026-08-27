import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { verifyInviteToken, meetingRoom } from './guest-invite.js';

const SECRET = 'shared-guest-invite-secret';

/** Mint a token exactly the way the meetings app does. */
function mint(
  payload: Record<string, unknown>,
  secret = SECRET
): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function validPayload(over: Record<string, unknown> = {}) {
  return {
    v: 1,
    m: '42',
    e: 'guest@example.com',
    n: 'Standup',
    exp: Date.now() + 60_000,
    ...over
  };
}

describe('verifyInviteToken', () => {
  beforeEach(() => {
    process.env.GUEST_INVITE_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.GUEST_INVITE_SECRET;
  });

  it('accepts a token minted with the shared secret', () => {
    const result = verifyInviteToken(mint(validPayload()));
    expect(result).toEqual({
      valid: true,
      invite: {
        meetingId: '42',
        email: 'guest@example.com',
        meetingName: 'Standup',
        expiresAt: expect.any(Number)
      }
    });
  });

  it('rejects a token signed with a different secret', () => {
    const result = verifyInviteToken(mint(validPayload(), 'not-the-secret'));
    expect(result).toEqual({ valid: false, error: 'signature' });
  });

  it('rejects a tampered meeting id', () => {
    // The whole point: the meeting id must not be re-writable by its holder.
    const token = mint(validPayload());
    const [, sig] = token.split('.');
    const forged =
      Buffer.from(JSON.stringify(validPayload({ m: '999' }))).toString('base64url') +
      '.' +
      sig;
    expect(verifyInviteToken(forged)).toEqual({ valid: false, error: 'signature' });
  });

  it('rejects an expired invitation', () => {
    const result = verifyInviteToken(mint(validPayload({ exp: Date.now() - 1 })));
    expect(result).toEqual({ valid: false, error: 'expired' });
  });

  it('rejects a bare meeting id (legacy unsigned link)', () => {
    expect(verifyInviteToken('42')).toEqual({ valid: false, error: 'malformed' });
  });

  it('rejects anything that is not a string', () => {
    for (const bad of [undefined, null, 42, {}, []]) {
      expect(verifyInviteToken(bad)).toEqual({ valid: false, error: 'malformed' });
    }
  });

  it('fails closed when no secret is configured', () => {
    // No dev bypass here, unlike the JWT path: an unverified token would let
    // anyone subscribe to any meeting's notifications.
    delete process.env.GUEST_INVITE_SECRET;
    expect(verifyInviteToken(mint(validPayload()))).toEqual({
      valid: false,
      error: 'unconfigured'
    });
  });
});

describe('meetingRoom', () => {
  it('namespaces the room so it cannot collide with space rooms', () => {
    expect(meetingRoom('42')).toBe('meeting:42');
  });
});
