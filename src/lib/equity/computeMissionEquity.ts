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
  /**
   * Approved-but-not-yet-landed value: Σ mesimabetahalich(finnished≠true,
   * forappruval≠true) hoursassinged×perhour **plus** the monthly equivalent of
   * every active recurring-resource engine (mashabetahalich).
   */
  approvedInProgressValue: number;
  /**
   * The still-open pipeline: Σ open_missions (noofhours×perhour) **plus** the
   * planned value of every open resource request (open_mashaabim).
   */
  openPipelineValue: number;
  /**
   * Σ of the **recurring** in-progress work's monthly value — the `iskvua`
   * missions plus the recurring-resource engines. How much value the rikma adds
   * every month from standing commitments; a subset of
   * {@link approvedInProgressValue}. Drives the multi-year horizons: without it
   * the rikma would look frozen while the member keeps accruing, and every
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
 * The denominator one baseline dilutes against. The single definition of each
 * base, so the scenario rows and the pie slices can never drift apart.
 */
function scenarioBase(
  summary: ProjectValueSummary,
  V: number,
  baseline: EquityBaseline,
  alreadyCountedIn: AlreadyCountedIn
): number {
  const current = num(summary?.currentValue);
  const approvedInProgress = num(summary?.approvedInProgressValue);
  const openPipeline = num(summary?.openPipelineValue);

  // 'current': the mission is never part of currentValue, so always add V.
  if (baseline === 'current') return current + V;

  // 'approved': add V unless the mission already sits inside approvedInProgress.
  if (baseline === 'approved') {
    return current + approvedInProgress + (alreadyCountedIn === 'approved' ? 0 : V);
  }

  // 'pipeline': add V unless the mission already sits inside a counted bucket.
  return (
    current + approvedInProgress + openPipeline + (alreadyCountedIn === 'none' ? V : 0)
  );
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
  const V = num(missionValue);

  const estimate = summary?.monthlyIncomeEstimate ?? null;
  const monthly = (pct: number): number | null =>
    estimate != null && Number.isFinite(estimate) ? (pct / 100) * estimate : null;

  const build = (baseline: EquityBaseline): EquityScenario => {
    const base = scenarioBase(summary, V, baseline, alreadyCountedIn);
    const sharePct = shareOf(V, base);
    return { baseline, base, sharePct, monthlyEstimate: monthly(sharePct) };
  };

  return [build('current'), build('approved'), build('pipeline')];
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
// Breakdown — the same numbers as the scenarios above, decomposed into the
// slices a pie chart can draw. Kept next to the scenario math so the two can
// never disagree: Σ slices is asserted to equal the scenario's `base`, and the
// 'mine' slice's percentage *is* the scenario's `sharePct`.
// ---------------------------------------------------------------------------

/**
 * The parts a rikma's projected value splits into, from the viewer's angle:
 *  - `mine`            the mission/resource being previewed.
 *  - `existing`        what the rikma is already worth today.
 *  - `approvedOthers`  other approved-and-in-progress work.
 *  - `pipelineOthers`  everything else still open on offer.
 *  - `recurringOthers` (horizons only) the rikma's other standing monthly work,
 *                      accumulated over the horizon.
 */
export type EquitySliceKey =
  | 'mine'
  | 'existing'
  | 'approvedOthers'
  | 'pipelineOthers'
  | 'recurringOthers';

export interface EquitySlice {
  key: EquitySliceKey;
  value: number;
  /** 0..100 — this slice's share of {@link EquityBreakdown.total}. */
  pct: number;
}

export interface EquityBreakdown {
  /** Which scenario this decomposes; 'horizon' for a projected month count. */
  baseline: EquityBaseline | 'horizon';
  /** Months projected — only set when `baseline === 'horizon'`. */
  months: number | null;
  /** Σ of every slice — equals the matching scenario/horizon `base`. */
  total: number;
  /** The `mine` slice's percentage — equals the scenario's `sharePct`. */
  sharePct: number;
  /** Non-zero slices, `mine` first. */
  slices: EquitySlice[];
}

/** Drop empty slices and attach each one's percentage of the total. */
function toSlices(
  total: number,
  parts: Array<{ key: EquitySliceKey; value: number }>
): EquitySlice[] {
  return parts
    .filter((p) => p.value > 0)
    .map((p) => ({
      key: p.key,
      value: p.value,
      pct: total > 0 ? Math.min(100, (p.value / total) * 100) : 0
    }));
}

/**
 * Decompose one scenario into pie slices. Mirrors
 * {@link computeEquityScenarios} exactly — same inputs, same denominator, just
 * itemised.
 */
export function buildEquityBreakdown(
  summary: ProjectValueSummary,
  missionValue: number,
  opts: ComputeEquityOptions & { baseline?: EquityBaseline } = {}
): EquityBreakdown {
  const baseline = opts.baseline ?? 'current';
  const alreadyCountedIn = opts.alreadyCountedIn ?? 'none';

  const V = num(missionValue);
  const existing = num(summary?.currentValue);
  // The scenario's denominator is authoritative; the slices are that same
  // number itemised, so they are filled in order and the last one absorbs the
  // remainder. Nonsensical inputs (a mission "already in the pipeline" that is
  // worth more than the whole pipeline) then shrink a neighbouring slice instead
  // of breaking the invariant Σ slices = base.
  const total = scenarioBase(summary, V, baseline, alreadyCountedIn);

  // The mission's own value is carved out of whichever bucket already holds it,
  // so it appears exactly once — as the `mine` slice.
  const approvedAll = num(summary?.approvedInProgressValue);
  const remainder = Math.max(0, total - V - existing);
  const approvedOthers =
    baseline === 'current'
      ? 0
      : Math.min(
          remainder,
          Math.max(0, approvedAll - (alreadyCountedIn === 'approved' ? V : 0))
        );
  const pipelineOthers =
    baseline === 'pipeline' ? Math.max(0, remainder - approvedOthers) : 0;

  return {
    baseline,
    months: null,
    total,
    sharePct: shareOf(V, total),
    slices: toSlices(total, [
      { key: 'mine', value: V },
      { key: 'existing', value: existing },
      { key: 'approvedOthers', value: approvedOthers },
      { key: 'pipelineOthers', value: pipelineOthers }
    ])
  };
}

/**
 * Decompose one recurring horizon into pie slices. Mirrors
 * {@link computeEquityHorizons} for the same `months`.
 */
export function buildHorizonBreakdown(
  summary: ProjectValueSummary,
  monthlyValue: number,
  months: number,
  opts: ComputeEquityOptions = {}
): EquityBreakdown {
  const alreadyCountedIn = opts.alreadyCountedIn ?? 'none';
  const monthly = num(monthlyValue);
  const n = num(months);

  const existing = num(summary?.currentValue);
  const approvedAll = num(summary?.approvedInProgressValue);
  const recurring = num(summary?.recurringMonthlyValue);
  const oneOffApproved = Math.max(0, approvedAll - recurring);

  const rikmaMonthly = recurring + (alreadyCountedIn === 'approved' ? 0 : monthly);
  const mine = monthly * n;
  // Everything the *rest* of the rikma accrues over the same window.
  const recurringOthers = Math.max(0, (rikmaMonthly - monthly) * n);

  const total = existing + oneOffApproved + rikmaMonthly * n;

  return {
    baseline: 'horizon',
    months: n,
    total,
    sharePct: shareOf(mine, total),
    slices: toSlices(total, [
      { key: 'mine', value: mine },
      { key: 'existing', value: existing },
      { key: 'approvedOthers', value: oneOffApproved },
      { key: 'recurringOthers', value: recurringOthers }
    ])
  };
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
  /**
   * Recurring-resource engines (`recurring: true`, one per standing expense).
   * `pricePerUnit` is **one cycle's** spend, a cycle being `cycleSize`
   * months — or years when `kindOf: 'yearly'`.
   */
  mashabetahaliches?: RawCollection<{
    pricePerUnit?: number | null;
    cycleSize?: number | null;
    kindOf?: string | null;
    recurring?: boolean | null;
  }> | null;
  /** Open resource requests still on offer — the resource half of the pipeline. */
  open_mashaabims?: RawCollection<RawResourceTerms> | null;
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

// ---------------------------------------------------------------------------
// Resources — a resource's value is not hours×rate. Its terms decide whether the
// asked price is a one-off, a per-unit price, or a per-cycle expense.
// ---------------------------------------------------------------------------

/** The value-bearing terms shared by OpenMashaabim / Sp / Pmash rows. */
export interface RawResourceTerms {
  /** The rikma's asked value (`easy`) — preferred over the market `price`. */
  easy?: number | null;
  price?: number | null;
  /** Quantity ("how many"). */
  hm?: number | null;
  /** 'total' | 'perUnit' | 'monthly' | 'yearly' | 'rent'. */
  kindOf?: string | null;
  recurring?: boolean | null;
  /** Every N months (or years for `kindOf: 'yearly'`). */
  cycleSize?: number | null;
  /** Window start / end — a dated monthly/rent/yearly resource has a cycle count. */
  sqadualed?: string | null;
  sqadualedf?: string | null;
}

/** Average days per month / per year — matches `createResource.ts`'s divisors. */
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * How many cycles a dated resource window spans (1 when undated or one-off).
 * `montsi()` (the UI helper) computes the same figure with moment; the tiny
 * difference on partial months is invisible here — these cycles only ever
 * aggregate *other* resources into the rikma's totals, never the previewed one,
 * whose value its host component supplies directly.
 */
export function resourceCycles(terms: RawResourceTerms | null | undefined): number {
  const kind = terms?.kindOf ?? 'total';
  if (kind !== 'monthly' && kind !== 'yearly' && kind !== 'rent') return 1;
  const start = terms?.sqadualed ? new Date(terms.sqadualed) : null;
  const end = terms?.sqadualedf ? new Date(terms.sqadualedf) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }
  const days = (end.getTime() - start.getTime()) / MS_PER_DAY;
  if (!(days > 0)) return 1;
  const cycles = days / (kind === 'yearly' ? DAYS_PER_YEAR : DAYS_PER_MONTH);
  return cycles > 0 ? cycles : 1;
}

/**
 * A resource's planned value: asked price × quantity × cycles. Mirrors what the
 * cards show (`price × hm × montsi(…)`) and what lands in `Rikmash.total` on
 * acceptance.
 *
 * An **open-ended recurring** resource (recurring, no end date) has no total to
 * speak of — it bills forever — so it is priced at a single cycle here, and the
 * horizon rows are what give the honest long-run picture.
 */
export function computeResourceValue(terms: RawResourceTerms | null | undefined): number {
  const perCycle = num(terms?.easy) || num(terms?.price);
  if (perCycle <= 0) return 0;
  const quantity = Math.max(1, num(terms?.hm) || 1);
  return perCycle * quantity * resourceCycles(terms);
}

/**
 * A recurring resource's ₪/month — what it adds to the rikma's monthly flow.
 * A cycle covers `cycleSize` months (or years when `kindOf: 'yearly'`), so a
 * quarterly ₪300 expense is ₪100/month and a yearly ₪1,200 one is ₪100/month.
 * Returns 0 for anything that isn't a recurring monthly/yearly resource.
 */
export function computeResourceMonthlyValue(
  terms: RawResourceTerms | null | undefined
): number {
  const kind = terms?.kindOf ?? '';
  if (kind !== 'monthly' && kind !== 'yearly') return 0;
  const perCycle = num(terms?.easy) || num(terms?.price);
  if (perCycle <= 0) return 0;
  const quantity = Math.max(1, num(terms?.hm) || 1);
  const cycleMonths =
    Math.max(1, num(terms?.cycleSize) || 1) * (kind === 'yearly' ? 12 : 1);
  return (perCycle * quantity) / cycleMonths;
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

  // A recurring-resource engine has no total — it bills a cycle at a time — so
  // it enters both buckets below as its ₪/month equivalent. That keeps
  // recurringMonthlyValue a true subset of approvedInProgressValue (the horizon
  // math subtracts one from the other) and matches how an `iskvua` mission is
  // counted: one month's worth in the stock, the same figure in the flow.
  // `pricePerUnit` is the whole cycle's planned spend (that is the default the
  // cycle-approval flow reports), so it is not multiplied by a quantity here.
  const recurringResourceMonthly = sumAttr(raw?.mashabetahaliches, (a) =>
    computeResourceMonthlyValue({
      easy: a.pricePerUnit,
      kindOf: a.kindOf ?? 'monthly',
      cycleSize: a.cycleSize
    })
  );

  const approvedInProgressValue =
    sumAttr(raw?.mesimabetahaliches, (a) => num(a.hoursassinged) * num(a.perhour)) +
    recurringResourceMonthly;

  // The recurring slice of the same bucket — the rikma's monthly value flow.
  const recurringMonthlyValue =
    sumAttr(raw?.mesimabetahaliches, (a) =>
      a.iskvua === true ? num(a.hoursassinged) * num(a.perhour) : 0
    ) + recurringResourceMonthly;

  const openPipelineValue =
    sumAttr(raw?.open_missions, (a) => num(a.noofhours) * num(a.perhour)) +
    sumAttr(raw?.open_mashaabims, (a) => computeResourceValue(a));

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
