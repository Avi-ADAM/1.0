/**
 * What a stock row *means* — one place (PLAN_SHOP_CUSTOMER_EXPERIENCE §2.5).
 *
 * A stock is two fields, `quant` and `unlimited`, on `product-variant` and on
 * `matanot`:
 *
 *   - `unlimited: true`  — nothing to count. `quant` is written `-1` beside it
 *     only so a reader that predates the flag still says "unlimited".
 *   - `unlimited: false` — `quant` is a count, and it may go below zero: that
 *     is the production queue (paid orders are never refused for stock). `-1`
 *     here is one unit waiting, not "unlimited".
 *   - `unlimited: null`  — a row written before the flag existed. Then, and
 *     only then, `quant === -1` is the old "unlimited" sentinel.
 *
 * Why the flag exists: with `-1` as both a count and a sentinel, a variant at
 * 0 that sold one unit landed exactly on `-1` and from then on read as
 * unlimited everywhere. So every write of a counted stock says
 * `unlimited: false` explicitly (`countedWrite`) — the row stops being legacy
 * the first time it moves.
 *
 * Pure and client-safe. A missing `quant` is the caller's policy (a variant's
 * reads as 0, an old product's as "unlimited" on some paths) and is decided
 * before calling here — this module never guesses it.
 */

/** The sentinel a legacy row (`unlimited: null`) uses for "unlimited". */
export const LEGACY_UNLIMITED = -1;

export interface StockFields {
  quant?: unknown;
  /** `true` / `false` once written; `null`/absent on a row that predates the flag. */
  unlimited?: boolean | null;
}

/** What a stock write sends: the count, and the flag that says it is one. */
export type StockWrite = { quant: number; unlimited: boolean };

function num(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Nothing to count — the flag when it is written, the old sentinel when not. */
export function isUnlimited(row: StockFields | null | undefined): boolean {
  if (!row) return false;
  if (row.unlimited === true) return true;
  if (row.unlimited === false) return false;
  return num(row.quant) === LEGACY_UNLIMITED;
}

/** The count, or `null` when the row is unlimited (or has no number at all). */
export function countOf(row: StockFields | null | undefined): number | null {
  if (!row || isUnlimited(row)) return null;
  return num(row.quant);
}

/** Units waiting to be made — how far a counted stock is below zero. */
export function waitingUnits(row: StockFields | null | undefined): number {
  const q = countOf(row);
  return q !== null && q < 0 ? -q : 0;
}

/** A counted stock, stated as one — so `-1` is never mistaken for the sentinel. */
export function countedWrite(quant: number): StockWrite {
  return { quant, unlimited: false };
}

/** "Unlimited", with the sentinel beside it for readers that predate the flag. */
export function unlimitedWrite(): StockWrite {
  return { quant: LEGACY_UNLIMITED, unlimited: true };
}

/**
 * Move a stock by `delta` (negative for a sale, positive for a restock).
 * `null` when there is nothing to move — the row is unlimited. A counted row
 * may cross zero in either direction, and landing on `-1` is just a count.
 */
export function moveStock(row: StockFields, delta: number): StockWrite | null {
  if (isUnlimited(row)) return null;
  return countedWrite((num(row.quant) ?? 0) + delta);
}

// ─── GraphQL filters ────────────────────────────────────────────────────────
//
// The same meaning, as Strapi filters — for a schema that has the flag. A
// legacy row (`flag` null) keeps the `-1` reading; `ne` drops NULL rows in
// SQL, so every "not" names the NULL case on its own.

/** In stock: unlimited, or a count above zero. */
export function availableFilter(quant = 'quant', flag = 'unlimited'): Record<string, unknown> {
  return {
    or: [
      { [flag]: { eq: true } },
      { [quant]: { gt: 0 } },
      { and: [{ [flag]: { null: true } }, { [quant]: { eq: LEGACY_UNLIMITED } }] }
    ]
  };
}

/** Not in stock: counted, and at zero or below (or no number at all). */
export function unavailableFilter(quant = 'quant', flag = 'unlimited'): Record<string, unknown> {
  return {
    and: [
      { or: [{ [flag]: { null: true } }, { [flag]: { eq: false } }] },
      { or: [{ [quant]: { null: true } }, { [quant]: { lte: 0 } }] },
      // A legacy `-1` is the old "unlimited", so it is not out of stock.
      { or: [{ [flag]: { eq: false } }, { [quant]: { null: true } }, { [quant]: { ne: LEGACY_UNLIMITED } }] }
    ]
  };
}
