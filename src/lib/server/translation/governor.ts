/**
 * The quota governor (§5.3 of docs/PLAN_UGC_TRANSLATION.md) — the only thing
 * in the system allowed to say "yes, spend a request".
 *
 * The cost constraint is the design constraint, so this is where it lives, in
 * one pure class with an injectable clock. Four properties it must have, and
 * each one is a test below:
 *
 * 1. **A rolling per-minute window**, because the free tier's binding limit is
 *    requests per minute, not tokens.
 * 2. **A per-day counter that survives a restart.** A day's budget that resets
 *    every deploy is not a budget.
 * 3. **A reserved slice for on-demand traffic that backfill can never eat.**
 *    Without it, one backfill run makes every live miss un-fillable until
 *    midnight — the feature would look broken precisely on the days it worked
 *    hardest.
 * 4. **"No" is an answer, never an exception.** When the budget is gone the
 *    caller renders source text. Degradation is invisible to the reader; it is
 *    never an error page and never a toast.
 */

export type Lane = 'onDemand' | 'backfill';

export interface GovernorLimits {
    rpm: number;
    rpd: number;
    /** 0–1. The share of `rpd` only `onDemand` may reach. */
    onDemandShare: number;
}

/** Everything that has to survive a restart. Plain JSON on purpose. */
export interface GovernorState {
    /** `YYYY-MM-DD`, UTC. A day boundary the whole fleet agrees on. */
    day: string;
    onDemand: number;
    backfill: number;
    /** Epoch-ms of each request in the current minute window. */
    recent: number[];
}

export type Refusal = 'rpm' | 'rpd' | 'reserve';

/**
 * One flat shape rather than a discriminated union on `ok`.
 *
 * The repo compiles with `strict: false` (see jsconfig.json), and without
 * `strictNullChecks` TypeScript does not narrow a union by a boolean literal
 * discriminant — every `if (!d.ok) d.reason` would be an error at the call
 * site. A union that cannot be narrowed is worse than no union: it pushes
 * casts into the callers.
 */
export interface Decision {
    ok: boolean;
    day: string;
    /** Requests left in the day's budget for this lane's ceiling. */
    remaining: number;
    /** Why it was refused. Absent when `ok`. */
    reason?: Refusal;
    /** 0 when `ok`. */
    retryAfterMs: number;
}

/** A persistence adapter. Both halves may throw or return null; both fail soft. */
export interface GovernorStore {
    load(): GovernorState | null;
    save(state: GovernorState): void;
}

const MINUTE_MS = 60_000;

/** `YYYY-MM-DD` in UTC. */
export function dayKey(now: number): string {
    return new Date(now).toISOString().slice(0, 10);
}

export function emptyState(now: number): GovernorState {
    return { day: dayKey(now), onDemand: 0, backfill: 0, recent: [] };
}

export class Governor {
    private limits: GovernorLimits;
    private now: () => number;
    private store?: GovernorStore;
    private state: GovernorState;

    constructor(
        limits: GovernorLimits,
        opts: { now?: () => number; store?: GovernorStore } = {}
    ) {
        this.limits = limits;
        this.now = opts.now ?? (() => Date.now());
        this.store = opts.store;

        let loaded: GovernorState | null = null;
        try {
            loaded = this.store?.load() ?? null;
        } catch {
            // A governor that cannot read its own state must still govern; it
            // just governs a fresh day. Refusing to start would take the whole
            // read path down over a file permission.
            loaded = null;
        }
        this.state = this.roll(loaded ?? emptyState(this.now()));
    }

    /**
     * Drop a stale day and expire the minute window. Called before every
     * decision so a governor that sat idle overnight does not answer with
     * yesterday's spend.
     */
    private roll(state: GovernorState): GovernorState {
        const now = this.now();
        const today = dayKey(now);
        const rolled: GovernorState =
            state.day === today
                ? { ...state, recent: [...(state.recent ?? [])] }
                : emptyState(now);
        rolled.recent = rolled.recent.filter((t) => now - t < MINUTE_MS);
        return rolled;
    }

    /** The daily ceiling for one lane. Backfill stops short of the reserve. */
    private ceiling(lane: Lane): number {
        if (lane === 'onDemand') return this.limits.rpd;
        return Math.floor(this.limits.rpd * (1 - this.limits.onDemandShare));
    }

