import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { expectedPass, isExhibitPass, keyOpensPass } from './pass';

const KEY = 'fair-stand-key-2026';

describe('exhibit pass', () => {
  it('exists only when a long enough key is configured', () => {
    expect(expectedPass(undefined)).toBeNull();
    expect(expectedPass('short')).toBeNull();
    expect(expectedPass(KEY)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('never stores the key itself in the cookie', () => {
    expect(expectedPass(KEY)).not.toContain(KEY);
  });

  it('opens with the right key only', () => {
    expect(keyOpensPass(KEY, KEY)).toBe(true);
    expect(keyOpensPass('fair-stand-key-2027', KEY)).toBe(false);
    expect(keyOpensPass('', KEY)).toBe(false);
    expect(keyOpensPass(KEY, undefined)).toBe(false);
  });

  it('accepts the cookie it set, and nothing else', () => {
    const cookie = expectedPass(KEY)!;
    expect(isExhibitPass(cookie, KEY)).toBe(true);
    expect(isExhibitPass(cookie + 'x', KEY)).toBe(false);
    expect(isExhibitPass(null, KEY)).toBe(false);
    expect(isExhibitPass(cookie, undefined)).toBe(false);
  });
});
