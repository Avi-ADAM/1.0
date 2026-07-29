/**
 * computeMissionEquity — the single source of truth for "what share of the
 * rikma will this mission represent". Pure & deterministic so it can run on the
 * client (lev cards, creation form) and be unit-tested with fixture payloads.
 *
 * See docs/PLAN_MISSION_EQUITY_PREVIEW.md §2. The "current value" scenario must
 * reproduce the split-page formula exactly:
 *   rikma current value = Σ finnished_missions.total + Σ rikmashes.total
 */

/** A rikma's value broken into the buckets the scenarios need. */
export interface ProjectValueSummary {
  /** Σ finnished_missions.total + Σ rikmashes.total — matches split page. */
  currentValue: number;
  /** Σ mesimabetahalich(finnished≠true, forappruval≠true) hoursassinged×perhour. */
  approvedInProgressValue: number;
  /** Σ open_missions (noofhours×perhour) — the still-open pipeline. */
  openPipelineValue: number;
  /**
   * Σ of the **recurring** (`iskvua`) in-progress missions' monthly value — how
   * much value the rikma adds every month from standing commitments. A subset
   * of {@link approvedInProgressValue}. Drives the multi-year horizons: without
   * it the rikma would look frozen while the member keeps accruing, and every
   * projection would converge on 100%.
   */
  recurringMonthlyValue: number;
  /** Trailing monthly income estimate, null when no data (phase 4). */
  monthlyIncomeEstimate: number | null;
  /**
   * Where {@link monthlyIncomeEstimate} came from — drives which disclaimer the
   * UI shows. 'sales' = trailing average of real income; 'commitments' = weaker
   * estimate from standing monthly product commitments; null = no estimate.
   */
  monthlyIncomeSource: 'sales' | 'commitments' | null;
}

export type EquityBaseline = 'current' | 'approved' | 'pipeline';

export interface EquityScenario {
  baseline: EquityBaseline;
  /** Denominator used (already includes the mission when relevant). */
  base: number;
  /** 0..100 */
  sharePct: number;
  /** ₪/month = sharePct × monthlyIncomeEstimate, null when no estimate. */
  monthlyEstimate: number | null;
}

/**
 * Where the mission already lives, so its value is not double-counted:
 *  - 'none'      new mission (candidate / creation form) — add V to every base.
 *  - 'approved'  member viewing a mission they execute — already inside
 *                approvedInProgressValue, don't add V to approved/pipeline.
 *  - 'pipeline'  one of the open_missions (availableMission page, lev card) —
 *                don't add V to the pipeline base.
 */
export type AlreadyCountedIn = 'none' | 'approved' | 'pipeline';

export interface ComputeEquityOptions {
  alreadyCountedIn?: AlreadyCountedIn;
}

/** Horizons offered for a recurring mission, in months: 1, 2 and 5 years. */
export const HORIZON_MONTHS = [12, 24, 60] as const;

export interface EquityHorizon {
  /** Months from today. */
  months: number;
  /** What the member will have contributed by then — monthlyValue × months. */
  cumulativeValue: number;
  /** The rikma's projected value at that point (includes cumulativeValue). */
  base: number;
  /** 0..100 */
  sharePct: number;
  /** ₪/month at that share, null when there's no income estimate. */
  monthlyEstimate: number | null;
}

