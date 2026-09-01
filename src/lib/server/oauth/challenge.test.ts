import { describe, it, expect, vi, beforeEach } from 'vitest';

// challenge.ts reads its switches through $env/dynamic/private, so the mock's
// object is mutated per-test rather than re-imported.
const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const { oauthChallenge, publicModeAllowed, oauthEnabled } = await import('./challenge.js');

const u = (qs = '') => new URL(`https://api.1lev1.com/api/mcp${qs}`);

beforeEach(() => {
  for (const k of Object.keys(mockEnv)) delete mockEnv[k];
});

describe('public mode vs challenge', () => {
  it('keeps today’s behaviour while OAuth is off', () => {
    expect(oauthEnabled()).toBe(false);
    expect(publicModeAllowed(u())).toBe(true);
    expect(oauthChallenge(u())).toBeNull();
  });

  it('challenges once OAuth is on', () => {
    mockEnv.MCP_OAUTH_ENABLED = 'true';
    expect(publicModeAllowed(u())).toBe(false);
    expect(oauthChallenge(u())?.status).toBe(401);
  });

  it('honours an explicit public opt-out', () => {
    mockEnv.MCP_OAUTH_ENABLED = 'true';
    mockEnv.MCP_PUBLIC_MODE = 'public';
    expect(oauthChallenge(u())).toBeNull();
  });

  it('always lets ?public=1 through, so getPlatformInfo stays reachable', () => {
    mockEnv.MCP_OAUTH_ENABLED = 'true';
    expect(oauthChallenge(u('?public=1'))).toBeNull();
  });
});

describe('the 401 itself', () => {
  beforeEach(() => {
    mockEnv.MCP_OAUTH_ENABLED = 'true';
  });

  it('names the resource metadata in WWW-Authenticate', () => {
    const res = oauthChallenge(u())!;
    expect(res.headers.get('WWW-Authenticate')).toBe(
      'Bearer resource_metadata="https://api.1lev1.com/.well-known/oauth-protected-resource"'
    );
  });

  it('exposes that header to browser clients', () => {
    const res = oauthChallenge(u())!;
    expect(res.headers.get('Access-Control-Expose-Headers')).toContain('WWW-Authenticate');
  });

  it('carries a JSON-RPC error body pointing at discovery', async () => {
    const body = await oauthChallenge(u())!.json();
    expect(body.error.code).toBe(-32001);
    expect(body.error.data.resource_metadata).toContain('/.well-known/oauth-protected-resource');
  });

  it('derives the issuer from the request host, not a hardcoded origin', () => {
    const res = oauthChallenge(new URL('https://www.1lev1.com/api/mcp'))!;
    expect(res.headers.get('WWW-Authenticate')).toContain('https://www.1lev1.com/');
  });
});
