/**
 * Paging arithmetic, kept pure and tested.
 *
 * This is the exact spot the old grid got wrong. `@mediakular/gridcraft` held
 * its paging state in a `PagingData` class instance; `$state()` only
 * deep-proxies plain objects and arrays, so the grid's internal
 * `paging.totalPages = …` write never reached the footer. `totalPages` stayed
 * `0`, "Next" was rendered `disabled` forever, and a 51-row table looked like
 * a single page. Deriving every number from `total` and `perPage` — with no
 * mutable page-count state to fall out of sync — makes that failure
 * unrepresentable.
 */

/** How many pages `total` items need. Always at least 1, so "page 1 of 1" holds for an empty list. */
export function pageCount(total: number, perPage: number): number {
  const size = Math.max(1, Math.floor(perPage) || 1);
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

/** Keep a requested page inside `1..total`, so a shrinking filter cannot strand the view past the end. */
export function clampPage(page: number, totalPages: number): number {
  const last = Math.max(1, Math.floor(totalPages) || 1);
  // Only NaN needs a special case — ±Infinity clamps to the nearest end on its
  // own, which is the answer a caller asking for "the last page" wants.
  if (Number.isNaN(page)) return 1;
  return Math.max(1, Math.min(Math.floor(page), last));
}

/** The slice of items shown on `page`. */
export function pageSlice<T>(items: readonly T[], page: number, perPage: number): T[] {
  const size = Math.max(1, Math.floor(perPage) || 1);
  const current = clampPage(page, pageCount(items.length, size));
  const start = (current - 1) * size;
  return items.slice(start, start + size);
}

/**
 * The 1-based "showing {from}–{to} of {total}" numbers.
 * An empty list reports `0–0 of 0` rather than `1–0`.
 */
export function pageRange(
  page: number,
  perPage: number,
  total: number
): { from: number; to: number; total: number } {
  const count = Math.max(0, total);
  if (count === 0) return { from: 0, to: 0, total: 0 };
  const size = Math.max(1, Math.floor(perPage) || 1);
  const current = clampPage(page, pageCount(count, size));
  const from = (current - 1) * size + 1;
  return { from, to: Math.min(current * size, count), total: count };
}

/**
 * The page buttons to render: first, last, a window around the current page,
 * and `'gap'` markers where numbers were skipped.
 *
 * `span` is how many neighbours to keep on each side of the current page.
 * A gap is only emitted when it actually hides something — replacing a single
 * skipped number with an ellipsis makes the control wider, not narrower.
 */
export function pageWindow(
  current: number,
  totalPages: number,
  span = 1
): Array<number | 'gap'> {
  const last = Math.max(1, Math.floor(totalPages) || 1);
  const page = clampPage(current, last);
  const reach = Math.max(0, Math.floor(span));

  const wanted = new Set<number>([1, last]);
  for (let p = page - reach; p <= page + reach; p++) {
    if (p >= 1 && p <= last) wanted.add(p);
  }

  const sorted = [...wanted].sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous) {
      // Exactly one number missing: show it instead of an ellipsis.
      if (p - previous === 2) out.push(previous + 1);
      else if (p - previous > 2) out.push('gap');
    }
    out.push(p);
    previous = p;
  }
  return out;
}
