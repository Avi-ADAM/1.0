/**
 * A per-caller rolling-window limiter for `/api/translate/warm` (§5.3 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * The governor bounds what the *site* may spend in a day. This bounds what one
 * *caller* may spend in a minute, and the two answer different questions: the
 * governor stops the feature from costing more than it is worth, this stops one
 * client from being the reason the whole day's on-demand budget went to
 * somebody's script.
 *
 * The public discovery pages are anonymous, so an anonymous caller has to be
 * allowed through — with a tighter allowance, because an IP is shared by real
 * readers and rotated by an attacker, and it is the weaker of the two keys.
 *
 * In-memory and per-process, deliberately: a multi-instance deploy limits per
 * instance. That is a real limit and it is stated rather than hidden — the
 * daily budget behind it is the ceiling that actually holds, and it is shared
 * with nothing.
 */

export interface RateLimitVerdict {
    ok: boolean;
    /** Requests left in the window after this one. */
    remaining: number;
    retryAfterMs: number;
}

interface Window {
    hits: number[];
}

export class RateLimiter {
    private windows = new Map<string, Window>();
    private now: () => number;
    /** Stops an unbounded map on a site with many callers. */
    private maxKeys: number;

    constructor(opts: { now?: () => number; maxKeys?: number } = {}) {
        this.now = opts.now ?? (() => Date.now());
        this.maxKeys = opts.maxKeys ?? 5000;
    }

    /**
     * Record an attempt and say whether it is allowed.
     *
     * A refused attempt is *not* recorded. A client that keeps hammering must
     * not extend its own penalty indefinitely — the window has to be able to
     * drain, or a retry loop locks the caller out for as long as it runs.
     */
    take(key: string, limit: number, windowMs: number): RateLimitVerdict {
        const now = this.now();
        const win = this.windows.get(key) ?? { hits: [] };
        win.hits = win.hits.filter((t) => now - t < windowMs);

        if (win.hits.length >= limit) {
            this.windows.set(key, win);
            const oldest = win.hits[0] ?? now;
            return { ok: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
        }

        win.hits.push(now);
        this.evictIfNeeded();
        this.windows.set(key, win);
        return { ok: true, remaining: limit - win.hits.length, retryAfterMs: 0 };
    }

    /**
     * Drop windows that have gone quiet. Called on the write path rather than
     * on a timer so the module has no background work of its own.
     */
    private evictIfNeeded(): void {
        if (this.windows.size < this.maxKeys) return;
        const now = this.now();
        for (const [key, win] of this.windows) {
            if (win.hits.length === 0 || now - win.hits[win.hits.length - 1] > 5 * 60_000) {
                this.windows.delete(key);
            }
        }
        // Still full of live callers: drop the oldest half rather than grow.
        // Losing a limiter entry is a caller getting one extra request, which
        // the daily budget still bounds.
        if (this.windows.size >= this.maxKeys) {
            const keys = [...this.windows.keys()].slice(0, Math.floor(this.maxKeys / 2));
            for (const key of keys) this.windows.delete(key);
        }
    }

    /** Tests only. */
    size(): number {
        return this.windows.size;
    }
}

/**
 * The key one caller is limited by.
 *
 * A signed-in reader is keyed by their user id — stable, unforgeable, and it
 * follows them across networks. Everyone else is keyed by IP, prefixed so a
 * user id can never collide with an address.
 */
export function callerKey(userId: string | undefined, ip: string): string {
    return userId ? `u:${userId}` : `ip:${ip || 'unknown'}`;
}

/** The process-wide limiter for the warm endpoint. */
export const warmLimiter = new RateLimiter();
