// The consent screen's server returns error *keys* the page renders through
// $t('mcp.connect.errors.<key>') — never a sentence in one language.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyAuthRequest = vi.fn();
const isValidCallback = vi.fn();

vi.mock('$lib/server/apiKeys', () => ({ isValidCallback: (c: string) => isValidCallback(c) }));
vi.mock('$lib/server/oauth/authreq.js', () => ({
  verifyAuthRequest: (t: string) => verifyAuthRequest(t),
  redirectWith: () => 'https://example.test/cb'
}));
vi.mock('$lib/server/oauth/codes.js', () => ({ mintCode: () => 'code' }));

const { load, actions } = await import('./+page.server');

function loadEvent(search: string) {
  return {
    locals: { uid: 7, un: 'tester' },
    url: new URL(`https://1lev1.test/mcp-connect${search}`),
    fetch: vi.fn(async () => new Response('[]'))
  } as any;
}

function actionEvent(fields: Record<string, string>, fetchImpl?: () => Promise<Response>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return {
    locals: { uid: 7 },
    request: new Request('https://1lev1.test/mcp-connect', { method: 'POST', body: fd }),
    fetch: vi.fn(fetchImpl ?? (async () => new Response('{}', { status: 500 })))
  } as any;
}

beforeEach(() => {
  verifyAuthRequest.mockReset();
  isValidCallback.mockReset();
});

describe('mcp-connect load', () => {
  it('an expired OAuth request → authRequest', async () => {
    verifyAuthRequest.mockReturnValue(null);
    const out: any = await load(loadEvent('?oauth=bad'));
    expect(out.errorKey).toBe('authRequest');
    expect(out).not.toHaveProperty('error');
  });

  it('a bad CLI callback → callback', async () => {
    isValidCallback.mockReturnValue(false);
    const out: any = await load(loadEvent('?callback=https://evil.test'));
    expect(out.errorKey).toBe('callback');
  });

  it('a valid request carries no error key', async () => {
    isValidCallback.mockReturnValue(true);
    const out: any = await load(loadEvent('?callback=http://localhost:4567'));
    expect(out.errorKey).toBeNull();
    expect(out.userName).toBe('tester');
  });
});

describe('mcp-connect action', () => {
  it('a failed key creation → createKey, not the API message', async () => {
    isValidCallback.mockReturnValue(true);
    const out: any = await actions.default(
      actionEvent({ callback: 'http://localhost:4567', oauth: '' }, async () =>
        new Response(JSON.stringify({ message: 'שגיאה' }), { status: 500 })
      )
    );
    expect(out.status).toBe(500);
    expect(out.data).toEqual({ errorKey: 'createKey' });
  });

  it('an expired OAuth request on submit → authRequest', async () => {
    verifyAuthRequest.mockReturnValue(null);
    const out: any = await actions.default(actionEvent({ oauth: 'bad', callback: '' }));
    expect(out.data).toEqual({ errorKey: 'authRequest' });
  });
});
