/**
 * A direct offer — docs/inprogress/PLAN_DIRECT_OFFER.md (P3–P4).
 *
 * A provider writes a wish *for* a customer: what to make, when, where, and the
 * parts they will do at their price. The customer opens it from a link, signs up if
 * she has to, and takes it — from then on it is her wish, with every tool a wish has,
 * and the provider's parts are versions on the table she approves or counters.
 *
 * Pure: the composer, the actions, the preview page and the tests read the same rules.
 */

export const MAX_LINES = 20;
export const MAX_NAME = 120;
export const MAX_AMOUNT = 100000;

export interface MissionLine {
  name: string;
  hours: number;
  ratePerHour: number;
  notes: string;
}

export interface ResourceLine {
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export interface OfferLines {
  missions: MissionLine[];
  resources: ResourceLine[];
}

export type LineRefusal = 'none' | 'tooMany' | 'name' | 'duplicate' | 'amount';

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : v == null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

const inRange = (n: number | null) => n != null && n >= 0 && n <= MAX_AMOUNT;

/** The name is the bridge from a BOM line back to the part of the plan (`$lib/wish/gaps`). */
const key = (s: string) => s.trim().toLowerCase();

/**
 * Clean what the composer sent, or say why it cannot be an offer. Names must be unique
 * per kind: an invitation proposal points at its BOM line, and the line finds its part
 * of the plan by name — two parts with one name could not be told apart.
 */
export function cleanLines(raw: { missions?: unknown; resources?: unknown }): { lines: OfferLines } | { refusal: LineRefusal } {
  const missions: MissionLine[] = [];
  const resources: ResourceLine[] = [];
  const rawM = Array.isArray(raw.missions) ? raw.missions : [];
  const rawR = Array.isArray(raw.resources) ? raw.resources : [];
  if (rawM.length + rawR.length === 0) return { refusal: 'none' };
  if (rawM.length + rawR.length > MAX_LINES) return { refusal: 'tooMany' };

  const seen = { m: new Set<string>(), r: new Set<string>() };
  for (const m of rawM as any[]) {
    const name = String(m?.name ?? '').trim();
    if (!name || name.length > MAX_NAME) return { refusal: 'name' };
    if (seen.m.has(key(name))) return { refusal: 'duplicate' };
    seen.m.add(key(name));
    const hours = num(m?.hours);
    const rate = num(m?.ratePerHour);
    if (!inRange(hours) || !inRange(rate) || hours === 0) return { refusal: 'amount' };
    missions.push({ name, hours: hours as number, ratePerHour: rate as number, notes: String(m?.notes ?? '').trim() });
  }
  for (const r of rawR as any[]) {
    const name = String(r?.name ?? '').trim();
    if (!name || name.length > MAX_NAME) return { refusal: 'name' };
    if (seen.r.has(key(name))) return { refusal: 'duplicate' };
    seen.r.add(key(name));
    const quantity = num(r?.quantity);
    const unitPrice = num(r?.unitPrice);
    if (!inRange(quantity) || !inRange(unitPrice) || quantity === 0) return { refusal: 'amount' };
    resources.push({ name, quantity: quantity as number, unitPrice: unitPrice as number, notes: String(r?.notes ?? '').trim() });
  }
  return { lines: { missions, resources } };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const missionPrice = (m: Pick<MissionLine, 'hours' | 'ratePerHour'>) => round2(m.hours * m.ratePerHour);
export const resourcePrice = (r: Pick<ResourceLine, 'quantity' | 'unitPrice'>) => round2(r.quantity * r.unitPrice);

export function offerTotal(lines: OfferLines): number {
  return round2(
    lines.missions.reduce((s, m) => s + missionPrice(m), 0) + lines.resources.reduce((s, r) => s + resourcePrice(r), 0)
  );
}

// ── Reading an offer (qid 433) ─────────────────────────────────────────────

export type OfferState = 'draft' | 'claimed' | 'closed';

export interface OfferViewLine {
  kind: 'mission' | 'resource';
  /** The BOM line id — what the provider's proposal points at. */
  lineId: string;
  name: string;
  /** Hours for a task, quantity for a resource. */
  amount: number | null;
  price: number | null;
}

export interface OfferView {
  id: string;
  name: string;
  longDes: string;
  startDate: string | null;
  finnishDate: string | null;
  isOnline: boolean;
  locationHint: string | null;
  provider: { id: string; name: string; pic: string | null } | null;
  projectName: string | null;
  /** Shown to the provider only — the caller decides. */
  recipientHint: string | null;
  state: OfferState;
  claimedAt: string | null;
  /** The customer, once she took it. */
  ownerIds: string[];
  linkAt: string | null;
  expiresAt: string | null;
  emailLocked: boolean;
  lines: OfferViewLine[];
  total: number;
}

const idOf = (n: any): string | null => (n?.id != null ? String(n.id) : null);
const list = (rel: any): any[] => (Array.isArray(rel?.data) ? rel.data : []);

/** Qid 433's answer as the pages read it; null when it is no direct offer at all. */
export function offerView(res: any): OfferView | null {
  const node = res?.ratson?.data;
  const id = idOf(node);
  if (!id) return null;
  const a = node.attributes ?? {};
  const providerNode = a.offered_by?.data;
  if (!providerNode) return null; // an ordinary wish: not readable as an offer

  const pa = providerNode.attributes ?? {};
  const pic = pa.profilePic?.data?.attributes;
  const status = a.status_ratson ?? 'draft';
  const claimedAt = a.claimed_at ?? null;
  const state: OfferState =
    a.fulfilled === true || ['fulfilled', 'cancelled', 'expired'].includes(status) ? 'closed' : claimedAt ? 'claimed' : 'draft';

  // The parts as the provider priced them: the product's BOM lines. After the claim the
  // standing version of each lives on its proposal, and the wish page shows that.
  const product = a.derivedComplexMatanot?.data?.attributes ?? {};
  const lines: OfferViewLine[] = [
    ...list(product.matanot_recipe_missions).map((l: any) => {
      const la = l.attributes ?? {};
      const amount = num(la.hoursPerUnit);
      const rate = num(la.ratePerHour);
      return {
        kind: 'mission' as const,
        lineId: String(l.id),
        name: String(la.notes ?? ''),
        amount,
        price: amount != null && rate != null ? round2(amount * rate) : null
      };
    }),
    ...list(product.matanot_recipe_resources).map((l: any) => {
      const la = l.attributes ?? {};
      const amount = num(la.quantityPerUnit);
      const unit = num(la.pricePerUnit);
      return {
        kind: 'resource' as const,
        lineId: String(l.id),
        name: String(la.notes ?? ''),
        amount,
        price: amount != null && unit != null ? round2(amount * unit) : null
      };
    })
  ];

  return {
    id,
    name: String(a.name ?? ''),
    longDes: String(a.longDes || a.desc || ''),
    startDate: a.startDate ?? null,
    finnishDate: a.finnishDate ?? null,
    isOnline: a.isOnline === true,
    locationHint: a.location_hint ?? null,
    provider: {
      id: String(providerNode.id),
      name: String(pa.username ?? ''),
      pic: pic?.formats?.small?.url ?? pic?.url ?? null
    },
    projectName: a.offered_by_project?.data?.attributes?.projectName ?? null,
    recipientHint: a.offer_recipient_hint ?? null,
    state,
    claimedAt,
    ownerIds: list(a.users_permissions_users).map((u: any) => String(u.id)),
    linkAt: a.offer_link_at ?? null,
    expiresAt: a.offer_expires_at ?? null,
    emailLocked: !!a.offer_email_lock,
    lines,
    total: round2(lines.reduce((s, l) => s + (l.price ?? 0), 0))
  };
}

// ── Taking it ──────────────────────────────────────────────────────────────

export type ClaimRefusal = 'claimed' | 'closed' | 'self' | 'email';

/**
 * Why this account cannot take the offer now, or null. `emailOk` is the lock checked
 * on the server against the account's real address; an offer with no lock is open to
 * whoever holds the link.
 */
export function claimRefusal(v: OfferView, uid: string, emailOk: boolean): ClaimRefusal | null {
  if (v.state === 'closed') return 'closed';
  if (v.state === 'claimed') return 'claimed';
  if (v.provider && v.provider.id === String(uid)) return 'self';
  if (!emailOk) return 'email';
  return null;
}
