/**
 * Customer demand for the Growth Agent (docs/inprogress/PLAN_GROWTH_AGENT.md §9.2, §10.3).
 *
 * The concierge's open wishes (ratson), reduced to counts per category and
 * place, so the operator recruits where customers are already asking:
 * "customers ask for event services, and no venue is active".
 *
 * Only counts ever leave the server. A wish is a person's request: its text,
 * its author and its exact location are never part of this — a category, a
 * coarse place hint, whether it went unanswered. A wish that opted out of
 * aggregation (`aggregation_opt_out`) is not counted at all.
 *
 * Pure: the server reads the rows (server/growth/demand.ts), everything else
 * is here and tested.
 */

import type { ProspectSummary } from './types';

/** One open wish, as little of it as the counts need. */
export interface DemandWish {
  id: string;
  createdAt: string;
  categories: string[];
  /** The wish's own coarse place hint ("Haifa", "the Sharon"), or null. */
  place: string | null;
  online: boolean;
  /** Proposals received so far. 0 = nobody answered it. */
  proposals: number;
}

export interface DemandCell {
  category: string;
  /** null = online or no place given: counts everywhere. */
  place: string | null;
  open: number;
  /** Of those, the ones nobody has proposed on yet. */
  unanswered: number;
}

export interface DemandSummary {
  /** When the rows were read (ISO). */
  readAt: string;
  /** How far back open wishes count. */
  days: number;
  wishes: number;
  unanswered: number;
  cells: DemandCell[];
}

export const DEMAND_DAYS = 180;
const MAX_CELLS = 60;

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** A Strapi ratson node → a DemandWish, or null when it must not count. */
export function wishFromNode(node: any): DemandWish | null {
  const a = node?.attributes ?? {};
  if (a.aggregation_opt_out === true) return null;
  const names: string[] = (a.categories?.data ?? [])
    .map((c: any) => String(c?.attributes?.name ?? '').trim())
    .filter(Boolean);
  const sub = String(a.sub_category ?? '').trim();
  if (sub && !names.some((n) => norm(n) === norm(sub))) names.push(sub);
  if (!names.length) return null;
  const loc = Array.isArray(a.location) ? a.location.find((l: any) => l?.location_hint)?.location_hint : null;
  const hint = String(a.location_hint ?? loc ?? '').trim();
  return {
    id: String(node.id),
    createdAt: String(a.createdAt ?? ''),
    categories: [...new Set(names)].slice(0, 5),
    place: a.isOnline ? null : hint ? hint.slice(0, 60) : null,
    online: a.isOnline === true,
    proposals: Array.isArray(a.ratson_proposals?.data) ? a.ratson_proposals.data.length : 0
  };
}

/** Counts per category × place, biggest unanswered demand first. */
export function summarizeDemand(wishes: DemandWish[], now: number, days = DEMAND_DAYS): DemandSummary {
  const since = now - days * 86_400_000;
  const live = wishes.filter((w) => {
    const t = Date.parse(w.createdAt);
    return !Number.isFinite(t) || t >= since;
  });
  const cells = new Map<string, DemandCell>();
  for (const w of live) {
    for (const category of w.categories) {
      const k = `${norm(category)}|${norm(w.place)}`;
      const c = cells.get(k) ?? { category, place: w.place, open: 0, unanswered: 0 };
      c.open++;
      if (w.proposals === 0) c.unanswered++;
      cells.set(k, c);
    }
  }
  return {
    readAt: new Date(now).toISOString(),
    days,
    wishes: live.length,
    unanswered: live.filter((w) => w.proposals === 0).length,
    cells: [...cells.values()].sort((a, b) => b.unanswered - a.unanswered || b.open - a.open).slice(0, MAX_CELLS)
  };
}

/** Same category, loosely: "Catering" ≈ "catering services" ≈ "קייטרינג". */
export function sameCategory(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y));
}

/** Does a demand place reach a business? No place / online reaches everyone. */
export function placeReaches(place: string | null, p: Pick<ProspectSummary, 'city' | 'region'>): boolean {
  const want = norm(place);
  if (!want) return true;
  return [p.city, p.region].some((v) => {
    const have = norm(v);
    return !!have && (have === want || have.includes(want) || want.includes(have));
  });
}

/** The demand a business could answer: wishes in its category that reach its place. */
export function demandFor(p: Pick<ProspectSummary, 'category' | 'city' | 'region'>, demand: DemandSummary | null | undefined) {
  if (!demand || !p.category) return { open: 0, unanswered: 0 };
  let open = 0;
  let unanswered = 0;
  for (const c of demand.cells) {
    if (!sameCategory(c.category, p.category) || !placeReaches(c.place, p)) continue;
    open += c.open;
    unanswered += c.unanswered;
  }
  return { open, unanswered };
}

export interface DemandGap {
  kind: 'demand';
  category: string;
  region?: string;
  /** Active providers we have for it there. */
  active: number;
  wishes: number;
  unanswered: number;
}

/**
 * Where customers ask and the network cannot answer: a demand cell with at
 * least two open wishes, or one nobody answered, and at most one active
 * provider of that category reaching that place.
 */
export function demandGaps(rows: ProspectSummary[], demand: DemandSummary | null | undefined): DemandGap[] {
  if (!demand) return [];
  const active = rows.filter((r) => r.stage === 'activeProvider');
  return demand.cells
    .filter((c) => c.open >= 2 || c.unanswered >= 1)
    .map((c) => ({
      kind: 'demand' as const,
      category: c.category,
      ...(c.place ? { region: c.place } : {}),
      active: active.filter((r) => sameCategory(r.category, c.category) && placeReaches(c.place, r)).length,
      wishes: c.open,
      unanswered: c.unanswered
    }))
    .filter((g) => g.active <= 1)
    .slice(0, 8);
}