/** Coerce anything to a finite non-negative number (null/NaN/missing → 0). */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** share = V / base, clamped to [0, 100]; base ≤ 0 with V > 0 ⇒ 100%. */
function shareOf(missionValue: number, base: number): number {
  if (!(base > 0)) return missionValue > 0 ? 100 : 0;
  const pct = (missionValue / base) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Build the equity scenarios for a mission worth `missionValue` in a rikma
 * described by `summary`. Dilution model — "if the mission were completed today".
 */
export function computeEquityScenarios(
  summary: ProjectValueSummary,
  missionValue: number,
  opts: ComputeEquityOptions = {}
): EquityScenario[] {
  const alreadyCountedIn = opts.alreadyCountedIn ?? 'none';

  const current = num(summary?.currentValue);
  const approvedInProgress = num(summary?.approvedInProgressValue);
  const openPipeline = num(summary?.openPipelineValue);
  const V = num(missionValue);

  // 'current': the mission is never part of currentValue, so always add V.
  const currentBase = current + V;

  // 'approved': add V unless the mission already sits inside approvedInProgress.
  const approvedBase =
    current + approvedInProgress + (alreadyCountedIn === 'approved' ? 0 : V);

  // 'pipeline': add V unless the mission already sits inside a counted bucket.
  const pipelineBase =
    current +
    approvedInProgress +
    openPipeline +
    (alreadyCountedIn === 'none' ? V : 0);

  const estimate = summary?.monthlyIncomeEstimate ?? null;
  const monthly = (pct: number): number | null =>
    estimate != null && Number.isFinite(estimate) ? (pct / 100) * estimate : null;

  const build = (baseline: EquityBaseline, base: number): EquityScenario => {
    const sharePct = shareOf(V, base);
    return { baseline, base, sharePct, monthlyEstimate: monthly(sharePct) };
  };

  return [
    build('current', currentBase),
    build('approved', approvedBase),
    build('pipeline', pipelineBase)
  ];
}

/**
 * Project a **recurring** mission's share forward. A monthly mission's
 * `noofhours × perhour` is one month's worth, so the single-shot scenarios
 * above understate it: with no end date the member keeps accruing every month.
 *
 * Both sides of the fraction grow, which is the whole point:
 *
 *   share(N) = (monthlyValue × N)
 *              ─────────────────────────────────────────────
 *              currentValue + oneOffApproved + rikmaMonthly × N
 *
 * where `rikmaMonthly` is every standing recurring mission in the rikma (this
 * one included). Growing only the numerator would march every projection to
 * 100%; growing both makes the series converge on `monthlyValue / rikmaMonthly`
 * — the mission's share of the rikma's *flow*, which is the honest long-run
 * answer. `oneOffApproved` is the non-recurring in-progress work, which lands
 * in the rikma's value once and then stops.
 *
 * Assumes the mission has no end date and that today's monthly rates hold.
 * Returns [] when the mission is not recurring (monthlyValue ≤ 0).
 */
export function computeEquityHorizons(
  summary: ProjectValueSummary,
  monthlyValue: number,
  opts: ComputeEquityOptions = {}
): EquityHorizon[] {
  const alreadyCountedIn = opts.alreadyCountedIn ?? 'none';
  const monthly = num(monthlyValue);
  if (monthly <= 0) return [];

  const current = num(summary?.currentValue);
  const approvedInProgress = num(summary?.approvedInProgressValue);
  const recurring = num(summary?.recurringMonthlyValue);

  // Recurring missions are a subset of the in-progress bucket; what's left is
  // one-off work that adds its value once.
  const oneOffApproved = Math.max(0, approvedInProgress - recurring);

  // The rikma's monthly flow already contains this mission when it is an
  // approved recurring one; otherwise joining it adds to the flow.
  const rikmaMonthly = recurring + (alreadyCountedIn === 'approved' ? 0 : monthly);

  const estimate = summary?.monthlyIncomeEstimate ?? null;

  return HORIZON_MONTHS.map((months) => {
    const cumulativeValue = monthly * months;
    const base = current + oneOffApproved + rikmaMonthly * months;
    const sharePct = shareOf(cumulativeValue, base);
    return {
      months,
      cumulativeValue,
      base,
      sharePct,
      monthlyEstimate:
        estimate != null && Number.isFinite(estimate) ? (sharePct / 100) * estimate : null
    };
  });
}

// ---------------------------------------------------------------------------
// summarize() — GraphQL payload → ProjectValueSummary. Lives here (not in the
// store) so it is unit-testable with fixture payloads. See PLAN §3.2.
// ---------------------------------------------------------------------------

/** Minimal shape of the getProjectValueSummary GraphQL payload we consume. */
interface RawCollection<T> {
  data?: Array<{ attributes?: T | null } | null> | null;
}
export interface RawProjectValue {
  finnished_missions?: RawCollection<{ total?: number | null }> | null;
  rikmashes?: RawCollection<{ total?: number | null }> | null;
  mesimabetahaliches?: RawCollection<{
    hoursassinged?: number | null;
    perhour?: number | null;
    /** True ⇒ hoursassinged×perhour is a **monthly** figure, not a one-off. */
    iskvua?: boolean | null;
  }> | null;
  open_missions?: RawCollection<{
    noofhours?: number | null;
    perhour?: number | null;
  }> | null;
  sales?: RawCollection<{
    in?: number | null;
    date?: string | null;
    holderStatus?: string | null;
  }> | null;
  matanotofs?: RawCollection<{
    price?: number | null;
    kindOf?: string | null;
  }> | null;
}

/**
 * Number of trailing calendar months the income average spans (phase 4).
 * Exported so the UI can name the window in its "this is only an estimate"
 * note instead of hard-coding a number that could drift.
 */
export const INCOME_WINDOW_MONTHS = 6;

/**
 * A sale counts toward income only when **effective** — matching the
 * balances/tosplits rule in the sale-holder-consent super-principle: holderStatus
 * in self/confirmed/null-legacy, never 'open'.
 */
function isEffectiveSale(status: string | null | undefined): boolean {
  return status == null || status === 'self' || status === 'confirmed';
}

/** UTC start-of-month, so the window math is timezone-stable. */
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Calendar months from `a` to `b` inclusive (both start-of-month), min 1. */
function monthsInclusive(a: Date, b: Date): number {
  const n =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth()) +
    1;
  return n > 0 ? n : 1;
}

