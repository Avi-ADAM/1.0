/**
 * buildIncomeSeries — turns a member's raw payout rows into the series behind
 * "how much have I actually earned here".
 *
 * The homepage graph argues a shape: a partner's income starts slower, grows
 * from several partnerships at once, and keeps arriving after the work is done.
 * This module is the same graph drawn from the member's own rows, which is the
 * only version of the claim that is checkable — so it is deliberately literal.
 * Every number here comes from a `Haluka` the member actually received.
 *
 * Three rules decide what counts, and each one exists because the opposite
 * would overstate the number:
 *
 *   • **Confirmed only.** An unconfirmed haluka is a transfer someone says they
 *     made. It is reported separately as `pending`, never inside the total —
 *     the same rule a `Sale` follows while its holder claim is open.
 *   • **Site-share excluded.** `isSiteShare` rows are the platform's cut of a
 *     split, not the member's income.
 *   • **One currency, one series.** Amounts in different currencies are never
 *     added together and never converted; each currency gets its own series and
 *     the UI shows the largest one first.
 *
 * "Fruit after the work" (`afterWork`) is the claim the graph makes about the
 * partner track, measured: money that arrived from a rikma more than
 * `AFTER_WORK_GRACE_DAYS` after the last work the member logged there. The
 * grace window is what keeps an ordinary end-of-month split from counting as
 * passive income.
 */

/** A haluka the member received, flattened out of the GraphQL response. */
export interface RawPayout {
  id: string;
  amount: number | null | undefined;
  confirmed?: boolean | null;
  createdAt?: string | null;
  isSiteShare?: boolean | null;
  projectId?: string | null;
  projectName?: string | null;
  /** Currency symbol, e.g. '₪'. */
  currency?: string | null;
  currencyName?: string | null;
}

/** A finished mission the member logged, used only to date their last work. */
export interface RawWorkLog {
  projectId?: string | null;
  /** When the work finished; falls back to `createdAt` upstream. */
  finish?: string | null;
  hours?: number | null;
}

export interface MonthPoint {
  /** 'YYYY-MM', UTC. */
  month: string;
  total: number;
  cumulative: number;
  /** projectId → amount received from that rikma this month. */
  byRikma: Record<string, number>;
}

export interface RikmaTotal {
  id: string;
  name: string;
  total: number;
  /** Fraction of this currency's total, 0..1. */
  share: number;
  payouts: number;
  firstAt: string | null;
  lastAt: string | null;
  /** Last logged work in this rikma, or null when none was logged. */
  lastWorkAt: string | null;
  /** Of `total`, how much arrived well after that last logged work. */
  afterWork: number;
}

export interface IncomeSeries {
  currency: string;
  currencyName: string | null;
  total: number;
  payouts: number;
  months: MonthPoint[];
  rikmas: RikmaTotal[];
  firstMonth: string | null;
  lastMonth: string | null;
  /** Calendar months from the first payout to the last, inclusive. */
  monthsSpanned: number;
  /** Of those, how many actually paid. */
  monthsPaid: number;
  bestMonth: MonthPoint | null;
  /** Total spread over the whole span, not only the months that paid. */
  avgPerMonth: number;
  afterWorkTotal: number;
  /** `afterWorkTotal / total`, 0..1. */
  afterWorkShare: number;
  /** The most rikmas that paid in a single month — the "several at once" claim. */
  concurrentPeak: number;
  /** Money reported as sent but not yet confirmed. Never part of `total`. */
  pending: { amount: number; count: number };
}

export interface IncomeSummary {
  series: IncomeSeries[];
  /** The largest series by total, or null when nothing has been received. */
  primary: IncomeSeries | null;
  /** True when there is not a single confirmed or pending row to show. */
  empty: boolean;
}

/**
 * How long after the last logged work a payout stops being "for the work I just
 * did" and starts being fruit of equity already earned. A month covers the
 * ordinary end-of-cycle split.
 */
export const AFTER_WORK_GRACE_DAYS = 30;

