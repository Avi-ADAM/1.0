/**
 * What the customer of a wish deal owes — by the hours the rikma approved, never above
 * what she agreed (QA_CONCIERGE_E2E C-14, docs/tbd/PLAN_SHARE_BASIS_HOURS_VS_PRICE.md).
 *
 * Inside the rikma each partner's share follows the **approved hours** (`Σ
 * FinnishedMission.total`), and the customer's money is split by those shares. If she paid
 * the price agreed at signing while the shares followed the hours, a partner who worked
 * fast would get a fraction of their agreed price and the rest would go to the others. So
 * the hours carry through to her too:
 *
 *   - a mission line costs what was approved on it, **capped** at the price she agreed for
 *     that line (`hoursPerUnit × ratePerHour × unitsPerProduct`) — the agreement is a
 *     ceiling, not a bill;
 *   - approved value above the cap is an **overrun**: it counts in the rikma (its members
 *     signed it) but it is not charged to her — that would take her consent;
 *   - a resource line costs its agreed price, as resources always have (`Rikmash.total`);
 *   - the amount is known only when every mission line is **closed** (finished, archived
 *     or released): until then it is a running figure, and nothing is asked of her.
 *
 * Pure on purpose: the action that asks her to pay, the payment record that decides when
 * the deal reads "paid", the lev card and the deal page all read the same numbers.
 *
 * Hours and money follow one precision (`$lib/timers/precision.ts`): hours in whole
 * minutes, money in agorot, and an overrun under 1 ₪ or under a minute of the line's work
 * is noise — a clock's seconds, not a claim — so it is not reported. It is still never
 * charged: `due` is `min(approved, cap)` whatever the overrun reads.
 */

import { isRealOverrun, roundHours, roundMoney } from '$lib/timers/precision.js';

export type DealLineKind = 'mission' | 'resource';

export interface DealLineInput {
  /** The BOM line's id. */
  key: string;
  kind: DealLineKind;
  name: string;
  providerId: string | null;
  providerName?: string | null;
  /** The price she agreed for this line. */
  cap: number;
  /** Mission lines: Σ approved value. Resource lines: ignored (they cost their cap). */
  approved?: number;
  /** Mission lines: Σ approved hours, for display. */
  approvedHours?: number;
  /** Mission lines: the hours she agreed to, for display. */
  agreedHours?: number;
  /** Mission lines: no more hours can be approved on it. Resource lines: always closed. */
  closed?: boolean;
  /** Mission lines: the line has a mission in the rikma at all. */
  matched?: boolean;
  /** Mission lines: the mission (`Mesimabetahalich`) that carries it. */
  missionId?: string | null;
  /** Mission lines: the mission's own terms now — what an edit proposal is measured against. */
  missionHours?: number;
  missionRate?: number;
}

export interface DealLine extends DealLineInput {
  approved: number;
  closed: boolean;
  /** What this line costs her: min(approved, cap) for a mission, cap for a resource. */
  due: number;
  /**
   * Approved above the cap — counted in the rikma, not charged to her. 0 when it is
   * only rounding noise (under 1 ₪, or under a minute of this line's work).
   */
  overrun: number;
  /** Its provider confirmed receiving their part in full, or the whole deal is settled. */
  paid: boolean;
}

export interface DealDue {
  lines: DealLine[];
  /** Σ line caps — what she agreed to at most. */
  cap: number;
  /** Σ approved value of the mission lines (overrun included) + the resource lines. */
  approved: number;
  /** What she owes now: Σ line due, never above the deal's own total. */
  due: number;
  overrun: number;
  /** cap − due — what the agreement allowed that the hours did not use. */
  unused: number;
  /** Her payments recorded as the rikma's income (a haluka both sides confirmed, C-17). */
  recorded: number;
  /** Σ due of the parts whose provider confirmed receiving them in full (C-19). */
  received: number;
  /**
   * Every provider has their part — the deal is paid (`Sheirut.moneyTransfered`, which
   * only ever follows the confirmations). The same fact the deal's status reads.
   */
  settled: boolean;
  /**
   * What is paid: the parts their providers confirmed receiving, all of `due` once the
   * deal is settled. Money she sent that no provider has confirmed yet is not paid — it
   * is `inTransit` (C-19: a provider who has not received their part has not been paid).
   */
  paid: number;
  /** Everything she has sent or is covered by: paid, recorded, and transfers not confirmed yet. */
  committed: number;
  /** Sent towards `due` but not confirmed by the providers yet — neither paid nor still owed. */
  inTransit: number;
  /** due − committed, never below 0, and 0 once settled — what is still to be sent. */
  remaining: number;
  /** committed − due when positive: sent beyond what the hours came to. */
  excess: number;
  /** Every mission line is closed, so `due` is the final figure. */
  final: boolean;
}

