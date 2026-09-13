import { describe, it, expect } from 'vitest';
import { RateLimiter, callerKey } from './rateLimit.js';

function clock(start = 1_000_000) {
    let now = start;
    return { now: () => now, advance: (ms: number) => (now += ms) };
}

describe('RateLimiter', () => {
    it('allows up to the limit, then refuses', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now });

        expect(rl.take('a', 2, 60_000).ok).toBe(true);
        expect(rl.take('a', 2, 60_000).ok).toBe(true);

        const refused = rl.take('a', 2, 60_000);
        expect(refused.ok).toBe(false);
        expect(refused.remaining).toBe(0);
        expect(refused.retryAfterMs).toBeGreaterThan(0);
    });

    it('counts each caller separately', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now });
        rl.take('a', 1, 60_000);
        expect(rl.take('a', 1, 60_000).ok).toBe(false);
        expect(rl.take('b', 1, 60_000).ok).toBe(true);
    });

    it('rolls — the window drains as time passes', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now });

        rl.take('a', 2, 60_000);
        c.advance(30_000);
        rl.take('a', 2, 60_000);
        expect(rl.take('a', 2, 60_000).ok).toBe(false);

        c.advance(31_000); // the first attempt ages out
        expect(rl.take('a', 2, 60_000).ok).toBe(true);
    });

    it('does not record a refused attempt — a retry loop must not self-extend', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now });

        rl.take('a', 1, 60_000);
        // Hammer it for most of the window.
        for (let i = 0; i < 50; i++) {
            c.advance(1000);
            expect(rl.take('a', 1, 60_000).ok).toBe(false);
        }
        // The single recorded hit still ages out on schedule.
        c.advance(11_000);
        expect(rl.take('a', 1, 60_000).ok).toBe(true);
    });

    it('reports what is left in the window', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now });
        expect(rl.take('a', 3, 60_000).remaining).toBe(2);
        expect(rl.take('a', 3, 60_000).remaining).toBe(1);
        expect(rl.take('a', 3, 60_000).remaining).toBe(0);
    });

    it('does not grow without bound', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now, maxKeys: 20 });
        for (let i = 0; i < 200; i++) rl.take(`ip:${i}`, 5, 60_000);
        expect(rl.size()).toBeLessThanOrEqual(20);
    });

    it('evicts callers that have gone quiet before it evicts live ones', () => {
        const c = clock();
        const rl = new RateLimiter({ now: c.now, maxKeys: 4 });
        rl.take('old', 5, 60_000);
        c.advance(6 * 60_000);
        for (const k of ['a', 'b', 'c', 'd']) rl.take(k, 5, 60_000);
        expect(rl.size()).toBeLessThanOrEqual(4);
    });
});

describe('callerKey', () => {
    it('prefers the user id, which is stable and unforgeable', () => {
        expect(callerKey('42', '1.2.3.4')).toBe('u:42');
    });

    it('falls back to the IP for an anonymous reader', () => {
        expect(callerKey(undefined, '1.2.3.4')).toBe('ip:1.2.3.4');
    });

    it('namespaces the two so a user id can never collide with an address', () => {
        expect(callerKey('1.2.3.4', '9.9.9.9')).not.toBe(callerKey(undefined, '1.2.3.4'));
    });

    it('still produces a key when the IP is unknown', () => {
        expect(callerKey(undefined, '')).toBe('ip:unknown');
    });
});
