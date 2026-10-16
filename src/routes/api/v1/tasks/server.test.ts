/**
 * The legacy task addresses (`POST /api/v1/tasks`, `GET /api/v1/tasks/{id}`).
 *
 * Deprecated (§5.8), not changed: same handler as the rikma-scoped addresses,
 * same scopes, same bodies. The migration added the deprecation headers, the
 * `Link` to *this key's* new address, and one `[api-legacy]` log line per
 * request — and nothing else.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  executeAction: vi.fn(),
  verifyApiKeyDetailed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
  env: { ADMINMONTHER: 'test-admin' }
}));
vi.mock('$lib/server/actions/index.js', () => ({
  strapiClient: { execute: mocks.execute },
  actionService: { executeAction: mocks.executeAction }
}));
vi.mock('$lib/server/apiKeys.js', () => ({
  verifyApiKeyDetailed: mocks.verifyApiKeyDetailed,
  touchLastUsed: mocks.touchLastUsed,
  assertScope: (key: any, scope: string) =>
    Array.isArray(key.scopes) && key.scopes.includes(scope)
}));

const { POST } = await import('./+server');
const { GET } = await import('./[externalId]/+server');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

const key = (scopes = ['tasks:create', 'tasks:read'], project = '57') => ({
  user: { id: '9' },
  keyId: '3',
  name: 'tickets',
  project: { id: project },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: null
});

const TASK = { name: 'כרטיס מהאתר', externalId: 'TICKET-1', urgency: 'yellow' };

function fakeStrapi({ actFound = false } = {}) {
  return async (qid: string) => {
    switch (qid) {
      case 'tasksApiActByExternalId':
        return {
          data: {
            acts: {
              data: actFound
                ? [
                    {
                      id: '777',
                      attributes: {
                        shem: 'כרטיס',
                        status: 'open',
                        hashivut: 'yellow'
                      }
                    }
                  ]
                : []
            }
          }
        };
      case 'tasksApiProjectRefs':
        return {
          data: {
            project: {
              data: {
                attributes: {
                  user_1s: { data: [] },
                  tafkidims: { data: [] },
                  mesimabetahaliches: { data: [] }
                }
              }
            }
          }
        };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
}

const requestStub = (headers: Record<string, string>, body?: unknown) =>
  ({
    headers: new Headers(headers),
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    }
  }) as unknown as Request;

const attempt = async (
  p: Promise<unknown>
): Promise<{ status: number; body: any; headers: Headers }> => {
  try {
    const response = (await p) as Response;
    return {
      status: response.status,
      body: await response.json().catch(() => null),
      headers: response.headers
    };
  } catch (e: any) {
    return {
      status: e?.status ?? 500,
      body: e?.body ?? null,
      headers: new Headers()
    };
  }
};

const post = (
  body: unknown = TASK,
  headers: Record<string, string> = { Authorization: 'Bearer 1lev1_x' }
) => (POST as any)({ request: requestStub(headers, body), fetch: vi.fn() });

const get = (
  externalId = 'TICKET-1',
  headers: Record<string, string> = { Authorization: 'Bearer 1lev1_x' }
) =>
  (GET as any)({
    params: { externalId },
    request: requestStub(headers),
    fetch: vi.fn()
  });

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
  mocks.verifyApiKeyDetailed.mockResolvedValue(key());
  mocks.executeAction.mockResolvedValue({ success: true, data: { id: '777' } });
});

describe('POST /api/v1/tasks — the deprecated address', () => {
  it('opens the task exactly as before, and points at the new address', async () => {
    const response = await attempt(post());
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      duplicated: false,
      taskId: '777',
      status: 'open'
    });
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Link')).toBe(
      '</api/v1/r/57/tasks>; rel="successor-version"'
    );
    expect(mocks.executeAction).toHaveBeenCalledWith(
      'createTask',
      expect.objectContaining({ projectId: '57', name: 'כרטיס מהאתר' }),
      expect.objectContaining({ userId: '9' })
    );
  });

  it('keeps answering duplicated for a retried externalId', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ actFound: true }));
    const response = await attempt(post({ ...TASK, externalId: 'TICKET-1' }));
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      duplicated: true,
      externalId: 'TICKET-1'
    });
  });

  it('still refuses a key without tasks:create', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['sales:report']));
    expect((await attempt(post())).status).toBe(403);
  });
});

describe('GET /api/v1/tasks/{externalId} — the deprecated address', () => {
  it('answers the status and the link to the new address', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ actFound: true }));
    const response = await attempt(get());
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      externalId: 'TICKET-1'
    });
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Link')).toBe(
      '</api/v1/r/57/tasks>; rel="successor-version"'
    );
  });

  it('still 404s an externalId this rikma does not have', async () => {
    expect((await attempt(get('NOPE'))).status).toBe(404);
  });
});
