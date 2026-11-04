/**
 * "Customers" (docs/inprogress/PLAN_LEADS.md §5.5, L6) — the same table seen
 * from the other end: everyone who paid. Won leads and buyers of paid orders,
 * folded into one row per person by phone or email (the contact parts
 * `dedupeKey` is built from), so someone who wrote in, then bought twice from
 * the site, is one customer with three things behind them. Not a third
 * entity — a view over leads and orders.
 *
 * Members only: the rows carry phone and email, and the screen reads them
 * from loaders that already passed the moach membership check.
 */

import { contactParts } from './dedupe';
import { PAID_ORDER_STATUSES } from './stage';

export interface CustomerLeadInput {
  id: string;
  name: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
  lastActivityAt: string | null;
}

export interface CustomerOrderInput {
  id: string;
  number: string;
  status: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  total: number | null;
  currency: string | null;
  at: string | null;
}

export interface Customer {
  key: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  leadIds: string[];
  orderIds: string[];
  /** Paid orders. */
  orders: number;
  /** Paid totals, per currency (a rikma may sell in more than one). */
  totals: Array<{ currency: string | null; amount: number }>;
  firstAt: string | null;
  lastAt: string | null;
}

const PAID: ReadonlySet<string> = new Set(PAID_ORDER_STATUSES);
const ms = (iso: string | null) => (iso ? Date.parse(iso) || 0 : 0);

interface Item {
  kind: 'lead' | 'order';
  id: string;
  name: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  at: string | null;
  total: number | null;
  currency: string | null;
  parts: string[];
}

export function buildCustomers(leads: CustomerLeadInput[], orders: CustomerOrderInput[]): Customer[] {
  const items: Item[] = [
    ...leads.map((l) => ({
      kind: 'lead' as const,
      id: l.id,
      name: l.name,
      organization: l.organization,
      email: l.email,
      phone: l.phone,
      at: l.lastActivityAt ?? l.createdAt,
      total: null,
      currency: null,
      parts: contactParts(l.email, l.phone)
    })),
    ...orders
      .filter((o) => PAID.has(o.status))
      .map((o) => ({
        kind: 'order' as const,
        id: o.id,
        name: o.name,
        organization: null,
        email: o.email,
        phone: o.phone,
        at: o.at,
        total: o.total,
        currency: o.currency,
        parts: contactParts(o.email, o.phone)
      }))
  ];

  // Union-find over the items: two items are one person when they share a part.
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const owner = new Map<string, number>();
  items.forEach((it, i) => {
    for (const p of it.parts) {
      const j = owner.get(p);
      if (j === undefined) owner.set(p, i);
      else parent[find(i)] = find(j);
    }
  });

  const groups = new Map<number, Item[]>();
  items.forEach((it, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), it]);
  });

  const customers: Customer[] = [];
  for (const group of groups.values()) {
    // Newest first: the latest name and contact a person gave are the ones to use.
    const byTime = [...group].sort((a, b) => ms(b.at) - ms(a.at));
    const first = <K extends 'name' | 'organization' | 'email' | 'phone'>(k: K) =>
      byTime.map((it) => it[k]).find((v) => v && String(v).trim()) ?? null;
    const paid = group.filter((it) => it.kind === 'order');
    const totals = new Map<string | null, number>();
    for (const o of paid) {
      if (o.total == null) continue;
      totals.set(o.currency, Math.round(((totals.get(o.currency) ?? 0) + o.total) * 100) / 100);
    }
    const times = group.map((it) => it.at).filter((t): t is string => !!t).sort((a, b) => ms(a) - ms(b));
    const leadIds = group.filter((it) => it.kind === 'lead').map((it) => it.id);
    customers.push({
      key: group
        .map((it) => `${it.kind}:${it.id}`)
        .sort()
        .join('|'),
      name: first('name') ?? '—',
      organization: first('organization'),
      email: first('email'),
      phone: first('phone'),
      leadIds,
      orderIds: paid.map((it) => it.id),
      orders: paid.length,
      totals: [...totals].map(([currency, amount]) => ({ currency, amount })),
      firstAt: times[0] ?? null,
      lastAt: times[times.length - 1] ?? null
    });
  }
  return customers.sort((a, b) => ms(b.lastAt) - ms(a.lastAt));
}

/** Case-insensitive match on name, organization, phone digits or email. */
export function matchesCustomer(c: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  return (
    c.name.toLowerCase().includes(q) ||
    (c.organization ?? '').toLowerCase().includes(q) ||
    (c.email ?? '').toLowerCase().includes(q) ||
    (digits.length >= 3 && (c.phone ?? '').replace(/\D/g, '').includes(digits))
  );
}
