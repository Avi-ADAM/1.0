/**
 * A deal for a customer who is not on the site (docs/inprogress/PLAN_OFFSITE_CLIENT.md
 * P1) — the pure part: the terms it is opened with, and how its page reads the work
 * on its product's BOM. No I/O here.
 */

import type { Mission } from '$lib/types';

export type OffsiteTerms =
  | { ok: true; price: number; quantity: number; total: number }
  | { ok: false; message: string };

const finite = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Unit price (the agreed one, else the product's), quantity (default 1), total. */
export function offsiteDealTerms(input: { productPrice: unknown; price?: unknown; quantity?: unknown }): OffsiteTerms {
  const quantity = finite(input.quantity) ?? 1;
  if (quantity <= 0) return { ok: false, message: 'The quantity must be more than zero' };
  const price = finite(input.price) ?? finite(input.productPrice) ?? 0;
  if (price < 0) return { ok: false, message: 'The price cannot be negative' };
  return { ok: true, price, quantity, total: Math.round(price * quantity * 100) / 100 };
}

export interface OffsiteSide {
  /** The lead the deal is for — absent when the deal has a customer account or no lead. */
  lead: { id: string; name: string | null; organization: string | null } | null;
  /** The work on the product's BOM, in the deal page's mission shape. */
  missions: Mission[];
  /** The deal's price split by its BOM (`offsiteCostOf`); null when the BOM prices nothing. */
  cost: { missions: number; resources: number } | null;
}

/**
 * The agreed price split the way the product's BOM splits it: hours × rate of the
 * mission lines against quantity × price of the resource lines, in proportion, so the
 * two rows always add up to what the customer pays (a price above or below the BOM
 * moves both). A BOM with no prices says nothing — null, and the page keeps its default.
 */
export function offsiteCostOf(total: unknown, missionLines: any[], resourceLines: any[]): OffsiteSide['cost'] {
  const sum = (rows: any[], f: (a: any) => number) =>
    (rows ?? []).reduce((s, r) => s + (Number.isFinite(f(r?.attributes ?? {})) ? f(r?.attributes ?? {}) : 0), 0);
  const m = sum(missionLines, (a) => (finite(a.hoursPerUnit) ?? 0) * (finite(a.ratePerHour) ?? 0) * (finite(a.unitsPerProduct) ?? 1));
  const r = sum(resourceLines, (a) => (finite(a.quantityPerUnit) ?? 0) * (finite(a.pricePerUnit) ?? 0));
  const price = finite(total) ?? 0;
  if (m + r <= 0 || price <= 0) return null;
  const missions = Math.round((price * m) / (m + r) * 100) / 100;
  return { missions, resources: Math.round((price - missions) * 100) / 100 };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * The deal page side of an off-site deal, from qid `offsiteDealSide`. A deal that has
 * a customer on the site is not off-site: its product's missions may be shared with
 * other customers, so nothing is read for it (`null`).
 */
export function offsiteSideOf(res: any, ownRes?: any): OffsiteSide | null {
  const attrs = res?.data?.sheirut?.data?.attributes;
  if (!attrs) return null;
  if ((attrs.users_permissions_users?.data ?? []).length > 0) return null;
  const leadRow = res?.data?.leads?.data?.[0];
  const lead = leadRow?.id != null
    ? { id: String(leadRow.id), name: str(leadRow.attributes?.name), organization: str(leadRow.attributes?.organization) }
    : null;
  // The deal's own missions (its fulfillments) first, then BOM lines that hold one —
  // a line someone was already working on when the deal opened.
  // `ownRes`: qid offsiteDealOwnMissions, read apart (it may be refused — see the qid).
  const own = ((ownRes?.data?.sheirutFulfillments?.data ?? []) as any[]).map((f) => ({
    attributes: { mesimabetahalich: f?.attributes?.createdMissions }
  }));
  const product = attrs.matanot?.data?.attributes ?? {};
  const lines = (product.matanot_recipe_missions?.data ?? []) as any[];
  return {
    lead,
    missions: missionsFromBom([...own, ...lines]),
    cost: offsiteCostOf(attrs.total ?? attrs.price, lines, product.matanot_recipe_resources?.data ?? [])
  };
}

/** BOM mission lines → missions: one per line that has its mission in progress. */
export function missionsFromBom(lines: any[]): Mission[] {
  const seen = new Set<string>();
  const out: Mission[] = [];
  for (const line of lines ?? []) {
    const m = line?.attributes?.mesimabetahalich?.data;
    if (m?.id == null || seen.has(String(m.id))) continue;
    seen.add(String(m.id));
    const a = m.attributes ?? {};
    const hours = finite(a.hoursassinged) ?? finite(line.attributes?.hoursPerUnit) ?? 0;
    const hoursDone = finite(a.howmanyhoursalready) ?? 0;
    const holder = str(a.users_permissions_user?.data?.attributes?.username);
    out.push({
      id: String(m.id),
      name: str(a.name) ?? '',
      status: a.finnished === true ? 'done' : a.users_permissions_user?.data?.id != null ? 'in-progress' : 'waiting',
      hours,
      hoursDone,
      paid: false,
      sub: holder ?? undefined
    });
  }
  return out;
}
