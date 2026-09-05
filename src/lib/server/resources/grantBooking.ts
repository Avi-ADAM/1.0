/**
 * Turning an approved resource grant into a ledger row
 * (docs/PLAN_RESOURCE_CALENDAR.md §4).
 *
 * This is the fix for §0.2 bug 4: today, only a *recurring* resource gets a
 * live record (`Mashabetahalich`). A `rent` leaves nothing but a `Rikmash`
 * archive, so nothing in the system can answer "taken until when".
 *
 * Rather than mint a second engine for rentals — which would repeat exactly the
 * `Rikmash`/`Mashabetahalich` duplication that makes today's data hard to read —
 * the **booking row is the live record**. One row per grant, whatever the kind,
 * pointing back at whichever engine or archive also exists.
 */

import { createBooking, syncPanui } from './bookingStore.js';
import type { Exec } from '$lib/server/archive/gql.js';
import type { Range } from '$lib/resources/types.js';

/** The subset of an `open_mashaabim` / `pmash` that decides the booked range. */
export interface GrantTerms {
  kindOf?: string | null;
  sqadualed?: string | null;
  sqadualedf?: string | null;
  hm?: number | string | null;
  recurring?: boolean | null;
}

/**
 * The range a grant occupies, and how many units of it.
 *
 * Three shapes, and the defaults matter more than the arithmetic:
 *
 *  - **dated** (`rent`, or anything with `sqadualed`): exactly that window.
 *  - **recurring with no end**: open-ended. A monthly resource runs until
 *    somebody closes it, and pretending it ends in a year would quietly free it.
 *  - **`total`**: open-ended too, because a consumable never comes back. This
 *    is the conservative reading — the same one `deriveAvailability` takes.
 *
 * A missing start falls back to `now`: the resource is out either way, and
 * refusing to record it would understate occupancy, which is the failure that
 * actually hurts.
 */
export function grantRange(terms: GrantTerms, now: Date = new Date()): Range {
  const start = terms.sqadualed ? new Date(terms.sqadualed) : now;
  const startOk = Number.isNaN(start.getTime()) ? now : start;

  if (terms.sqadualedf) {
    const end = new Date(terms.sqadualedf);
    if (!Number.isNaN(end.getTime()) && end.getTime() > startOk.getTime()) {
      return { start: startOk, end };
    }
  }
  return { start: startOk, end: null };
}

/** Units taken. `perUnit` uses `hm`; everything else takes one. */
export function grantQuantity(terms: GrantTerms): number {
  if (terms.kindOf !== 'perUnit') return 1;
  const n = Number(terms.hm);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type StrapiExecutor = {
  execute: (
    queryId: string,
    variables: Record<string, unknown>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ) => Promise<unknown>;
};

/**
 * Record an approved grant. The booking is `confirmed`, not `hold`: by the time
 * this runs the rikma has already agreed — the consent happened in the vote,
 * and re-opening it as a claim would be a second, meaningless gate.
 */
export async function openGrantBooking(
  exec: Exec,
  args: {
    spId: string | number;
    projectId: string | number;
    openMashaabimId?: string | number | null;
    maapId?: string | number | null;
    mashabetahalichId?: string | number | null;
    rikmashId?: string | number | null;
    ownerId?: string | number | null;
    note?: string | null;
    /** Skips the lookup below when the caller already has the terms. */
    terms?: GrantTerms;
    /** Only needed to look the terms up; ignored when `terms` is given. */
    strapi?: StrapiExecutor;
    context?: { jwt?: string; fetch?: typeof globalThis.fetch };
  }
): Promise<string | null> {
  let terms = args.terms;

  if (!terms && args.strapi && args.openMashaabimId != null) {
    const res: any = await args.strapi.execute(
      '50GetOpenMashaabimById',
      { id: String(args.openMashaabimId) },
      args.context?.jwt,
      args.context?.fetch
    );
    const a = res?.data?.openMashaabim?.data?.attributes;
    if (a) {
      terms = {
        kindOf: a.kindOf,
        sqadualed: a.sqadualed,
        sqadualedf: a.sqadualedf,
        hm: a.hm,
        recurring: a.recurring
      };
    }
  }

  const range = grantRange(terms ?? {});

  const bookingId = await createBooking(exec, {
    spId: args.spId,
    ownerId: args.ownerId ?? null,
    start: range.start,
    end: range.end,
    quantity: grantQuantity(terms ?? {}),
    status: 'confirmed',
    source: 'rikma',
    projectId: args.projectId,
    mashabetahalichId: args.mashabetahalichId ?? null,
    rikmashId: args.rikmashId ?? null,
    maapId: args.maapId ?? null,
    openMashaabimId: args.openMashaabimId ?? null,
    note: args.note ?? null
  });

  // Recompute `panui` from the ledger rather than blindly setting it false —
  // a pool with units left, or a resource that is unlimited, stays available.
  await syncPanui(exec, args.spId);

  return bookingId;
}
