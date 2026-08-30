/**
 * incomeCurves — the illustrative "three ways to earn a living" model behind the
 * homepage graph (employee · freelancer/self-employed · partner in a rikma).
 *
 * Pure and deterministic so the same numbers can be plotted, unit-tested and
 * quoted in copy. The values are **relative units**, not currency: a first-year
 * employee salary is the 100 everything else is read against. That is
 * deliberate — the claim the graph makes is about the *shape* of each income
 * over time, and a shekel figure would invite an argument about the wrong thing.
 *
 * The three shapes, and where each one comes from:
 *
 *   employee   — flat with seniority steps, then a cliff. The salary barely
 *                moves over a decade; what actually happens to it is the day the
 *                job ends, when it becomes unemployment pay for a few months and
 *                then nothing.
 *   freelancer — a graded climb (reputation, a returning client base) and the
 *                same cliff, minus the few months of cover: stop working, stop
 *                earning, same day.
 *   partner    — the slowest start (a first rikma rarely pays in month one) and
 *                the only curve that survives its own stop date. Because a
 *                partner can hold several partnerships at once, each one is
 *                modelled separately and they sum; because equity keeps paying
 *                after the work is done, the partnerships already started keep
 *                maturing after the stop — what ends is the ability to open new
 *                ones, not the fruit of the old.
 *
 * The partner curve is *not* drawn as "keeps growing forever". After the stop it
 * flattens toward the accrued equity of the partnerships that already exist.
 * That is the honest version of the claim and it is still the only one of the
 * three that does not go to zero.
 */

export type Track = 'employee' | 'freelancer' | 'partner';

export interface CurvePoint {
  /** Years since starting out. */
  year: number;
  /** Monthly income in relative units (first-year employee salary = 100). */
  value: number;
}

export interface CurveOptions {
  /**
   * The year the person stops working. Everything before it is identical for
   * all three tracks; the whole point of the graph is what happens after.
   */
  stopYear: number;
  /** How many years the x-axis spans. */
  years?: number;
  /** Sampling resolution in years. */
  step?: number;
}

/** Starting monthly salary — the unit the other two curves are read against. */
export const EMPLOYEE_BASE = 100;

/** Seniority raise, granted as a step on each full year of tenure. */
const EMPLOYEE_SENIORITY_STEP = 0.025;

/**
 * Unemployment pay: a fraction of the last salary, for a limited window, and
 * only for the employee — the other two tracks never paid into it.
 */
export const UNEMPLOYMENT_RATE = 0.7;
export const UNEMPLOYMENT_YEARS = 0.25; // three months

/** Freelancer: where they start, and the ceiling reputation carries them to. */
const FREELANCE_BASE = 60;
const FREELANCE_CEILING_GAIN = 95;
/** Years for the reputation climb to cover ~63% of the remaining gap. */
const FREELANCE_RAMP = 3.2;

/**
 * The partnerships one partner accumulates, as (year opened, mature monthly
 * yield). A partner does not replace one rikma with the next — they hold them
 * at the same time, which is why these sum rather than switch.
 */
export const PARTNERSHIPS: ReadonlyArray<{ startYear: number; cap: number }> = [
  { startYear: 0, cap: 70 },
  { startYear: 2, cap: 55 },
  { startYear: 4, cap: 45 },
  { startYear: 6.5, cap: 40 }
];

/** Years for a single partnership to reach ~63% of its mature yield. */
const PARTNERSHIP_RAMP = 2.2;

/** Round to 2 decimals without floating-point dust. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Round a year mark. Finer than round2, so `stopYear - CLIFF_EPSILON` survives. */
function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/**
 * How far before a cliff the "still earning" sample sits — under a day, so the
 * drop renders as a vertical line rather than a diagonal to the next sample.
 */
export const CLIFF_EPSILON = 0.002;

/** Saturating growth: 0 at `t = 0`, approaching 1 as `t` grows. */
function ramp(t: number, tau: number): number {
  return t <= 0 ? 0 : 1 - Math.exp(-t / tau);
}