/**
 * Estimate ₪/month for a rikma (phase 4). Prefers a trailing average of real
 * income (Σ effective sales.in over the last {@link INCOME_WINDOW_MONTHS}
 * calendar months, dividing only by the months since the first sale so a young
 * rikma isn't diluted by empty months). Falls back to standing monthly product
 * commitments (matanotofs: monthly→price, yearly→price/12) when there is no
 * recent income, and to null when there's neither.
 */
export function computeMonthlyIncome(
  sales: RawProjectValue['sales'],
  matanotofs: RawProjectValue['matanotofs'],
  now: Date
): { estimate: number | null; source: 'sales' | 'commitments' | null } {
  const nowMonth = startOfMonth(now);
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (INCOME_WINDOW_MONTHS - 1), 1)
  );

  const datedSales = (sales?.data ?? [])
    .map((row) => row?.attributes)
    .filter((a): a is NonNullable<typeof a> => !!a && isEffectiveSale(a.holderStatus))
    .map((a) => ({ inAmt: num(a.in), date: a.date ? new Date(a.date) : null }))
    .filter((s) => s.date != null && !Number.isNaN(s.date.getTime())) as Array<{
    inAmt: number;
    date: Date;
  }>;

  if (datedSales.length > 0) {
    const firstMonth = startOfMonth(
      new Date(Math.min(...datedSales.map((s) => s.date.getTime())))
    );
    const effectiveStart = firstMonth > windowStart ? firstMonth : windowStart;
    const sum = datedSales
      .filter((s) => {
        const m = startOfMonth(s.date);
        return m >= effectiveStart && m <= nowMonth;
      })
      .reduce((t, s) => t + s.inAmt, 0);
    if (sum > 0) {
      return { estimate: sum / monthsInclusive(effectiveStart, nowMonth), source: 'sales' };
    }
  }

  let monthlyCommit = 0;
  for (const row of matanotofs?.data ?? []) {
    const a = row?.attributes;
    if (!a) continue;
    const price = num(a.price);
    if (a.kindOf === 'monthly') monthlyCommit += price;
    else if (a.kindOf === 'yearly') monthlyCommit += price / 12;
  }
  if (monthlyCommit > 0) return { estimate: monthlyCommit, source: 'commitments' };

  return { estimate: null, source: null };
}

function sumAttr<T>(
  coll: RawCollection<T> | null | undefined,
  pick: (attrs: T) => number
): number {
  const rows = coll?.data ?? [];
  let total = 0;
  for (const row of rows) {
    const attrs = row?.attributes;
    if (attrs) total += pick(attrs);
  }
  return total;
}

/**
 * Fold a raw `project.attributes` payload into a ProjectValueSummary.
 * Treats every missing/null number as 0. `now` is injectable for deterministic
 * tests of the phase-4 income window.
 */
export function summarize(
  raw: RawProjectValue | null | undefined,
  now: Date = new Date()
): ProjectValueSummary {
  const currentValue =
    sumAttr(raw?.finnished_missions, (a) => num(a.total)) +
    sumAttr(raw?.rikmashes, (a) => num(a.total));

  const approvedInProgressValue = sumAttr(
    raw?.mesimabetahaliches,
    (a) => num(a.hoursassinged) * num(a.perhour)
  );

  // The recurring slice of the same bucket — the rikma's monthly value flow.
  const recurringMonthlyValue = sumAttr(raw?.mesimabetahaliches, (a) =>
    a.iskvua === true ? num(a.hoursassinged) * num(a.perhour) : 0
  );

  const openPipelineValue = sumAttr(
    raw?.open_missions,
    (a) => num(a.noofhours) * num(a.perhour)
  );

  const income = computeMonthlyIncome(raw?.sales, raw?.matanotofs, now);

  return {
    currentValue,
    approvedInProgressValue,
    openPipelineValue,
    recurringMonthlyValue,
    monthlyIncomeEstimate: income.estimate,
    monthlyIncomeSource: income.source
  };
}

/**
 * Format a 0..100 share for display: floor tiny non-zero values to "<0.1%" so a
 * real (but small) share never renders as a misleading "0.0%".
 */
export function formatSharePct(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '0%';
  if (pct < 0.1) return '<0.1%';
  return `${pct.toFixed(1)}%`;
}
