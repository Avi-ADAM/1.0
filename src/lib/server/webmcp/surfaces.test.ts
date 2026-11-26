import { describe, it, expect } from 'vitest';
import { MCP_TOOL_MANIFEST } from '../mcp/toolManifest';
import {
  GUEST_TOOLS,
  MEMBER_TOOLS,
  ROUTE_SURFACES,
  MAX_TOOLS_PER_PAGE,
  PLATFORM_INFO,
  candidateTools,
  normalizePath,
  projectIdFromPath,
  surfaceTools,
  tierAllowedOnWeb,
  type SurfaceEntry
} from './surfaces';
import { sameOrigin } from './sameOrigin';

const allNames = [...GUEST_TOOLS, ...MEMBER_TOOLS, ...ROUTE_SURFACES.flatMap((r) => r.tools)];

function lookup(name: string): SurfaceEntry | undefined {
  if (name === PLATFORM_INFO) return { tier: 'read', pure: true, enabled: true, restricted: false };
  const e = MCP_TOOL_MANIFEST[name];
  return e ? { tier: e.tier, pure: e.pure, enabled: true, restricted: !!e.audience } : undefined;
}

describe('WebMCP surfaces', () => {
  it('names only tools that exist in the MCP manifest', () => {
    for (const n of allNames) {
      if (n === PLATFORM_INFO) continue;
      expect(MCP_TOOL_MANIFEST[n], n).toBeDefined();
    }
  });

  it('never lists a tool above selfWrite, nor a restricted one', () => {
    for (const n of allNames) {
      const e = lookup(n)!;
      expect(['read', 'prepare', 'selfWrite'], n).toContain(e.tier);
      expect(e.restricted, n).toBe(false);
    }
  });

  it('keeps every page under the per-page cap', () => {
    for (const path of ['/', '/moach/89', '/project/89', '/lev', '/concierge/new', '/moach/89/lev']) {
      expect(candidateTools(path, true).length, path).toBeLessThanOrEqual(MAX_TOOLS_PER_PAGE);
    }
  });

  it('gives a guest only the public tools, whatever the page', () => {
    expect(candidateTools('/moach/89', false)).toEqual([...GUEST_TOOLS]);
  });

  it('adds rikma tools on a rikma page and fills its id', () => {
    const names = candidateTools('/en/moach/89', true);
    expect(names).toContain('getProjectDetailsTool');
    expect(projectIdFromPath('/en/moach/89/open')).toBe('89');
    expect(projectIdFromPath('/lev')).toBeUndefined();
    expect(normalizePath('/he')).toBe('/');
  });

  it('applies the tier ceiling per mode', () => {
    expect(tierAllowedOnWeb('read', false, 'read')).toBe(true);
    expect(tierAllowedOnWeb('prepare', true, 'read')).toBe(true);
    expect(tierAllowedOnWeb('prepare', false, 'read')).toBe(false);
    expect(tierAllowedOnWeb('selfWrite', false, 'read')).toBe(false);
    expect(tierAllowedOnWeb('selfWrite', false, 'on')).toBe(true);
    for (const t of ['consentWrite', 'communicate', 'sharedWrite'] as const) {
      expect(tierAllowedOnWeb(t, false, 'on'), t).toBe(false);
    }
    expect(tierAllowedOnWeb('read', true, 'off')).toBe(false);
  });

  it('drops writes in read mode and everything when off', () => {
    const read = surfaceTools('/lev', true, 'read', lookup);
    expect(read).not.toContain('timerActionTool');
    expect(surfaceTools('/lev', true, 'on', lookup)).toContain('timerActionTool');
    expect(surfaceTools('/lev', true, 'off', lookup)).toEqual([]);
  });
});

describe('sameOrigin', () => {
  const url = new URL('https://1lev1.com/api/webmcp');
  // A stub: the DOM test environment strips forbidden headers (Origin, Sec-Fetch-*) from a real Request.
  const req = (method: string, headers: Record<string, string>) =>
    ({ method, headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } }) as unknown as Request;

  it('accepts the site itself', () => {
    expect(sameOrigin(req('POST', { origin: 'https://1lev1.com', 'sec-fetch-site': 'same-origin' }), url)).toBe(true);
    expect(sameOrigin(req('GET', { 'sec-fetch-site': 'same-origin' }), url)).toBe(true);
  });

  it('refuses another site, including an allowed CORS origin', () => {
    expect(sameOrigin(req('POST', { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }), url)).toBe(false);
    expect(sameOrigin(req('POST', { origin: 'https://consensus.1lev1.com', 'sec-fetch-site': 'same-site' }), url)).toBe(false);
    expect(sameOrigin(req('POST', { origin: 'https://evil.example' }), url)).toBe(false);
  });

  it('refuses a POST that carries neither header', () => {
    expect(sameOrigin(req('POST', {}), url)).toBe(false);
  });
});
