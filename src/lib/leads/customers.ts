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

// ─── one customer's page ────────────────────────────────────────────────────

/**
 * What a customer's page is addressed by: a lead (`l7`) or, failing that, a
 * paid order (`o40`) behind them. The row's own `key` lists every id and would
 * make a URL that grows with each purchase; any one anchor finds the person
 * again, because the people are re-folded each time (`buildCustomers`).
 */
export function customerRefOf(c: Pick<Customer, 'leadIds' | 'orderIds'>): string | null {
  if (c.leadIds[0]) return `l${c.leadIds[0]}`;
  if (c.orderIds[0]) return `o${c.orderIds[0]}`;
  return null;
}

/** The customer a {@link customerRefOf} anchor belongs to, or null (a cancelled order, a deleted lead). */
export function findCustomerByRef<C extends Pick<Customer, 'leadIds' | 'orderIds'>>(customers: C[], ref: string): C | null {
  const kind = ref.charAt(0);
  const id = ref.slice(1);
  if (!id || (kind !== 'l' && kind !== 'o')) return null;
  return customers.find((c) => (kind === 'l' ? c.leadIds : c.orderIds).includes(id)) ?? null;
}

/**
 * Every order of this person — **all** statuses, a cancelled one or one still
 * waiting for its payment included: that is the history, where `Customer.orders`
 * counts only what was paid. An order is theirs when it is one of the paid ones
 * the fold found, or shares a phone or an email with them. Newest first.
 */
export function ordersOfCustomer<T extends CustomerOrderInput>(c: Customer, orders: T[]): T[] {
  const own = new Set(c.orderIds);
  const parts = new Set(contactParts(c.email, c.phone));
  for (const o of orders) if (own.has(o.id)) for (const p of contactParts(o.email, o.phone)) parts.add(p);
  return orders
    .filter((o) => own.has(o.id) || contactParts(o.email, o.phone).some((p) => parts.has(p)))
    .sort((a, b) => ms(b.at) - ms(a.at));
}
