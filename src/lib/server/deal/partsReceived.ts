/**
 * The server half of `$lib/sheirut/partsReceived` (QA C-19): read who has confirmed
 * receiving their part of a wish deal, record a provider's own confirmation, and move
 * the deal's "paid" flag — which only ever follows the confirmations.
 *
 * What a provider is owed comes from `loadDealDue` (C-14: approved hours, capped at the
 * agreed price), so a provider is asked to confirm the money they are actually owed.
 */

import { loadDealDue, type QidRunner } from '$lib/server/sheirut/dealDue.js';
import { ActionError } from '$lib/server/actions/errors.js';
import { loadDealCarriage } from './splitCarriage.js';
import { isPaymentKey, NO_CARRIAGE, partViaSplit, receivedViaSplit, transfersTo, type DealCarriage } from '$lib/sheirut/splitCarriage.js';
import {
  partsState,
  providerParts,
  readPartEntries,
  toPartInputs,
  withPartReceived,
  type PartEntry,
  type PartsState
} from '$lib/sheirut/partsReceived.js';

export interface LoadedParts extends PartsState {
  sheirutId: string;
  entries: PartEntry[];
  customerIds: string[];
  moneyTransfered: boolean;
  iTransferMoney: boolean;
  /** How the rikma's split carries the payment (`$lib/sheirut/splitCarriage`). */
  carriage: DealCarriage;
}

const root = (res: any) => res?.data?.sheirut ?? res?.sheirut;

/** Null when the deal is not a wish deal — those keep their old single "money arrived" flag. */
export async function loadParts(run: QidRunner, sheirutId: string): Promise<LoadedParts | null> {
  const due = await loadDealDue(run, sheirutId);
  if (!due) return null;
  const [res, carriage] = await Promise.all([
    run('418dealPartsReceived', { id: String(sheirutId) }),
    loadDealCarriage(run, sheirutId).catch((err) => {
      console.warn('[partsReceived] could not read how the split carries the deal:', err);
      return NO_CARRIAGE;
    })
  ]);
  if (res?.errors?.length) throw new Error(`Could not read the deal's confirmations: ${JSON.stringify(res.errors).slice(0, 300)}`);
  const sh = root(res)?.data?.attributes ?? {};
  const parts = providerParts(due.lines);
  // A part that arrived through the split is received: confirming its transfer was the
  // provider's own confirmation (`$lib/sheirut/splitCarriage`). Written with the next write.
  const entries = parts
    .filter((p) => receivedViaSplit(carriage, p.providerId))
    .reduce((acc, p) => (acc.some((e) => e.userId === p.providerId && e.iGotMoney) ? acc : withPartReceived(acc, p.providerId)), readPartEntries(sh.iGotMoney));
  return {
    ...partsState(parts, entries),
    sheirutId: String(sheirutId),
    entries,
    customerIds: due.customerIds,
    moneyTransfered: sh.moneyTransfered === true,
    iTransferMoney: sh.iTransferMoney === true,
    carriage
  };
}

/**
 * Record that `userId` received their part in full, and mark the deal paid when they were
 * the last provider to do so. Throws for someone who is not a provider of this deal.
 */
