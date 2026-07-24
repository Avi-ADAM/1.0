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
  /** Trailing monthly income estimate, null when no data (phase 4). */
  monthlyIncomeEstimate: number | null;
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
  }> | null;
  open_missions?: RawCollection<{
    noofhours?: number | null;
    perhour?: number | null;
  }> | null;
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
 * Treats every missing/null number as 0. `monthlyIncomeEstimate` stays null
 * until phase 4 wires up the sales/commitments math.
 */
export function summarize(raw: RawProjectValue | null | undefined): ProjectValueSummary {
  const currentValue =
    sumAttr(raw?.finnished_missions, (a) => num(a.total)) +
    sumAttr(raw?.rikmashes, (a) => num(a.total));

  const approvedInProgressValue = sumAttr(
    raw?.mesimabetahaliches,
    (a) => num(a.hoursassinged) * num(a.perhour)
  );

  const openPipelineValue = sumAttr(
    raw?.open_missions,
    (a) => num(a.noofhours) * num(a.perhour)
  );

  return {
    currentValue,
    approvedInProgressValue,
    openPipelineValue,
    monthlyIncomeEstimate: null
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
