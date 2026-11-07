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
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * The deal page side of an off-site deal, from qid `offsiteDealSide`. A deal that has
 * a customer on the site is not off-site: its product's missions may be shared with
 * other customers, so nothing is read for it (`null`).
 */
export function offsiteSideOf(res: any): OffsiteSide | null {
  const attrs = res?.data?.sheirut?.data?.attributes;
  if (!attrs) return null;
  if ((attrs.users_permissions_users?.data ?? []).length > 0) return null;
  const leadRow = res?.data?.leads?.data?.[0];
  const lead = leadRow?.id != null
    ? { id: String(leadRow.id), name: str(leadRow.attributes?.name), organization: str(leadRow.attributes?.organization) }
    : null;
  return { lead, missions: missionsFromBom(attrs.matanot?.data?.attributes?.matanot_recipe_missions?.data ?? []) };
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
