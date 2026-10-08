import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkInternalRequest, INTERNAL_SECRET_HEADER } from './internal-auth.js';

const SECRET = 'shared-socket-broadcast-secret';

function req(headers: Record<string, string | string[] | undefined> = {}) {
  return { headers } as Parameters<typeof checkInternalRequest>[0];
}

describe('checkInternalRequest', () => {
  beforeEach(() => {
    process.env.SOCKET_BROADCAST_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.SOCKET_BROADCAST_SECRET;
  });

  it('accepts the shared secret', () => {
    expect(checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: SECRET }))).toEqual({ ok: true });
  });

  it('refuses a request with no secret - the open-internet case', () => {
    expect(checkInternalRequest(req())).toMatchObject({ ok: false, status: 401 });
  });

  it('refuses a wrong secret, including one of a different length', () => {
    expect(checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: 'nope' }))).toMatchObject({ ok: false, status: 401 });
    expect(
      checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: SECRET.replace(/.$/, 'X') }))
    ).toMatchObject({ ok: false, status: 401 });
  });

  it('fails closed when the server has no secret configured', () => {
    delete process.env.SOCKET_BROADCAST_SECRET;
    expect(checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: '' }))).toMatchObject({ ok: false, status: 503 });
    expect(checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: 'anything' }))).toMatchObject({ ok: false, status: 503 });
  });

  it('treats a blank secret as unconfigured, not as "empty header matches"', () => {
    process.env.SOCKET_BROADCAST_SECRET = '   ';
    expect(checkInternalRequest(req({ [INTERNAL_SECRET_HEADER]: '   ' }))).toMatchObject({ ok: false, status: 503 });
  });
});
