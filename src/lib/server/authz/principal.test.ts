/**
 * Unit tests for principal resolution.
 */

import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';

vi.mock('$env/dynamic/private', () => ({
  env: { CONSENSUS_PROXY_SECRET: 'consensus-secret-value', MEETINGS_PROXY_SECRET: 'meetings-secret-value' }
}));
vi.mock('$env/static/private', () => ({ ADMINMONTHER: 'test-admin-token' }));

import {
  resolveSessionPrincipal,
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

describe('resolveSessionPrincipal', () => {
  it('returns anonymous without a jwt cookie', () => {
    expect(resolveSessionPrincipal(cookiesOf({}), { id: '12' }).kind).toBe('anonymous');
  });

  it('returns user from the verified identity, not the cookies', () => {
    const p = resolveSessionPrincipal(cookiesOf({ jwt: 'x', id: '99', un: 'mallory' }), {
      id: '12',
      username: 'dana'
    });
    expect(p).toEqual({ kind: 'user', userId: '12', username: 'dana' });
  });

  it('is anonymous when the token could not be resolved to a user', () => {
    // Fail closed: a jwt we cannot vouch for is not a session, and the id
    // cookie beside it is worth nothing.
    expect(resolveSessionPrincipal(cookiesOf({ jwt: 'x', id: '12' }), null).kind).toBe(
      'anonymous'
    );
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
      cookies: cookiesOf({ jwt: 'x' }),
      identity: { id: '12' },
      isSerFlag: true
    });
    expect(p.kind).toBe('serviceAdmin');
  });

  it('falls back to the session principal when isSer lacks the internal secret', () => {
    const p = resolvePrincipal({
      request: requestWith(),
      cookies: cookiesOf({ jwt: 'x' }),
      identity: { id: '12' },
      isSerFlag: true
    });
    expect(p.kind).toBe('user');
  });

  it('resolves plain cookie requests as the verified user', () => {
    const p = resolvePrincipal({
      request: requestWith(),
      cookies: cookiesOf({ jwt: 'x', id: '99' }),
      identity: { id: '12' },
      isSerFlag: false
    });
    expect(p).toMatchObject({ kind: 'user', userId: '12' });
  });

  it('is anonymous when a jwt is present but no identity was verified', () => {
    const p = resolvePrincipal({
      request: requestWith(),
      cookies: cookiesOf({ jwt: 'x', id: '12' }),
      isSerFlag: false
    });
    expect(p.kind).toBe('anonymous');
  });

  it('resolves the meetings shared secret as serviceMeetings', () => {
    const p = resolvePrincipal({
      request: requestWith({ 'x-meetings-secret': 'meetings-secret-value' }),
      cookies: cookiesOf({}),
      isSerFlag: false
    });
    expect(p.kind).toBe('serviceMeetings');
  });

  it('ignores a wrong meetings secret', () => {
    const p = resolvePrincipal({
      request: requestWith({ 'x-meetings-secret': 'nope' }),
      cookies: cookiesOf({}),
      isSerFlag: false
    });
    expect(p.kind).toBe('anonymous');
  });

  it('lets a genuine isSer call stay serviceAdmin even with the meetings header', () => {
    const p = resolvePrincipal({
      request: requestWith({ 'x-internal-secret': INTERNAL_SECRET, 'x-meetings-secret': 'meetings-secret-value' }),
      cookies: cookiesOf({}),
      isSerFlag: true
    });
    expect(p.kind).toBe('serviceAdmin');
  });

  it('prefers the meetings principal over a cookie that happens to be present', () => {
    // The meetings server never forwards visitor cookies on this path, but if
    // one ever leaked in it must not silently become that user's session.
    const p = resolvePrincipal({
      request: requestWith({ 'x-meetings-secret': 'meetings-secret-value' }),
      cookies: cookiesOf({ jwt: 'x' }),
      identity: { id: '12' },
      isSerFlag: false
    });
    expect(p.kind).toBe('serviceMeetings');
  });
});
