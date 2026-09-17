import { describe, expect, it, beforeEach } from 'vitest';
import { consume, resetRateLimits, BUCKETS } from './rateLimit';

beforeEach(() => resetRateLimits());

describe('consume', () => {
  it('allows a burst up to capacity, then refuses with a retry hint', () => {
    const t = 1_000_000;
    for (let i = 0; i < BUCKETS.write.capacity; i++) expect(consume('k', 'write', t).ok).toBe(true);
    const refused = consume('k', 'write', t);
    expect(refused.ok).toBe(false);
    expect(refused.retryAfterSeconds).toBe(3); // 20/min ⇒ one token every 3s
  });

  it('refills over time', () => {
    const t = 1_000_000;
    for (let i = 0; i < BUCKETS.write.capacity; i++) consume('k', 'write', t);
    expect(consume('k', 'write', t).ok).toBe(false);
    expect(consume('k', 'write', t + 3_000).ok).toBe(true);
  });

  it('keeps keys and buckets apart', () => {
    const t = 1_000_000;
    for (let i = 0; i < BUCKETS.ai.capacity; i++) consume('k', 'ai', t);
    expect(consume('k', 'ai', t).ok).toBe(false);
    expect(consume('k', 'read', t).ok).toBe(true);
    expect(consume('other', 'ai', t).ok).toBe(true);
  });
});
