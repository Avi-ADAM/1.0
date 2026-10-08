/**
 * "The money arrived" on a wish deal — one write, whichever card it is said on.
 *
 * The same fact used to live in two places that never heard of each other: the deal page's
 * "I received my part in full" (`Sheirut.iGotMoney`, C-19) and the transfer card's "received"
 * on the customer's payment (`Haluka.confirmed`, C-17). A receiver who confirmed one was asked
 * again on the other, the deal could read "paid" while its transfer still waited, and the
 * payment never reached the rikma's books (the Sale is recorded on the transfer).
 *
 * Now both actions call `receiveDealMoney`, so a confirmation on either card is both facts:
 *  - every transfer on this deal that `userId` receives and has not confirmed is settled —
 *    `confirmed` and `senderconf` together, because the receiver's word is the one that
 *    counts: money that arrived was sent, and the sender is never asked to confirm it again;
 *    the payment Sale is recorded once per transfer (`recordSale`, idempotent by externalId);
 *  - if `userId` is a provider of the deal, their own part is marked received
 *    (`confirmPartReceived` — which also turns the deal "paid" when they were the last).
 *
 * A provider's part is still only theirs to confirm (C-19): receiving the customer's whole
 * payment confirms the receiver's own part, never another provider's.
 */

import { loadDealDue, type DealTransfer, type QidRunner } from '$lib/server/sheirut/dealDue.js';
import { providerParts } from '$lib/sheirut/partsReceived.js';
import { confirmPartReceived, type LoadedParts } from './partsReceived.js';

export interface ReceiveDealMoneyOptions {
  /** The part amount a notice showed the provider (AMOUNT_MOVED when it changed since). */
  expectAmount?: unknown;
  /** Record the settled transfer as the rikma's income — `recordWishPaymentSale`. */
  recordSale?: (transfer: DealTransfer) => Promise<unknown>;
  /** The deal page's "my part" button: refuse a non-provider before anything is written. */
  requireProvider?: boolean;
}

export interface ReceiveDealMoneyResult {
  /** Transfers this call settled (already-settled ones are not repeated). */
  transfers: DealTransfer[];
  /** The provider's part, when `userId` is a provider of the deal. */
  part: { state: LoadedParts; becamePaid: boolean } | null;
}

export class NotADealReceiverError extends Error {}

export async function receiveDealMoney(
  run: QidRunner,
  sheirutId: string,
  userId: string,
  opts: ReceiveDealMoneyOptions = {}
): Promise<ReceiveDealMoneyResult> {
  const me = String(userId);
  const due = await loadDealDue(run, String(sheirutId));
  if (!due) throw new NotADealReceiverError('Only a deal made from a wish is confirmed this way');

  const pending = due.transfers.filter((t) => t.receiverId === me && !t.confirmed);
  const isProvider = providerParts(due.lines).some((p) => p.providerId === me);
  if (opts.requireProvider && !isProvider) {
    throw new NotADealReceiverError('Only a provider of this deal can confirm receiving their part');
  }
  if (!pending.length && !isProvider) {
    throw new NotADealReceiverError('Only a provider of this deal, or the receiver of a payment on it, can confirm receiving money');
  }

  // The part first: it is the one that can refuse (AMOUNT_MOVED, before anything is written).
  const part = isProvider ? await confirmPartReceived(run, String(sheirutId), me, opts.expectAmount) : null;

  const settled: DealTransfer[] = [];
  for (const t of pending) {
    const res = await run('71.6confirmHaluka', { id: t.id, confirmed: true, senderconf: true });
    if (res?.errors?.length) throw new Error(`Could not settle transfer ${t.id}: ${JSON.stringify(res.errors).slice(0, 300)}`);
    const done = { ...t, confirmed: true, senderconf: true };
    settled.push(done);
    // Best-effort, like the confirmation it follows: the money already moved.
    await opts.recordSale?.(done).catch((err) => console.error('[dealMoney] payment sale failed:', err));
  }

  return { transfers: settled, part };
}
