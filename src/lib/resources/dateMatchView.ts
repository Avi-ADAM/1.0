/**
 * The date-overlap line on a lev resource suggestion
 * (docs/PLAN_RESOURCE_CALENDAR.md §6.4).
 *
 * The matcher already decided whether to suggest at all (§7); this is only
 * about telling the holder *why*, in a form they can act on: "they asked for
 * 1 May – 1 June, you are free 3–20 May". Without it a partial match looks
 * identical to a perfect one, and the holder has no reason to reach for the
 * date counter-proposal that would actually close the gap.
 *
 * Returns `null` whenever there is nothing worth saying — a request with no
 * dates, or an offer window that covers it completely. Silence beats a line
 * that states the obvious on every card.
 */

import { overlapDays, rangeDays } from './availability.js';

export interface DateMatch {
  /** 0–1, as computed by the matcher (or recomputed here for legacy rows). */
  fit: number;
  requestStart: string | null;
  requestEnd: string | null;
  offerStart: string | null;
  offerEnd: string | null;
  /** Whole days of overlap, for display. */
  days: number;
  /** `partial` is the only one that needs the counter-proposal button. */
  kind: 'full' | 'partial' | 'none';
}

function iso(value: unknown): string | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Build the line from the stored `matchedOn` JSON, falling back to the records
 * themselves for suggestions written before the matcher stored `dateFit`.
 */
export function dateMatchFrom(
  matchedOn: any,
  omAttrs: { sqadualed?: unknown; sqadualedf?: unknown } | null | undefined,
  spAttrs: { sdate?: unknown; fdate?: unknown } | null | undefined
): DateMatch | null {
  const requestStart = iso(matchedOn?.requestStart ?? omAttrs?.sqadualed);
  const requestEnd = iso(matchedOn?.requestEnd ?? omAttrs?.sqadualedf);
  // Nothing to schedule against.
  if (!requestStart || !requestEnd) return null;

  const offerStart = iso(matchedOn?.offerStart ?? spAttrs?.sdate);
  const offerEnd = iso(matchedOn?.offerEnd ?? spAttrs?.fdate);
  // The holder never said when they are available — that is not a gap.
  if (!offerStart && !offerEnd) return null;

  const request = { start: new Date(requestStart), end: new Date(requestEnd) };
  const offer = {
    start: offerStart ? new Date(offerStart) : new Date(-8640000000000000),
    end: offerEnd ? new Date(offerEnd) : null
  };

  const requested = rangeDays(request);
  const shared = overlapDays(request, offer);
  const storedFit = Number(matchedOn?.dateFit);
  const fit = Number.isFinite(storedFit)
    ? Math.min(1, Math.max(0, storedFit))
    : requested > 0
      ? Math.min(1, shared / requested)
      : 1;

  // A full cover is the boring case — say nothing.
  if (fit >= 1) return null;

  return {
    fit,
    requestStart,
    requestEnd,
    offerStart,
    offerEnd,
    days: Math.max(0, Math.round(shared)),
    kind: fit <= 0 ? 'none' : 'partial'
  };
}
