import { describe, it, expect } from 'vitest';
import {
    Governor,
    dayKey,
    emptyState,
    type GovernorState,
    type GovernorStore
} from './governor.js';

/** A clock the test moves by hand. Every assertion here is about time. */
function clock(start = Date.UTC(2026, 8, 9, 12, 0, 0)) {
    let now = start;
    return {
        now: () => now,
        advance(ms: number) {
            now += ms;
        },
        set(ms: number) {
            now = ms;
        }
    };
}

/** An in-memory store, so restart persistence can be tested without a disk. */
function memStore(initial: GovernorState | null = null): GovernorStore & { saved: GovernorState | null } {
    const box = {
        saved: initial,
        load: () => box.saved,
        save: (s: GovernorState) => {
            box.saved = JSON.parse(JSON.stringify(s));
        }
    };
    return box;
}

const LIMITS = { rpm: 10, rpd: 100, onDemandShare: 0.3 };

describe('the per-minute window', () => {
    it('refuses past rpm and says how long to wait', () => {
        const c = clock();
        const g = new Governor({ ...LIMITS, rpm: 3 }, { now: c.now });

        expect(g.spend('onDemand').ok).toBe(true);
        expect(g.spend('onDemand').ok).toBe(true);
        expect(g.spend('onDemand').ok).toBe(true);

        const refused = g.spend('onDemand');
        expect(refused.ok).toBe(false);
        expect(refused.reason).toBe('rpm');
        expect(refused.retryAfterMs).toBeGreaterThan(0);
        expect(refused.retryAfterMs).toBeLessThanOrEqual(60_000);
    });

    it('rolls: the window is the last 60s, not a fixed bucket', () => {
        const c = clock();
        const g = new Governor({ ...LIMITS, rpm: 2 }, { now: c.now });

        g.spend('onDemand');
        c.advance(30_000);
        g.spend('onDemand');
        expect(g.spend('onDemand').ok).toBe(false);

        // The first request ages out; the second has not.
        c.advance(31_000);
        expect(g.spend('onDemand').ok).toBe(true);
        expect(g.status().inLastMinute).toBe(2);
    });

    it('refuses a batch that would cross the ceiling, without partly spending it', () => {
        const c = clock();
        const g = new Governor({ ...LIMITS, rpm: 5 }, { now: c.now });

        g.spend('onDemand', 3);
        const refused = g.spend('onDemand', 3);
        expect(refused.ok).toBe(false);
        expect(g.status().inLastMinute).toBe(3);
    });
});

describe('the daily budget', () => {
    it('refuses past rpd', () => {
        const c = clock();
        const g = new Governor({ rpm: 1000, rpd: 4, onDemandShare: 0 }, { now: c.now });

        for (let i = 0; i < 4; i++) expect(g.spend('onDemand').ok).toBe(true);

        const refused = g.spend('onDemand');
        expect(refused.ok).toBe(false);
        expect(refused.reason).toBe('rpd');
    });

    it('resets at the UTC day boundary and not before', () => {
        const c = clock(Date.UTC(2026, 8, 9, 23, 59, 0));
        const g = new Governor({ rpm: 1000, rpd: 2, onDemandShare: 0 }, { now: c.now });

        g.spend('onDemand', 2);
        expect(g.spend('onDemand').ok).toBe(false);

        c.advance(2 * 60_000); // past midnight UTC
        expect(g.spend('onDemand').ok).toBe(true);
        expect(g.status().day).toBe(dayKey(c.now()));
        expect(g.status().total).toBe(1);
    });

    it('points a refusal at midnight, not at a minute from now', () => {
        const c = clock(Date.UTC(2026, 8, 9, 20, 0, 0));
        const g = new Governor({ rpm: 1000, rpd: 1, onDemandShare: 0 }, { now: c.now });
        g.spend('onDemand');

        const refused = g.spend('onDemand');
        expect(refused.ok).toBe(false);
        expect(refused.retryAfterMs).toBe(4 * 60 * 60 * 1000);
    });
});