const DAY_MS = 86_400_000;
const UNKNOWN_RIKMA = '—';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 'YYYY-MM' in UTC, so the same row buckets identically on every machine. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Every month from `from` to `to` inclusive, so the x-axis has no holes. */
export function monthRange(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  // A malformed pair would otherwise spin forever; 1200 months is a century.
  for (let guard = 0; guard < 1200; guard++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (y === ty && m === tm) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Latest logged work per rikma, as epoch ms. */
function lastWorkByRikma(work: RawWorkLog[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of work) {
    const id = row.projectId ? String(row.projectId) : null;
    const at = parseDate(row.finish);
    if (!id || !at) continue;
    const prev = out.get(id);
    if (prev === undefined || at.getTime() > prev) out.set(id, at.getTime());
  }
  return out;
}

interface Counted {
  payout: RawPayout;
  at: Date;
  amount: number;
  rikmaId: string;
  rikmaName: string;
}

/**
 * Build one series per currency.
 *
 * @param payouts halukas the member received (confirmed and not)
 * @param work    the member's finished missions, for the "after the work" split
 */
export function buildIncomeSeries(
  payouts: RawPayout[],
  work: RawWorkLog[] = []
): IncomeSummary {
  const lastWork = lastWorkByRikma(work);

  /** currency symbol → the rows that count, plus what is still pending. */
  const buckets = new Map<
    string,
    { name: string | null; counted: Counted[]; pending: { amount: number; count: number } }
  >();

  for (const payout of payouts ?? []) {
    if (payout?.isSiteShare === true) continue;
    const amount = Number(payout?.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const at = parseDate(payout?.createdAt);
    if (!at) continue;

    const currency = (payout.currency || '').trim() || '';
    const bucket = buckets.get(currency) ?? {
      name: payout.currencyName ?? null,
      counted: [],
      pending: { amount: 0, count: 0 }
    };
    if (!bucket.name && payout.currencyName) bucket.name = payout.currencyName;

    if (payout.confirmed === true) {
      bucket.counted.push({
        payout,
        at,
        amount,
        rikmaId: payout.projectId ? String(payout.projectId) : UNKNOWN_RIKMA,
        rikmaName: payout.projectName || UNKNOWN_RIKMA
      });
    } else {
      bucket.pending.amount = round2(bucket.pending.amount + amount);
      bucket.pending.count += 1;
    }
    buckets.set(currency, bucket);
  }

  const series: IncomeSeries[] = [];
  for (const [currency, bucket] of buckets) {
    series.push(buildOne(currency, bucket.name, bucket.counted, bucket.pending, lastWork));
  }

  // Biggest first: a member paid mostly in one currency should see that one.
  series.sort((a, b) => b.total - a.total || b.pending.amount - a.pending.amount);

  const empty = series.every((s) => s.total === 0 && s.pending.amount === 0);
  return { series, primary: empty ? null : (series[0] ?? null), empty };
}

function buildOne(
  currency: string,
  currencyName: string | null,
  counted: Counted[],
  pending: { amount: number; count: number },
  lastWork: Map<string, number>
): IncomeSeries {
  const rows = [...counted].sort((a, b) => a.at.getTime() - b.at.getTime());

  const perMonth = new Map<string, { total: number; byRikma: Record<string, number> }>();
  const perRikma = new Map<string, RikmaTotal>();
  let total = 0;
  let afterWorkTotal = 0;

  for (const row of rows) {
    total = round2(total + row.amount);

    const key = monthKey(row.at);
    const month = perMonth.get(key) ?? { total: 0, byRikma: {} };
    month.total = round2(month.total + row.amount);
    month.byRikma[row.rikmaId] = round2((month.byRikma[row.rikmaId] ?? 0) + row.amount);
    perMonth.set(key, month);

    const workedAt = lastWork.get(row.rikmaId) ?? null;
    const isAfterWork =
      workedAt !== null && row.at.getTime() - workedAt > AFTER_WORK_GRACE_DAYS * DAY_MS;
    if (isAfterWork) afterWorkTotal = round2(afterWorkTotal + row.amount);

    const rikma =
      perRikma.get(row.rikmaId) ??
      ({
        id: row.rikmaId,
        name: row.rikmaName,
        total: 0,
        share: 0,
        payouts: 0,
        firstAt: null,
        lastAt: null,
        lastWorkAt: workedAt === null ? null : new Date(workedAt).toISOString(),
        afterWork: 0
      } satisfies RikmaTotal);
    rikma.total = round2(rikma.total + row.amount);
    rikma.payouts += 1;
    rikma.firstAt = rikma.firstAt ?? row.at.toISOString();
    rikma.lastAt = row.at.toISOString();
    if (isAfterWork) rikma.afterWork = round2(rikma.afterWork + row.amount);
    perRikma.set(row.rikmaId, rikma);
  }

  const paidMonths = [...perMonth.keys()].sort();
  const firstMonth = paidMonths[0] ?? null;
  const lastMonth = paidMonths[paidMonths.length - 1] ?? null;

  const months: MonthPoint[] = [];
  let cumulative = 0;
  if (firstMonth && lastMonth) {
    for (const key of monthRange(firstMonth, lastMonth)) {
      const hit = perMonth.get(key);
      cumulative = round2(cumulative + (hit?.total ?? 0));
      months.push({
        month: key,
        total: hit?.total ?? 0,
        cumulative,
        byRikma: hit?.byRikma ?? {}
      });
    }
  }

  const rikmas = [...perRikma.values()]
    .map((r) => ({ ...r, share: total > 0 ? r.total / total : 0 }))
    .sort((a, b) => b.total - a.total);

  const bestMonth = months.reduce<MonthPoint | null>(
    (best, m) => (best === null || m.total > best.total ? m : best),
    null
  );

  const concurrentPeak = months.reduce(
    (peak, m) => Math.max(peak, Object.keys(m.byRikma).length),
    0
  );

  return {
    currency,
    currencyName,
    total,
    payouts: rows.length,
    months,
    rikmas,
    firstMonth,
    lastMonth,
    monthsSpanned: months.length,
    monthsPaid: paidMonths.length,
    bestMonth,
    avgPerMonth: months.length > 0 ? round2(total / months.length) : 0,
    afterWorkTotal,
    afterWorkShare: total > 0 ? afterWorkTotal / total : 0,
    concurrentPeak,
    pending
  };
}
