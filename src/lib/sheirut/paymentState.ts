import type { DealDue } from './dealDue';

/**
 * Where a deal's payment stands for the person looking at it — the one answer the lev
 * purchase card and the deal page's "next payment" button both read, so the button
 * never offers a payment the card would not open.
 *
 * - `supplier`     the viewer sells: the customer pays, the viewer confirms receiving.
 * - `paid`         every provider has their part (`moneyTransfered` / `due.settled`).
 * - `sent`         she has sent it; the transfer waits for the receiver's confirmation.
 * - `notYet`       a wish deal whose parts are not all finished — the amount is not final (C-14).
 * - `nothingLeft`  a wish deal whose approved hours are already covered.
 * - `open`         she can choose who receives the money and send it now.
 */
export type PaymentState = 'supplier' | 'paid' | 'sent' | 'notYet' | 'nothingLeft' | 'open';

export interface PaymentSale {
  moneyTransfered?: boolean | null;
  iTransferMoney?: boolean | null;
}

export function paymentState(
  sale: PaymentSale,
  due: Pick<DealDue, 'final' | 'remaining' | 'settled'> | null,
  isCustomer = true
): PaymentState {
  if (!isCustomer) return 'supplier';
  if (sale.moneyTransfered || due?.settled) return 'paid';
  if (sale.iTransferMoney) return 'sent';
  if (due && !due.final) return 'notYet';
  if (due && due.remaining <= 0) return 'nothingLeft';
  return 'open';
}