/** Money at the cent, without floating-point dust. */
export const round2 = (n: number): number => roundMoney(n);

/** The line's own hourly rate — what a minute of its work is worth. */
function lineRate(l: DealLineInput): number {
  const hours = nonNeg(l.agreedHours);
  return hours > 0 ? nonNeg(l.cap) / hours : nonNeg(l.missionRate);
}

function nonNeg(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * "Paid" has one meaning on a deal, and it is C-19's: a provider is paid when they say so.
 * The deal page's status, its per-part ticks, the amount it shows as paid, what it still
 * asks of her and the deals bell all read it from here — never from the recorded income
 * alone (the receiver may never confirm the haluka, and the providers may have been paid
 * part by part) and never from the payment flags alone.
 */
export function computeDealDue(input: {
  lines: DealLineInput[];
  /** `Sheirut.total` — the deal's agreed total; an outer ceiling when positive. */
  dealTotal?: number | null;
  /** Her payments recorded as the rikma's income (Σ `Sale.in` of the payment sales). */
  recorded?: number | null;
  /** Σ her transfers on the deal (halukas), confirmed or not. */
  committed?: number | null;
  /** The users who confirmed receiving their part in full (`Sheirut.iGotMoney`). */
  confirmed?: Iterable<string> | null;
  /** `Sheirut.moneyTransfered` — set only once every provider confirmed. */
  settled?: boolean | null;
}): DealDue {
  const yes = new Set([...(input.confirmed ?? [])].map(String));
  const providers = new Set((input.lines ?? []).filter((l) => l?.providerId).map((l) => String(l.providerId)));
  const settled =
    input.settled === true || (providers.size > 0 && [...providers].every((p) => yes.has(p)));
  const linePaid = (l: DealLineInput) => settled || (!!l.providerId && yes.has(String(l.providerId)));

  const lines: DealLine[] = (input.lines ?? []).map((l) => {
    const cap = nonNeg(l.cap);
    if (l.kind === 'resource') {
      return { ...l, cap, approved: cap, closed: true, due: cap, overrun: 0, paid: linePaid(l) };
    }
    const approved = nonNeg(l.approved);
    const above = round2(Math.max(0, approved - cap));
    return {
      ...l,
      cap,
      approved,
      closed: l.closed === true,
      due: round2(Math.min(approved, cap)),
      overrun: isRealOverrun(above, lineRate(l)) ? above : 0,
      paid: linePaid(l)
    };
  });

  const sum = (pick: (l: DealLine) => number) => round2(lines.reduce((s, l) => s + pick(l), 0));
  const cap = sum((l) => l.cap);
  const dealTotal = nonNeg(input.dealTotal);
  const due = round2(dealTotal > 0 ? Math.min(sum((l) => l.due), dealTotal) : sum((l) => l.due));
  const recorded = round2(nonNeg(input.recorded));
  const received = round2(Math.min(due, sum((l) => (l.providerId && yes.has(String(l.providerId)) ? l.due : 0))));
  const paid = settled ? due : received;
  const committed = round2(Math.max(paid, recorded, nonNeg(input.committed)));

  return {
    lines,
    cap,
    approved: sum((l) => l.approved),
    due,
    overrun: sum((l) => l.overrun),
    unused: round2(Math.max(0, (dealTotal > 0 ? Math.min(cap, dealTotal) : cap) - due)),
    recorded,
    received,
    settled,
    paid,
    committed,
    inTransit: round2(Math.max(0, Math.min(committed, due) - paid)),
    remaining: settled ? 0 : round2(Math.max(0, due - committed)),
    excess: round2(Math.max(0, committed - due)),
    final: lines.every((l) => l.kind !== 'mission' || (l.matched !== false && l.closed))
  };
}

// ── the rows the server reads ───────────────────────────────────────────────

interface Rel<T> {
  data?: T | null;
}
interface Node<A> {
  id?: string | number | null;
  attributes?: A | null;
}

export interface RawRecipeMission {
  hoursPerUnit?: number | null;
  ratePerHour?: number | null;
  unitsPerProduct?: number | null;
  mode?: string | null;
  notes?: string | null;
  assignedMember?: Rel<Node<{ username?: string | null }>> | null;
  pendm?: Rel<Node<{ name?: string | null; rishon?: Rel<Node<unknown>> | null }>> | null;
  /** Set when the line was filled from an open offer (C-19): the explicit link to its mission. */
  mesimabetahalich?: Rel<Node<unknown>> | null;
}

export interface RawRecipeResource {
  quantityPerUnit?: number | null;
  pricePerUnit?: number | null;
  mode?: string | null;
  notes?: string | null;
  assignedMember?: Rel<Node<{ username?: string | null }>> | null;
  pmash?: Rel<Node<{ name?: string | null }>> | null;
}

export interface RawDealMission {
  name?: string | null;
  hoursassinged?: number | null;
  perhour?: number | null;
  finnished?: boolean | null;
  lifecycle?: string | null;
  users_permissions_user?: Rel<Node<{ username?: string | null }>> | null;
  finnished_missions?: Rel<Array<Node<{ noofhours?: number | null; total?: number | null }>>> | null;
}

const idOf = (rel: Rel<Node<unknown>> | null | undefined): string | null =>
  rel?.data?.id != null ? String(rel.data.id) : null;

const norm = (s: unknown) => String(s ?? '').trim();

/** Closed: nothing more can be approved on it — done, or taken out of the rikma. */
export function missionClosed(m: RawDealMission | null | undefined): boolean {
  return m?.finnished === true || m?.lifecycle === 'archived' || m?.lifecycle === 'released';
}

/**
 * Turn a wish product's BOM and the rikma's missions into deal lines.
 *
 * A mission line is the mission linked on the line itself when there is one (a gap filled
 * from an open offer, C-19), otherwise the mission `createSheirutFromPending` made for it:
 * held by the line's provider, named `pendm.name || notes || "<product> - משימה"`. Each
 * mission is claimed by at most one line — the explicit link first, then by name, then the
 * provider's next unclaimed one — and a mission no line claims is not part of the deal
 * (work the partners added among themselves is theirs to settle, not hers to pay).
 */
export function buildDealLines(args: {
  productName?: string | null;
  recipeMissions: Array<Node<RawRecipeMission>>;
  recipeResources: Array<Node<RawRecipeResource>>;
  missions: Array<Node<RawDealMission>>;
}): DealLineInput[] {
  const productName = norm(args.productName);
  const pool = (args.missions ?? [])
    .filter((m) => m?.attributes)
    .map((m) => ({ id: String(m.id), a: m.attributes as RawDealMission, taken: false }));

  const lines: DealLineInput[] = [];
  const recipeMissions = (args.recipeMissions ?? []).filter((rm) => rm?.attributes?.mode !== 'consumeExisting');

  // Explicit links first, so a name match can never steal a mission a line points at.
  const linked = new Map<string, (typeof pool)[number]>();
  for (const rm of recipeMissions) {
    const mid = idOf(rm.attributes?.mesimabetahalich);
    const hit = mid ? pool.find((p) => !p.taken && p.id === mid) : undefined;
    if (hit) {
      hit.taken = true;
      linked.set(String(rm.id), hit);
    }
  }

  for (const rm of recipeMissions) {
    const a = rm.attributes ?? {};
    const providerId = idOf(a.assignedMember) ?? idOf(a.pendm?.data?.attributes?.rishon);
    const name = norm(a.pendm?.data?.attributes?.name) || norm(a.notes) || `${productName} - משימה`;
    const units = nonNeg(a.unitsPerProduct) || 1;
    const agreedHours = nonNeg(a.hoursPerUnit) * units;
    const cap = round2(agreedHours * nonNeg(a.ratePerHour));

    let hit = linked.get(String(rm.id));
    if (!hit) {
      const mine = pool.filter((p) => !p.taken && idOf(p.a.users_permissions_user) === providerId);
      hit = mine.find((p) => norm(p.a.name) === name) ?? mine[0];
      if (hit) hit.taken = true;
    }

    const rows = hit?.a.finnished_missions?.data ?? [];
    lines.push({
      key: String(rm.id),
      kind: 'mission',
      name,
      providerId,
      providerName:
        a.assignedMember?.data?.attributes?.username ?? hit?.a.users_permissions_user?.data?.attributes?.username ?? null,
      cap,
      agreedHours,
      approved: round2(rows.reduce((s, r) => s + nonNeg(r?.attributes?.total), 0)),
      // Whole minutes: rows filed before the rule still carry their seconds (15.0013 h).
      approvedHours: roundHours(rows.reduce((s, r) => s + nonNeg(r?.attributes?.noofhours), 0)),
      closed: missionClosed(hit?.a),
      matched: !!hit,
      missionId: hit?.id ?? null,
      missionHours: nonNeg(hit?.a.hoursassinged),
      missionRate: nonNeg(hit?.a.perhour)
    });
  }

  for (const rr of args.recipeResources ?? []) {
    const a = rr?.attributes ?? {};
    if (a.mode === 'consumeExisting') continue;
    lines.push({
      key: String(rr.id),
      kind: 'resource',
      name: norm(a.pmash?.data?.attributes?.name) || norm(a.notes) || productName,
      providerId: idOf(a.assignedMember),
      providerName: a.assignedMember?.data?.attributes?.username ?? null,
      cap: round2(nonNeg(a.pricePerUnit) * (nonNeg(a.quantityPerUnit) || 1))
    });
  }

  return lines;
}
