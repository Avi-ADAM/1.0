/**
 * Unit tests for principal resolution.
 */

import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';

vi.mock('$env/dynamic/private', () => ({
  env: { CONSENSUS_PROXY_SECRET: 'consensus-secret-value' }
}));
vi.mock('$env/static/private', () => ({ ADMINMONTHER: 'test-admin-token' }));

import {
  resolveCookiePrincipal,
  resolveServicePrincipal,
  resolvePrincipal
} from './principal.js';

// Mirror internalSecret.js derivation for the mocked ADMINMONTHER
const INTERNAL_SECRET = createHash('sha256')
  .update('test-admin-token:internal-proxy:v1')
  .digest('hex');

function cookiesOf(map: Record<string, string>) {
  return { get: (name: string) => map[name] };
}

function requestWith(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/send', { method: 'POST', headers });
}

describe('resolveCookiePrincipal', () => {
  it('returns anonymous without a jwt cookie', () => {
    expect(resolveCookiePrincipal(cookiesOf({})).kind).toBe('anonymous');
  });

  it('returns user with id and username from cookies', () => {
    const p = resolveCookiePrincipal(cookiesOf({ jwt: 'x', id: '12', un: 'dana' }));
    expect(p).toEqual({ kind: 'user', userId: '12', username: 'dana' });
  });
});

describe('resolveServicePrincipal', () => {
  it('is serviceConsensus when the consensus secret header matches', () => {
    const p = resolveServicePrincipal(
      requestWith({ 'x-consensus-secret': 'consensus-secret-value' })
    );
    expect(p.kind).toBe('serviceConsensus');
  });

  it('is serviceAdmin without (or with a wrong) consensus secret', () => {
    expect(resolveServicePrincipal(requestWith()).kind).toBe('serviceAdmin');
    expect(
      resolveServicePrincipal(requestWith({ 'x-consensus-secret': 'wrong' })).kind
    ).toBe('serviceAdmin');
  });
});

describe('resolvePrincipal', () => {
  it('treats isSer with a valid internal secret as service', () => {
    const p = resolvePrincipal({
      request: requestWith({ 'x-internal-secret': INTERNAL_SECRET }),
      cookies: cookiesOf({ jwt: 'x', id: '12' }),
      isSerFlag: true
    });
    expect(p.kind).toBe('serviceAdmin');
  });

  it('falls back to the cookie principal when isSer lacks the internal secret', () => {
    const p = resolvePrincipal({
      request: requestWith(),
      cookies: cookiesOf({ jwt: 'x', id: '12' }),
      isSerFlag: true
    });
    expect(p.kind).toBe('user');
  });

  it('resolves plain cookie requests as user', () => {
    const p = resolvePrincipal({
      request: requestWith(),
      cookies: cookiesOf({ jwt: 'x', id: '12' }),
      isSerFlag: false
    });
    expect(p).toMatchObject({ kind: 'user', userId: '12' });
  });
});
