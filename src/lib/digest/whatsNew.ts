/**
 * "z new things in your rikmot" — PLAN_DAILY_DIGEST §4.4, gap G3.
 *
 * The system knows what is *open*; "new" needs a baseline. That baseline is
 * the `cursor` of the previous digest (the end of the window it counted). A
 * user who never had one — every user, today — gets the last 24 hours, not
 * "everything since the beginning": a first digest announcing 412 new items
 * says nothing.
 *
 * qid `319digestWhatsNew` answers with count-only reads (pageSize 1, the
 * total comes from `meta.pagination`), scoped to rikmot the user is a member
 * of and created after `since`.
 *
 * Sales are counted only when **effective** — `holderStatus` self/confirmed or
 * null-legacy. A sale whose holder has not agreed yet is a claim about someone
 * else's money, and reporting it to the whole rikma before they consented is
 * exactly what PLAN_sale_holder_consent forbids. The filter lives in the qid.
 *
 * Pure.
 */

const MS_PER_HOUR = 60 * 60 * 1000;

/** The window when there is no cursor yet (first digest, the hub). */
export const DEFAULT_WINDOW_HOURS = 24;

/** Never look further back than this, whatever the cursor says. */
export const MAX_WINDOW_HOURS = 7 * 24;

export type WhatsNewKind = 'missions' | 'resources' | 'products' | 'sales';

export const WHATS_NEW_KINDS: WhatsNewKind[] = ['missions', 'resources', 'products', 'sales'];

export interface WhatsNewSummary {
  total: number;
  byKind: Record<WhatsNewKind, number>;
  /** Start of the counted window (ISO). */
  since: string;
}

/** Response alias in qid 319/320 → kind. */
const ALIASES: Record<WhatsNewKind, string> = {
  missions: 'newMissions',
  resources: 'newResources',
  products: 'newProducts',
  sales: 'newSales'
};

/**
 * Start of the "what's new" window.
 *
 * A cursor in the future or unparsable is ignored; one older than
 * MAX_WINDOW_HOURS is clamped — a user back after a month wants this week,
 * not a month of backlog in one line.
 */
export function resolveSince(cursor: string | null | undefined, now: number = Date.now()): string {
  const floor = now - MAX_WINDOW_HOURS * MS_PER_HOUR;
  const fallback = now - DEFAULT_WINDOW_HOURS * MS_PER_HOUR;
  const t = cursor ? new Date(cursor).getTime() : NaN;
  if (!Number.isFinite(t) || t >= now) return new Date(fallback).toISOString();
  return new Date(Math.max(t, floor)).toISOString();
}

export function emptyWhatsNew(since: string): WhatsNewSummary {
  return { total: 0, byKind: { missions: 0, resources: 0, products: 0, sales: 0 }, since };
}

export function processWhatsNew(raw: any, since: string): WhatsNewSummary {
  const out = emptyWhatsNew(since);
  const d = raw?.data;
  if (!d) return out;
  for (const kind of WHATS_NEW_KINDS) {
    const n = d[ALIASES[kind]]?.meta?.pagination?.total;
    const count = typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
    out.byKind[kind] = count;
    out.total += count;
  }
  return out;
}
