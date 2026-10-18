/**
 * The main sales page, read off the rikma's sales (canvas "Main" /
 * "DesktopOverview", PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3). Display only — every
 * number here is a sum of what `getProjectFinancials` already returned, cut the
 * same way `hamatanot.svelte` always cut it: a sale is split (`splited`), in a
 * vote (`pending`), or waiting. Nothing here decides what a split contains;
 * that stays in `whowhat.svelte` and the actions behind it.
 */
import dayjs from 'dayjs';

export type SaleLike = {
  id: string | number;
  attributes: {
    in: number | string | null;
    date?: string | null;
    pending?: boolean | null;
    splited?: boolean | null;
    holderStatus?: string | null;
    confirmedBy?: string | null;
  };
};

export type Stage = 'waiting' | 'voting' | 'split';
export type StageFilter = Stage | 'all';

export function saleStage(s: SaleLike): Stage {
  if (s.attributes.splited) return 'split';
  if (s.attributes.pending) return 'voting';
  return 'waiting';
}

/**
 * Who stands behind the money (PLAN_sale_holder_consent). `legacy` is a sale
 * from before holder consent existed: unverified, still counted.
 */
export type HolderState = 'self' | 'open' | 'timeout' | 'confirmed' | 'legacy';

export function holderState(s: SaleLike): HolderState {
  const hs = s.attributes.holderStatus;
  if (hs === 'self') return 'self';
  if (hs === 'open') return 'open';
  if (hs === 'confirmed') return s.attributes.confirmedBy === 'timeout' ? 'timeout' : 'confirmed';
  return 'legacy';
}

const amountOf = (s: SaleLike) => {
  const n = Number(s.attributes.in);
  return Number.isFinite(n) ? n : 0;
};

export type Bucket = { amount: number; count: number };
export type StageSummary = Record<Stage | 'total', Bucket>;

/**
 * Waiting + voting is the page's old "awaiting split" (every sale not yet
 * split); `total` is every sale.
 */
export function stageSummary(sales: readonly SaleLike[]): StageSummary {
  const out: StageSummary = {
    waiting: { amount: 0, count: 0 },
    voting: { amount: 0, count: 0 },
    split: { amount: 0, count: 0 },
    total: { amount: 0, count: 0 }
  };
  for (const s of sales) {
    const a = amountOf(s);
    const b = out[saleStage(s)];
    b.amount += a;
    b.count += 1;
    out.total.amount += a;
    out.total.count += 1;
  }
  return out;
}

/**
 * Widths for the stacked bar, in percent, summing to 100 — or all zero when
 * nothing was sold. A negative amount (a correction) never draws a negative
 * width.
 */
export function stageShares(sum: StageSummary): Record<Stage, number> {
  const parts = {
    split: Math.max(0, sum.split.amount),
    voting: Math.max(0, sum.voting.amount),
    waiting: Math.max(0, sum.waiting.amount)
  };
  const total = parts.split + parts.voting + parts.waiting;
  if (total <= 0) return { split: 0, voting: 0, waiting: 0 };
  const split = (parts.split / total) * 100;
  const voting = (parts.voting / total) * 100;
  return { split, voting, waiting: Math.max(0, 100 - split - voting) };
}

export function filterByStage<T extends SaleLike>(sales: readonly T[], f: StageFilter): T[] {
  return f === 'all' ? [...sales] : sales.filter((s) => saleStage(s) === f);
}

/** Newest first; a sale with no usable date (old site-share income) goes last. */
export function newestFirst<T extends SaleLike>(sales: readonly T[]): T[] {
  const at = (s: SaleLike) => {
    const d = dayjs(s.attributes.date ?? undefined);
    return s.attributes.date && d.isValid() ? d.valueOf() : -Infinity;
  };
  return [...sales].sort((a, b) => at(b) - at(a));
}

export type Period = 'daily' | 'monthly' | 'yearly';
export type ChartPoint = { key: string; total: number };

/** Years that have a sale, newest first — the monthly chart's year picker. */
export function salesYears(sales: readonly SaleLike[]): number[] {
  const ys = new Set<number>();
  for (const s of sales) {
    if (!s.attributes.date) continue;
    const d = dayjs(s.attributes.date);
    if (d.isValid()) ys.add(d.year());
  }
  return [...ys].sort((a, b) => b - a);
}

/**
 * The bars of the sales chart.
 * - `daily`: the last `days` calendar days ending `today`, empty days included,
 *   keyed `YYYY-MM-DD`;
 * - `monthly`: the twelve months of `year`, keyed `YYYY-MM`;
 * - `yearly`: every year from the first sale to the last, keyed `YYYY`.
 * Every sale counts, whatever its split stage — it is what was sold.
 */
export function chartSeries(
  sales: readonly SaleLike[],
  period: Period,
  opts: { today?: Date | string; year?: number; days?: number } = {}
): ChartPoint[] {
  const fmt = period === 'daily' ? 'YYYY-MM-DD' : period === 'monthly' ? 'YYYY-MM' : 'YYYY';
  const sums = new Map<string, number>();
  for (const s of sales) {
    if (!s.attributes.date) continue;
    const d = dayjs(s.attributes.date);
    if (!d.isValid()) continue;
    const k = d.format(fmt);
    sums.set(k, (sums.get(k) ?? 0) + amountOf(s));
  }

  let keys: string[] = [];
  if (period === 'daily') {
    const end = dayjs(opts.today ?? new Date()).startOf('day');
    const n = Math.max(1, opts.days ?? 14);
    for (let i = n - 1; i >= 0; i--) keys.push(end.subtract(i, 'day').format(fmt));
  } else if (period === 'monthly') {
    const y = opts.year ?? dayjs(opts.today ?? new Date()).year();
    for (let m = 1; m <= 12; m++) keys.push(`${y}-${String(m).padStart(2, '0')}`);
  } else {
    const ys = [...sums.keys()].map(Number).filter(Number.isFinite);
    if (ys.length) {
      const lo = Math.min(...ys);
      const hi = Math.max(...ys);
      for (let y = lo; y <= hi; y++) keys.push(String(y));
    }
  }
  return keys.map((key) => ({ key, total: sums.get(key) ?? 0 }));
}

export type ProductTotal = { name: string; amount: number; share: number };

/** What each product brought in, largest first; `share` is a 0–1 fraction. */
export function productTotals<T extends SaleLike>(
  sales: readonly T[],
  nameOf: (s: T) => string
): ProductTotal[] {
  const sums = new Map<string, number>();
  let total = 0;
  for (const s of sales) {
    const a = amountOf(s);
    const name = nameOf(s);
    sums.set(name, (sums.get(name) ?? 0) + a);
    total += a;
  }
  return [...sums.entries()]
    .map(([name, amount]) => ({ name, amount, share: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}
