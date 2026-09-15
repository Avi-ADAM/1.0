import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { STATE_TTL_MS, createState, readState, stateKey } from './state';

const key = stateKey('client-secret');

describe('github connect state', () => {
  it('round-trips a link and an install intent', () => {
    const link = createState({ uid: '7', intent: 'link' }, key);
    expect(readState(link.value, key)).toEqual(link.state);

    const install = createState({ uid: '7', intent: 'install', projectId: '12' }, key);
    expect(readState(install.value, key)?.projectId).toBe('12');
  });

  it('carries a return origin, and drops one that is not a bare origin', () => {
    const ok = createState({ uid: '7', intent: 'link', returnOrigin: 'https://www.1lev1.com' }, key);
    expect(readState(ok.value, key)?.returnOrigin).toBe('https://www.1lev1.com');

    const bad = createState({ uid: '7', intent: 'link', returnOrigin: 'https://evil.example/path' }, key);
    expect(readState(bad.value, key)?.returnOrigin).toBeUndefined();
  });

  it('refuses a cookie signed with another key or edited in transit', () => {
    const { value } = createState({ uid: '7', intent: 'link' }, key);
    expect(readState(value, stateKey('other-secret'))).toBeNull();

    const [body, sig] = value.split('.');
    const forged = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    forged.uid = '8';
    const forgedBody = Buffer.from(JSON.stringify(forged)).toString('base64url');
    expect(readState(`${forgedBody}.${sig}`, key)).toBeNull();
  });

  it('expires', () => {
    const now = 1_000_000;
    const { value } = createState({ uid: '7', intent: 'link' }, key, now);
    expect(readState(value, key, now + STATE_TTL_MS - 1)).not.toBeNull();
    expect(readState(value, key, now + STATE_TTL_MS)).toBeNull();
  });

  it('rejects garbage and an install intent without a rikma', () => {
    expect(readState(undefined, key)).toBeNull();
    expect(readState('not-a-cookie', key)).toBeNull();
    const body = Buffer.from(
      JSON.stringify({ nonce: 'n', uid: '7', intent: 'install', exp: Date.now() + 1000 })
    ).toString('base64url');
    const sig = createHmac('sha256', key).update(body).digest('base64url');
    expect(readState(`${body}.${sig}`, key)).toBeNull();
  });
});