export async function confirmPartReceived(
  run: QidRunner,
  sheirutId: string,
  userId: string,
  /**
   * The amount the provider was shown (a notice). "I received it in full" is a
   * statement about her own money — if more hours were approved since, she has
   * not seen what she would be confirming. Omitted: as before.
   */
  expectAmount?: unknown
): Promise<{ state: LoadedParts; becamePaid: boolean }> {
  const before = await loadParts(run, sheirutId);
  if (!before) throw new Error('Only a deal made from a wish is confirmed part by part');
  const mine = before.parts.find((p) => p.providerId === String(userId));
  if (!mine) {
    throw new Error('Only a provider of this deal can confirm receiving their part');
  }
  // Her part travels through the rikma's split: it is received on its transfers — "I received
  // ₪X from Y", each with its own chat with Y — never on a second, generic button.
  if (partViaSplit(before.carriage, String(userId)) && !receivedViaSplit(before.carriage, String(userId))) {
    throw new ActionError('PART_VIA_SPLIT', "Your part comes through the rikma's split — confirm each transfer you received", {
      transfers: transfersTo(before.carriage, String(userId))
        .filter((t) => !t.confirmed)
        .map((t) => ({ id: t.id, amount: t.amount, senderId: t.senderId, senderName: t.senderName }))
    });
  }
  if (expectAmount != null && expectAmount !== '') {
    const expected = Number(expectAmount);
    if (Number.isFinite(expected) && Math.abs(expected - mine.due) > 0.005) {
      throw new ActionError('AMOUNT_MOVED', 'The amount of your part changed since it was shown — reload to see it', {
        expected,
        standing: mine.due
      });
    }
  }

  const entries = withPartReceived(before.entries, String(userId));
  const after = partsState(before.parts, entries);
  const becamePaid = after.allConfirmed && !before.moneyTransfered;
  const data: Record<string, unknown> = { iGotMoney: toPartInputs(entries) };
  // Every provider has their part ⇒ the customer's money has, by definition, all arrived.
  if (after.allConfirmed) Object.assign(data, { moneyTransfered: true, iTransferMoney: true });

  const res = await run('213updateSheirut', { id: String(sheirutId), data });
  if (res?.errors?.length) throw new Error(`Could not record the confirmation: ${JSON.stringify(res.errors).slice(0, 300)}`);

  return { state: { ...before, ...after, entries, moneyTransfered: before.moneyTransfered || after.allConfirmed }, becamePaid };
}

/**
 * The customer's payment was recorded and covers what she owes (`covered`, C-14). She has
 * done her side: `iTransferMoney`. The deal reads paid only if every provider already
 * confirmed their part; otherwise it waits for them.
 */
export async function settleCoveredPayment(run: QidRunner, sheirutId: string): Promise<{ paid: boolean }> {
  const parts = await loadParts(run, sheirutId).catch((err) => {
    console.warn('[partsReceived] could not read the confirmations; the deal waits for them:', err);
    return null;
  });
  const paid = parts?.allConfirmed === true;
  const res = await run('213updateSheirut', {
    id: String(sheirutId),
    data: { iTransferMoney: true, ...(paid ? { moneyTransfered: true } : {}) }
  });
  if (res?.errors?.length) throw new Error(JSON.stringify(res.errors).slice(0, 300));
  return { paid };
}

/**
 * A split transfer was confirmed by its receiver (`confirmHaluka`, kind 'receive'). For
 * every deal whose payment that split carries and of which the receiver is a provider, once
 * every split transfer to them on it has arrived, their part is received — the same fact,
 * so the deal never asks them again (`$lib/sheirut/splitCarriage`).
 */
export async function settlePartsFromSplit(
  run: QidRunner,
  tosplitId: string,
  userId: string
): Promise<{ sheirutId: string; becamePaid: boolean; state: LoadedParts }[]> {
  const res = await run('439tosplitDeals', { id: String(tosplitId) });
  if (res?.errors?.length) throw new Error(`Could not read the split's deals: ${JSON.stringify(res.errors).slice(0, 300)}`);
  const sales = (res?.data?.tosplit ?? res?.tosplit)?.data?.attributes?.sales?.data ?? [];
  const deals = new Set<string>();
  for (const s of sales) {
    if (!isPaymentKey(s?.attributes?.externalId)) continue;
    for (const d of s?.attributes?.sheiruts?.data ?? []) deals.add(String(d.id));
  }

  const me = String(userId);
  const out: { sheirutId: string; becamePaid: boolean; state: LoadedParts }[] = [];
  for (const sheirutId of deals) {
    const parts = await loadParts(run, sheirutId);
    if (!parts || !parts.parts.some((p) => p.providerId === me)) continue;
    if (!receivedViaSplit(parts.carriage, me)) continue;
    // Written even when already derived: it persists the fact, and "paid" with it.
    const { state, becamePaid } = await confirmPartReceived(run, sheirutId, me);
    out.push({ sheirutId, becamePaid, state });
  }
  return out;
}
