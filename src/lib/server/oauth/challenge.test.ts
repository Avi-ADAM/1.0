import { describe, it, expect, vi, beforeEach } from 'vitest';

// challenge.ts reads its switches through $env/dynamic/private, so the mock's
// object is mutated per-test rather than re-imported.
const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const { oauthChallenge, publicModeAllowed, oauthEnabled, publicMode, lazyAuthEnabled, needsSignIn, calledToolNames } =
  await import('./challenge.js');

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

describe('lazy authentication (MCP_PUBLIC_MODE=lazy)', () => {
  const PUBLIC = new Set(['getPlatformInfo', 'prepareSignup']);
  const call = (name: unknown, id = 1) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: {} } });

  beforeEach(() => {
    mockEnv.MCP_OAUTH_ENABLED = 'true';
    mockEnv.MCP_PUBLIC_MODE = 'lazy';
  });

  it('is on only with OAuth on, the lazy mode, and no ?public=1', () => {
    expect(lazyAuthEnabled(u())).toBe(true);
    expect(lazyAuthEnabled(u('?public=1'))).toBe(false);
    delete mockEnv.MCP_OAUTH_ENABLED;
    expect(lazyAuthEnabled(u())).toBe(false);
  });

  it('leaves the other modes exactly as they were', () => {
    mockEnv.MCP_PUBLIC_MODE = 'challenge';
    expect(lazyAuthEnabled(u())).toBe(false);
    expect(oauthChallenge(u())?.status).toBe(401);
    mockEnv.MCP_PUBLIC_MODE = 'public';
    expect(lazyAuthEnabled(u())).toBe(false);
    expect(oauthChallenge(u())).toBeNull();
    // A typo must not silently open the endpoint.
    mockEnv.MCP_PUBLIC_MODE = 'lazzy';
    expect(publicMode()).toBe('challenge');
    expect(oauthChallenge(u())?.status).toBe(401);
  });

  it('does not challenge the connect itself', () => {
    expect(oauthChallenge(u())).toBeNull();
  });

  it('lets initialize, tools/list and notifications through', () => {
    for (const method of ['initialize', 'tools/list', 'notifications/initialized']) {
      expect(needsSignIn({ jsonrpc: '2.0', id: 1, method }, PUBLIC), method).toBe(false);
    }
    expect(needsSignIn(null, PUBLIC)).toBe(false);
  });

  it('lets the public tools through', () => {
    expect(needsSignIn(call('getPlatformInfo'), PUBLIC)).toBe(false);
    expect(needsSignIn(call('prepareSignup'), PUBLIC)).toBe(false);
  });

  it('gates every other tool, a nameless call, and a batch hiding one', () => {
    expect(needsSignIn(call('findUserProjectsTool'), PUBLIC)).toBe(true);
    expect(needsSignIn(call(undefined), PUBLIC)).toBe(true);
    expect(needsSignIn(call(42), PUBLIC)).toBe(true);
    expect(needsSignIn([call('getPlatformInfo', 1), call('timerActionTool', 2)], PUBLIC)).toBe(true);
    expect(needsSignIn([call('getPlatformInfo', 1), call('prepareSignup', 2)], PUBLIC)).toBe(false);
  });

  it('collects the called names in order', () => {
    expect(calledToolNames([call('a'), { method: 'tools/list' }, call('b')])).toEqual(['a', 'b']);
  });

  it('forced challenge: 401 with invalid_token, the metadata and the one scope', () => {
    const res = oauthChallenge(u(), { force: true })!;
    expect(res.status).toBe(401);
    const h = res.headers.get('WWW-Authenticate')!;
    expect(h).toMatch(/^Bearer error="invalid_token"/);
    expect(h).toContain('resource_metadata="https://api.1lev1.com/.well-known/oauth-protected-resource"');
    expect(h).toContain('scope="mcp"');
    expect(res.headers.get('Access-Control-Expose-Headers')).toContain('WWW-Authenticate');
  });
});