    private spentIn(lane: Lane): number {
        return lane === 'onDemand' ? this.state.onDemand : this.state.backfill;
    }

    private total(): number {
        return this.state.onDemand + this.state.backfill;
    }

    /**
     * May this lane spend `n` requests right now? Does not record anything —
     * `spend()` is check-and-record in one step, and is what callers want.
     */
    check(lane: Lane, n = 1): Decision {
        this.state = this.roll(this.state);
        const now = this.now();
        const day = this.state.day;

        // The reserve is the interesting one, so it is checked first: a
        // backfill refused for eating into on-demand should say so, not blame
        // the shared daily ceiling it has not reached yet.
        const laneRemaining = this.ceiling(lane) - this.spentIn(lane);
        if (lane === 'backfill' && laneRemaining < n) {
            return {
                ok: false,
                day,
                reason: 'reserve',
                retryAfterMs: msToMidnight(now),
                remaining: Math.max(0, laneRemaining)
            };
        }

        const dayRemaining = this.limits.rpd - this.total();
        if (dayRemaining < n) {
            return {
                ok: false,
                day,
                reason: 'rpd',
                retryAfterMs: msToMidnight(now),
                remaining: Math.max(0, dayRemaining)
            };
        }

        if (this.state.recent.length + n > this.limits.rpm) {
            const oldest = this.state.recent[0] ?? now;
            return {
                ok: false,
                day,
                reason: 'rpm',
                retryAfterMs: Math.max(0, MINUTE_MS - (now - oldest)),
                remaining: Math.max(0, dayRemaining)
            };
        }

        return { ok: true, day, remaining: dayRemaining - n, retryAfterMs: 0 };
    }

    /**
     * Check, and record the spend when the answer is yes. The only mutator.
     *
     * Record *before* the request is made, not after: a request that is sent
     * and then fails still consumed the quota, and a governor that only counts
     * successes is a governor that overspends on a bad afternoon.
     */
    spend(lane: Lane, n = 1): Decision {
        const decision = this.check(lane, n);
        if (!decision.ok) return decision;

        const now = this.now();
        if (lane === 'onDemand') this.state.onDemand += n;
        else this.state.backfill += n;
        for (let i = 0; i < n; i++) this.state.recent.push(now);

        this.persist();
        return decision;
    }

    private persist(): void {
        try {
            this.store?.save(this.state);
        } catch {
            // The day counter is a nicety; refusing to serve because it could
            // not be written would trade a small overspend for an outage.
        }
    }

    /** What `--status` and the warm endpoint's headers want to say out loud. */
    status(): {
        day: string;
        onDemand: number;
        backfill: number;
        total: number;
        rpd: number;
        rpm: number;
        backfillCeiling: number;
        inLastMinute: number;
    } {
        this.state = this.roll(this.state);
        return {
            day: this.state.day,
            onDemand: this.state.onDemand,
            backfill: this.state.backfill,
            total: this.total(),
            rpd: this.limits.rpd,
            rpm: this.limits.rpm,
            backfillCeiling: this.ceiling('backfill'),
            inLastMinute: this.state.recent.length
        };
    }

    /** For tests and for the backfill job's `--status`, which must not spend. */
    snapshot(): GovernorState {
        return { ...this.state, recent: [...this.state.recent] };
    }
}

function msToMidnight(now: number): number {
    const next = Date.UTC(
        new Date(now).getUTCFullYear(),
        new Date(now).getUTCMonth(),
        new Date(now).getUTCDate() + 1
    );
    return Math.max(0, next - now);
}

/**
 * A governor for the running server, shared across requests in this process.
 *
 * Deliberately per-process rather than per-request: the whole point is that
 * two concurrent readers cannot each be told "yes" for the last request of the
 * day. It is *not* shared across instances — a multi-instance deploy governs
 * per instance, which overspends by at most a factor of the instance count and
 * is the honest limit of a design with no shared counter. When that matters,
 * the counter moves to Strapi; until then, set `TRANSLATE_RPD` accordingly.
 */
let singleton: Governor | null = null;

export function serverGovernor(
    limits: GovernorLimits,
    store?: GovernorStore
): Governor {
    if (!singleton) singleton = new Governor(limits, { store });
    return singleton;
}

/** Tests and the backfill job build their own; this drops the shared one. */
export function resetServerGovernor(): void {
    singleton = null;
}
