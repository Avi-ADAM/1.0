/**
 * How a wish deal's money reaches its providers when one member received all of it
 * (QA_CONCIERGE_E2E C-17 → C-19).
 *
 * The customer paid one receiver; the payment is recorded as the rikma's income held by
 * that receiver (`$lib/server/sheirut/paymentSale`), and the rikma's split moves each
 * partner's share to them as split transfers (`Haluka`s of a `Tosplit`). A provider whose
 * part arrives that way receives it **once**: confirming the split transfer is confirming
 * their part of the deal, and the deal page offers that same transfer — "I received ₪X
 * from Y", with its own chat with Y — instead of a second, generic "I received my part".
 *
 * The other direction is the same fact too. A provider who already said, on the deal, that
 * they have their part (the receiver handed it over directly) holds that money: the
 * receiver's payment Sale is **carved** — it shrinks by the part and a Sale of the part is
 * held by the provider — so the split sees it where it is and never moves it a second time.
 * Only a payment no split has taken yet can be carved; once a split took it, its transfers
 * are how the part travels.
 *
 * Pure: the server half (`$lib/server/deal/splitCarriage`) reads and writes.
 */

import type { ProviderPart } from './partsReceived.js';

export interface PaymentSaleRow {
  id: string;
  in: number;
  holderId: string | null;
  externalId: string;
  /** A split took it (it is in a tosplit, or marked split) — no longer carvable. */
  inSplit: boolean;
}

/** One split transfer of a split that took a payment of this deal. */
export interface SplitTransfer {
  id: string;
  amount: number;
  senderId: string | null;
  senderName: string;
  receiverId: string | null;
  receiverName: string;
  /** The receiver said it arrived — on its own, that settles it. */
  confirmed: boolean;
  senderconf: boolean;
  tosplitId: string;
  projectId: string | null;
  forumId: string | null;
}

export interface DealCarriage {
  sales: PaymentSaleRow[];
  transfers: SplitTransfer[];
}

export const NO_CARRIAGE: DealCarriage = { sales: [], transfers: [] };

/** Every customer payment's `Sale.externalId` starts with this (`$lib/server/sheirut/paymentSale`). */
export const PAYMENT_KEY_PREFIX = 'sheirut-payment:';

const id = (rel: any): string | null => (rel?.data?.id != null ? String(rel.data.id) : null);
const name = (rel: any): string => String(rel?.data?.attributes?.username ?? '');
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A payment Sale's key — the customer's transfer (`…haluka:<id>`) or a part carved from it. */
export const isPaymentKey = (key: unknown) => String(key ?? '').startsWith(PAYMENT_KEY_PREFIX);

/** The Sale of `providerId`'s part, carved from the payment Sale keyed `saleKey`. */
export const carvedKey = (saleKey: string, providerId: string) => `${saleKey}:part:${providerId}`;
export const isCarvedKey = (key: unknown) => /:part:[^:]+$/.test(String(key ?? ''));

/** qid 437 (through `strapi.execute` or the proxy) → the deal's payment Sales and split transfers. */
export function readDealCarriage(res: any): DealCarriage {
  const sh = (res?.data?.sheirut ?? res?.sheirut)?.data?.attributes;
  const sales: PaymentSaleRow[] = [];
  const transfers = new Map<string, SplitTransfer>();
  for (const s of sh?.sales?.data ?? []) {
    const a = s?.attributes ?? {};
    if (!isPaymentKey(a.externalId)) continue;
    const tosplits = a.tosplits?.data ?? [];
    sales.push({
      id: String(s.id),
      in: Number(a.in) || 0,
      holderId: id(a.users_permissions_user),
      externalId: String(a.externalId),
      inSplit: a.splited === true || tosplits.length > 0
    });
    for (const ts of tosplits) {
      for (const h of ts?.attributes?.halukas?.data ?? []) {
        const ha = h?.attributes ?? {};
        if (transfers.has(String(h.id))) continue;
        transfers.set(String(h.id), {
          id: String(h.id),
          amount: Number(ha.amount) || 0,
          senderId: id(ha.usersend),
          senderName: name(ha.usersend),
          receiverId: id(ha.userrecive),
          receiverName: name(ha.userrecive),
          confirmed: ha.confirmed === true,
          senderconf: ha.senderconf === true,
          tosplitId: String(ts.id),
          projectId: id(ts?.attributes?.project),
          forumId: id(ha.forum)
        });
      }
    }
  }
  return { sales, transfers: [...transfers.values()] };
}

/** The split transfers that bring money to `userId` on this deal's splits. */
export function transfersTo(c: DealCarriage, userId: string): SplitTransfer[] {
  return c.transfers.filter((t) => t.receiverId === String(userId) && t.amount > 0);
}

/** `userId` takes their part through the split — the deal asks them on its transfers, not on its own. */
export const partViaSplit = (c: DealCarriage, userId: string) => transfersTo(c, userId).length > 0;

/** Every split transfer bringing money to `userId` on this deal arrived — their part did. */
export function receivedViaSplit(c: DealCarriage, userId: string): boolean {
  const mine = transfersTo(c, userId);
  return mine.length > 0 && mine.every((t) => t.confirmed);
}

/** The split transfers to the deal's providers — what the deal page shows, pair by pair. */
export function providerTransfers(c: DealCarriage, parts: ProviderPart[]): SplitTransfer[] {
  const providers = new Set(parts.map((p) => p.providerId));
  return c.transfers.filter((t) => t.receiverId != null && providers.has(t.receiverId) && t.amount > 0);
}

export interface CarveStep {
  providerId: string;
  /** The payment Sale the part is taken out of, and what it holds after. */
  fromSaleId: string;
  fromIn: number;
  amount: number;
  /** The new Sale's key, held by the provider — its idempotency key. */
  key: string;
}

/**
 * The carving that makes the payment Sales say where the money is: for each provider who
 * confirmed their part and does not take it through a split, what they do not hold yet is
 * taken out of payment Sales no split has taken, held by someone else. Idempotent by
 * construction — a carved Sale is held by the provider, so a second run finds nothing missing.
 */
export function carvePlan(input: { parts: ProviderPart[]; confirmed: Iterable<string>; carriage: DealCarriage }): CarveStep[] {
  const yes = new Set([...input.confirmed].map(String));
  const { sales } = input.carriage;
  const left = new Map(sales.map((s) => [s.id, s.in]));
  const steps: CarveStep[] = [];
  for (const p of input.parts) {
    if (!yes.has(p.providerId) || partViaSplit(input.carriage, p.providerId)) continue;
    const held = sales.filter((s) => s.holderId === p.providerId).reduce((t, s) => t + s.in, 0);
    let need = r2(p.due - held);
    for (const s of sales) {
      if (need <= 0.005) break;
      // Never out of another provider's carved part, and never out of a split's money.
      if (s.holderId === p.providerId || s.inSplit || isCarvedKey(s.externalId)) continue;
      const avail = left.get(s.id) ?? 0;
      if (avail <= 0.005) continue;
      const take = r2(Math.min(need, avail));
      left.set(s.id, r2(avail - take));
      need = r2(need - take);
      steps.push({ providerId: p.providerId, fromSaleId: s.id, fromIn: r2(avail - take), amount: take, key: carvedKey(s.externalId, p.providerId) });
    }
  }
  return steps;
}
