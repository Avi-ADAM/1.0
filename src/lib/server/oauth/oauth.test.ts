import { describe, it, expect, beforeEach, vi } from 'vitest';

// The modules read OAUTH_SECRET / MCP_OAUTH_REDIRECT_HOSTS through
// $env/dynamic/private, which has no value under vitest.
vi.mock('$env/dynamic/private', () => ({
  env: {
    OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789',
    MCP_OAUTH_REDIRECT_HOSTS: 'claude.ai,*.claude.ai'
  }
}));

const { mintClientId, parseClientId, isRegisteredRedirectUri } = await import('./clients.js');
const { mintCode, redeemCode, __resetReplayCache } = await import('./codes.js');
const { challengeFor, verifyChallenge, isSupportedMethod } = await import('./pkce.js');
const { isAllowedRedirectUri } = await import('./redirects.js');
const { signAuthRequest, verifyAuthRequest, redirectWith } = await import('./authreq.js');

const CB = 'https://claude.ai/api/mcp/auth_callback';

describe('redirect allowlist', () => {
  it('accepts an allowlisted https host and its single-label subdomains', () => {
    expect(isAllowedRedirectUri(CB)).toBe(true);
    expect(isAllowedRedirectUri('https://foo.claude.ai/cb')).toBe(true);
  });

  it('refuses a deeper subdomain than the wildcard allows', () => {
    expect(isAllowedRedirectUri('https://a.b.claude.ai/cb')).toBe(false);
  });

  it('refuses lookalike hosts, http, and fragments', () => {
    expect(isAllowedRedirectUri('https://claude.ai.evil.com/cb')).toBe(false);
    expect(isAllowedRedirectUri('https://notclaude.ai/cb')).toBe(false);
    expect(isAllowedRedirectUri('http://claude.ai/cb')).toBe(false);
    expect(isAllowedRedirectUri('https://claude.ai/cb#frag')).toBe(false);
  });

  it('still allows the CLI loopback callback', () => {
    expect(isAllowedRedirectUri('http://localhost:4242/callback')).toBe(true);
    expect(isAllowedRedirectUri('http://127.0.0.1:4242/callback')).toBe(true);
  });
});

describe('client_id', () => {
  it('round-trips a registration', () => {
    const id = mintClientId({ redirect_uris: [CB], client_name: 'Claude', iat: 1 });
    expect(parseClientId(id)?.client_name).toBe('Claude');
  });

  it('rejects a tampered payload', () => {
    const id = mintClientId({ redirect_uris: [CB], client_name: 'Claude', iat: 1 });
    const forged = Buffer.from(
      JSON.stringify({ redirect_uris: ['https://evil.com/cb'], client_name: 'x', iat: 1 })
    ).toString('base64url');
    expect(parseClientId(`${forged}.${id.split('.')[1]}`)).toBeNull();
    expect(parseClientId('garbage')).toBeNull();
  });

  it('matches redirect_uri exactly, not by prefix', () => {
    const client = { redirect_uris: [CB], client_name: 'Claude', iat: 1 };
    expect(isRegisteredRedirectUri(client, CB)).toBe(true);
    expect(isRegisteredRedirectUri(client, CB + '/../evil')).toBe(false);
    expect(isRegisteredRedirectUri(client, 'https://claude.ai/api/mcp/auth_callback2')).toBe(false);
  });
});

describe('PKCE', () => {
  const verifier = 'a'.repeat(43);

  it('verifies a correct S256 challenge', () => {
    expect(verifyChallenge(verifier, challengeFor(verifier))).toBe(true);
  });

  it('rejects a wrong verifier and out-of-range lengths', () => {
    expect(verifyChallenge('b'.repeat(43), challengeFor(verifier))).toBe(false);
    expect(verifyChallenge('a'.repeat(42), challengeFor('a'.repeat(42)))).toBe(false);
    expect(verifyChallenge('a'.repeat(129), challengeFor('a'.repeat(129)))).toBe(false);
  });

  it('refuses plain and an absent method', () => {
    expect(isSupportedMethod('S256')).toBe(true);
    expect(isSupportedMethod('plain')).toBe(false);
    expect(isSupportedMethod(null)).toBe(false);
  });
});

describe('authorization codes', () => {
  const base = {
    key: '1lev1_1_deadbeef',
    userId: '1',
    clientId: 'cid',
    redirectUri: CB,
    codeChallenge: challengeFor('a'.repeat(43))
  };

  beforeEach(() => __resetReplayCache());

  it('round-trips and carries the raw key', () => {
    const r = redeemCode(mintCode(base));
    expect(r.ok && r.payload.key).toBe('1lev1_1_deadbeef');
  });

  it('is single-use', () => {
    const code = mintCode(base);
    expect(redeemCode(code).ok).toBe(true);
    const second = redeemCode(code);
    expect(second.ok).toBe(false);
    expect(!second.ok && second.reason).toBe('replayed');
  });

  it('expires', () => {
    const code = mintCode(base, 1_000_000);
    const r = redeemCode(code, 1_000_000 + 61_000);
    expect(!r.ok && r.reason).toBe('expired');
  });

  it('refuses a tampered ciphertext', () => {
    const code = mintCode(base);
    const [iv, ct, tag] = code.split('.');
    const flipped = Buffer.from(ct, 'base64url');
    flipped[0] ^= 0xff;
    const r = redeemCode(`${iv}.${flipped.toString('base64url')}.${tag}`);
    expect(!r.ok && r.reason).toBe('malformed');
  });
});

describe('signed authorization request', () => {
  it('round-trips and rejects tampering', () => {
    const t = signAuthRequest({
      clientId: 'cid',
      clientName: 'Claude',
      redirectUri: CB,
      state: 'xyz',
      codeChallenge: 'c'
    });
    expect(verifyAuthRequest(t)?.redirectUri).toBe(CB);
    expect(verifyAuthRequest(t.slice(0, -2) + 'aa')).toBeNull();
  });

  it('expires', () => {
    const t = signAuthRequest(
      { clientId: 'c', clientName: 'n', redirectUri: CB, state: null, codeChallenge: 'c' },
      1_000_000
    );
    expect(verifyAuthRequest(t, 1_000_000 + 16 * 60 * 1000)).toBeNull();
  });

  it('preserves state verbatim and omits it when absent', () => {
    expect(redirectWith(CB, { code: 'x' }, 'a b&c')).toContain('state=a+b%26c');
    expect(redirectWith(CB, { code: 'x' }, null)).not.toContain('state=');
  });
});