describe('the reserved on-demand slice', () => {
    it('stops backfill short so on-demand always has its share', () => {
        const c = clock();
        // rpd 100, 30% reserved ⇒ backfill may reach 70.
        const g = new Governor({ rpm: 1000, rpd: 100, onDemandShare: 0.3 }, { now: c.now });
        expect(g.status().backfillCeiling).toBe(70);

        g.spend('backfill', 70);
        const refused = g.spend('backfill');
        expect(refused.ok).toBe(false);
        expect(refused.reason).toBe('reserve');

        // …and the live site can still fill its misses, which is the point.
        expect(g.spend('onDemand', 30).ok).toBe(true);
    });

    it('names the reserve as the reason, not the daily ceiling', () => {
        const c = clock();
        const g = new Governor({ rpm: 1000, rpd: 10, onDemandShare: 0.5 }, { now: c.now });
        g.spend('backfill', 5);

        const refused = g.spend('backfill');
        expect(refused.ok).toBe(false);
        // Only half the day is spent — blaming 'rpd' would send an operator
        // to raise a budget that is not the thing refusing.
        expect(refused.reason).toBe('reserve');
        expect(g.status().total).toBe(5);
    });

    it('lets on-demand use the whole day when backfill never ran', () => {
        const c = clock();
        const g = new Governor({ rpm: 1000, rpd: 10, onDemandShare: 0.3 }, { now: c.now });
        expect(g.spend('onDemand', 10).ok).toBe(true);
        expect(g.spend('onDemand').ok).toBe(false);
    });

    it('a share of 0 lets backfill spend the whole budget', () => {
        const c = clock();
        const g = new Governor({ rpm: 1000, rpd: 10, onDemandShare: 0 }, { now: c.now });
        expect(g.status().backfillCeiling).toBe(10);
        expect(g.spend('backfill', 10).ok).toBe(true);
    });
});

describe('persistence', () => {
    it('a restart does not hand the day back', () => {
        const c = clock();
        const store = memStore();

        const first = new Governor({ rpm: 1000, rpd: 5, onDemandShare: 0 }, { now: c.now, store });
        first.spend('onDemand', 5);
        expect(first.spend('onDemand').ok).toBe(false);

        // Same day, new process.
        c.advance(5 * 60_000);
        const second = new Governor({ rpm: 1000, rpd: 5, onDemandShare: 0 }, { now: c.now, store });
        expect(second.status().total).toBe(5);
        expect(second.spend('onDemand').ok).toBe(false);
    });

    it('a restart on a new day starts clean', () => {
        const c = clock();
        const store = memStore();
        const first = new Governor({ rpm: 1000, rpd: 5, onDemandShare: 0 }, { now: c.now, store });
        first.spend('onDemand', 5);

        c.advance(26 * 60 * 60 * 1000);
        const second = new Governor({ rpm: 1000, rpd: 5, onDemandShare: 0 }, { now: c.now, store });
        expect(second.status().total).toBe(0);
        expect(second.spend('onDemand').ok).toBe(true);
    });

    it('governs a fresh day rather than throwing when the store is broken', () => {
        const c = clock();
        const broken: GovernorStore = {
            load() {
                throw new Error('EACCES');
            },
            save() {
                throw new Error('EROFS');
            }
        };
        const g = new Governor(LIMITS, { now: c.now, store: broken });
        expect(() => g.spend('onDemand')).not.toThrow();
        expect(g.status().total).toBe(1);
    });

    it('does not mutate the state handed back by snapshot()', () => {
        const c = clock();
        const g = new Governor(LIMITS, { now: c.now });
        g.spend('onDemand');
        const snap = g.snapshot();
        snap.recent.push(0);
        snap.onDemand = 999;
        expect(g.status().onDemand).toBe(1);
    });
});

describe('"no" is an answer, never an exception', () => {
    it('never throws, whatever it is asked', () => {
        const c = clock();
        const g = new Governor({ rpm: 0, rpd: 0, onDemandShare: 1 }, { now: c.now });
        expect(() => {
            for (const lane of ['onDemand', 'backfill'] as const) {
                for (let i = 0; i < 5; i++) g.spend(lane);
            }
        }).not.toThrow();
        expect(g.status().total).toBe(0);
    });
});

describe('dayKey / emptyState', () => {
    it('is the UTC calendar day, so every instance agrees', () => {
        expect(dayKey(Date.UTC(2026, 8, 9, 23, 59, 59))).toBe('2026-09-09');
        expect(dayKey(Date.UTC(2026, 8, 10, 0, 0, 0))).toBe('2026-09-10');
    });

    it('starts a day at zero on both lanes', () => {
        const s = emptyState(Date.UTC(2026, 8, 9));
        expect(s).toEqual({ day: '2026-09-09', onDemand: 0, backfill: 0, recent: [] });
    });
});