/**
 * Employee: the salary itself, ignoring the stop date. Steps up on each full
 * year of tenure and otherwise sits still.
 */
export function employeeSalary(year: number): number {
  const tenure = Math.max(0, Math.floor(year));
  return EMPLOYEE_BASE * (1 + EMPLOYEE_SENIORITY_STEP * tenure);
}

/** Employee income at `year`, including the post-stop unemployment window. */
export function employeeAt(year: number, stopYear: number): number {
  if (year < stopYear) return employeeSalary(year);
  if (year < stopYear + UNEMPLOYMENT_YEARS) {
    return employeeSalary(stopYear) * UNEMPLOYMENT_RATE;
  }
  return 0;
}

/** Freelancer income at `year`: a graded climb, then nothing at all. */
export function freelancerAt(year: number, stopYear: number): number {
  if (year >= stopYear) return 0;
  return FREELANCE_BASE + FREELANCE_CEILING_GAIN * ramp(year, FREELANCE_RAMP);
}

/**
 * Partner income at `year`: the sum of every partnership already opened.
 *
 * After `stopYear` no new partnership opens — that is what stopping costs — but
 * the ones already running go on maturing, so the curve flattens toward their
 * accrued yield instead of falling to zero.
 */
export function partnerAt(year: number, stopYear: number): number {
  let total = 0;
  for (const { startYear, cap } of PARTNERSHIPS) {
    if (startYear > year) continue;
    if (startYear >= stopYear) continue; // never opened — the stop came first
    total += cap * ramp(year - startYear, PARTNERSHIP_RAMP);
  }
  return total;
}

const TRACK_FNS: Record<Track, (year: number, stopYear: number) => number> = {
  employee: employeeAt,
  freelancer: freelancerAt,
  partner: partnerAt
};

/**
 * Sample one track across the whole x-axis.
 *
 * The stop date is sampled from both sides (`stopYear - ε` and `stopYear`) so
 * the employee's and freelancer's cliffs render as vertical drops rather than
 * as a diagonal to the next sample — the drop is the point of the graph, and a
 * diagonal reads as "it tapers off", which is exactly what it does not do.
 */
export function buildCurve(track: Track, options: CurveOptions): CurvePoint[] {
  const { stopYear, years = 10, step = 0.25 } = options;
  const fn = TRACK_FNS[track];

  const marks = new Set<number>();
  for (let y = 0; y <= years + 1e-9; y += step) marks.add(round4(y));
  for (const edge of [stopYear, stopYear + UNEMPLOYMENT_YEARS]) {
    if (edge > 0 && edge <= years) {
      marks.add(round4(edge - CLIFF_EPSILON));
      marks.add(round4(edge));
    }
  }
  // A partnership opening is a bend in the partner curve; sample it exactly so
  // the bend lands on the year it belongs to.
  if (track === 'partner') {
    for (const { startYear } of PARTNERSHIPS) {
      if (startYear > 0 && startYear <= years) marks.add(round4(startYear));
    }
  }

  return [...marks]
    .sort((a, b) => a - b)
    .map((year) => ({ year, value: round2(fn(year, stopYear)) }));
}

/** All three tracks, sampled on the same x-axis. */
export function buildAllCurves(options: CurveOptions): Record<Track, CurvePoint[]> {
  return {
    employee: buildCurve('employee', options),
    freelancer: buildCurve('freelancer', options),
    partner: buildCurve('partner', options)
  };
}

/**
 * Area under a curve — total earned over the whole span, in "months of a
 * first-year salary". Trapezoidal, which is exact enough for a headline number
 * next to a graph that is explicitly illustrative.
 */
export function lifetimeTotal(points: CurvePoint[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    sum += ((a.value + b.value) / 2) * (b.year - a.year);
  }
  return round2(sum * 12);
}

/** The largest value any track reaches — the y-axis ceiling for all three. */
export function curvesMax(curves: Record<Track, CurvePoint[]>): number {
  let max = 0;
  for (const points of Object.values(curves)) {
    for (const p of points) if (p.value > max) max = p.value;
  }
  return max;
}
