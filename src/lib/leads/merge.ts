/**
 * Folding a duplicate lead into the one that stays
 * (docs/inprogress/PLAN_LEADS.md §2.4, L5). Pure: the action reads both
 * leads, asks this what to write, and writes it.
 *
 * Nothing is deleted. The duplicate keeps its log and becomes `spam` — the
 * status §2.1 defines as "spam / duplicate": hidden, kept for the record —
 * and both logs say where it went. What the duplicate knew that the kept one
 * did not (a phone, an email, a city) fills the kept one's gaps; the kept
 * one's own values are never overwritten. Its orders and products move over,
 * so the money link — and with it `offered`/`won` — follows.
 */

export interface MergeSide {
  id: string;
  status: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  city: string | null;
  address: string | null;
  message: string | null;
  nextAction: string | null;
  followUpAt: string | null;
  lastActivityAt: string | null;
  dedupeKey: string | null;
  orderIds: string[];
  productIds: string[];
  anonymizedAt?: string | null;
}

export type MergeRefusal = 'SAME_LEAD' | 'ANONYMIZED' | 'ALREADY_MERGED';

export function mergeRefusal(keep: MergeSide, dup: MergeSide): MergeRefusal | null {
  if (keep.id === dup.id) return 'SAME_LEAD';
  if (keep.anonymizedAt || dup.anonymizedAt) return 'ANONYMIZED';
  // Folding into a lead already put away as a duplicate would hide both.
  if (keep.status === 'spam') return 'ALREADY_MERGED';
  return null;
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

function later(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function sooner(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

/** The kept lead's patch. Only fields that change are present. */
export function mergedKeepPatch(keep: MergeSide, dup: MergeSide): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const f of ['email', 'phone', 'organization', 'city', 'address', 'nextAction'] as const) {
    if (!keep[f] && dup[f]) patch[f] = dup[f];
  }
  if (dup.message && dup.message !== keep.message) {
    patch.message = keep.message ? `${keep.message}\n\n— — —\n\n${dup.message}`.slice(0, 4000) : dup.message;
  }
  const keys = union((keep.dedupeKey ?? '').split('|').filter(Boolean), (dup.dedupeKey ?? '').split('|').filter(Boolean));
  const key = keys.length ? keys.join('|') : null;
  if (key !== keep.dedupeKey) patch.dedupeKey = key;

  const orders = union(keep.orderIds, dup.orderIds);
  if (orders.length !== keep.orderIds.length) patch.orders = orders;
  const products = union(keep.productIds, dup.productIds);
  if (products.length !== keep.productIds.length) patch.products = products;

  // The earlier promise to get back to them stands.
  const followUp = sooner(keep.followUpAt, dup.followUpAt);
  if (followUp !== keep.followUpAt) patch.followUpAt = followUp;
  const last = later(keep.lastActivityAt, dup.lastActivityAt);
  if (last !== keep.lastActivityAt) patch.lastActivityAt = last;
  return patch;
}

/** The activity body that records a merge — read back by the lead page. */
export const MERGED_INTO = 'mergedInto:';
export const MERGED_FROM = 'mergedFrom:';
export const CONTACTS_EXPORTED = 'contactsExported';

/** `mergedInto:77` ⇒ `{ dir: 'into', id: '77' }`. */
export function mergeNoteOf(body: string | null | undefined): { dir: 'into' | 'from'; id: string } | null {
  if (!body) return null;
  const m = /^(mergedInto|mergedFrom):(\d+)$/.exec(body.trim());
  if (!m) return null;
  return { dir: m[1] === 'mergedInto' ? 'into' : 'from', id: m[2] };
}
