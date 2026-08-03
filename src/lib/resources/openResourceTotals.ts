/**
 * Totals for a needed resource (`open_mashaabim` / `pmash`).
 *
 * The same arithmetic used to live inline in `mashmam.svelte`, mutating the
 * Strapi nodes it was handed (`meData[i].total = …`). It is pure here so the
 * open-for-partners board, the create page and any future consumer agree on
 * one answer, and so the cycle counting can be tested.
 *
 * `price` is what the rikma expects to pay; `easy` is the ceiling it is willing
 * to count for that resource inside the rikma (שווי מקסימלי). Time-based kinds
 * multiply both by the number of cycles between the two scheduled dates.
 */

import moment from 'moment';

export type OpenResourceTotals = {
  kind: string | null;
  /** Cycles between the scheduled dates — months for `monthly`, years for `yearly`. */
  cycles: number | null;
  cycleUnit: 'monthly' | 'yearly' | null;
  /** Units, for `perUnit`. */
  quantity: number | null;
  price: number | null;
  maxPrice: number | null;
  total: number | null;
  maxTotal: number | null;
  /** Whether the start/end dates are meaningful for this kind. */
  hasPeriod: boolean;
};

type ResourceAttrs = {
  kindOf?: string | null;
  price?: number | string | null;
  easy?: number | string | null;
  hm?: number | string | null;
  sqadualed?: string | null;
  sqadualedf?: string | null;
} | null | undefined;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Fractional cycles between two dates, rounded to 2 decimals — null if either date is missing/invalid. */
function cyclesBetween(
  from: string | null | undefined,
  to: string | null | undefined,
  unit: 'months' | 'years'
): number | null {
  if (!from || !to) return null;
  const a = moment(from);
  const b = moment(to);
  if (!a.isValid() || !b.isValid()) return null;
  const diff = b.diff(a, unit, true);
  if (!Number.isFinite(diff)) return null;
  return Math.round(diff * 100) / 100;
}

const mul = (a: number | null, b: number | null): number | null =>
  a === null || b === null ? null : a * b;

export function openResourceTotals(attrs: ResourceAttrs): OpenResourceTotals {
  const kind = attrs?.kindOf ?? null;
  const price = num(attrs?.price);
  const maxPrice = num(attrs?.easy);
  const quantity = num(attrs?.hm);

  if (kind === 'monthly' || kind === 'yearly') {
    const cycleUnit = kind;
    const cycles = cyclesBetween(
      attrs?.sqadualed,
      attrs?.sqadualedf,
      kind === 'monthly' ? 'months' : 'years'
    );
    return {
      kind,
      cycles,
      cycleUnit,
      quantity: null,
      price,
      maxPrice,
      // Without both dates there is no period to multiply by — the per-cycle
      // price is all we can honestly show.
      total: cycles === null ? null : mul(cycles, price),
      maxTotal: cycles === null ? null : mul(cycles, maxPrice),
      hasPeriod: true
    };
  }

  if (kind === 'perUnit') {
    return {
      kind,
      cycles: null,
      cycleUnit: null,
      quantity,
      price,
      maxPrice,
      total: mul(quantity, price),
      maxTotal: mul(quantity, maxPrice),
      hasPeriod: false
    };
  }

  // 'rent' is a one-off price for a period; 'total' and anything unrecognised
  // are one-off prices with no period.
  return {
    kind,
    cycles: null,
    cycleUnit: null,
    quantity: null,
    price,
    maxPrice,
    total: price,
    maxTotal: maxPrice,
    hasPeriod: kind === 'rent'
  };
}
