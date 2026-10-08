/**
 * The money loop of a wish deal (QA_CONCIERGE_E2E C-17).
 *
 * The customer paid a member (a `Haluka` from her to a registered receiver), she
 * confirmed she sent it and the receiver confirmed it arrived. Until now that was the
 * end of the story: nothing was recorded in the rikma, so its split mechanism — the one
 * that computes what each partner is owed — never saw the money, and `/deals` read
 * "paid 0" forever.
 *
 * Both sides have attested the transfer, so it is recorded as the rikma's income, held
 * by whoever received it, with the holder claim already `confirmed` (no second consent
 * round — the haluka *was* the consent). The ordinary split machinery takes it from there:
 * the receiver holds the rikma's money until a split settles each partner's share.
 *
 *  - Only wish deals: the deal's product is the wish's own composed product (`ratson` on
 *    the matanot). Every other sheirut records its income its own way (a seller reports
 *    the sale) and must not be counted twice.
 *  - Idempotent: the haluka's id is the Sale's `externalId` (its idempotency key, as for the
 *    external Sales API) — a second completion of the same haluka records nothing, and the
 *    note stays free for the people who read the sales table.
 *  - Once the recorded income covers what she owes, her side is done (`iTransferMoney`). The
 *    deal reads "paid" (`moneyTransfered`) only when every provider has also confirmed
 *    receiving their part in full (C-19, `$lib/server/deal/partsReceived`).
 *  - Best-effort: the money already moved, so a failure here is logged and returned, never
 *    thrown — it must not undo the confirmation.
 */

import { loadDealDue, PAYMENT_KEY_PREFIX } from './dealDue.js';
import { settleCoveredPayment } from '$lib/server/deal/partsReceived.js';

type Strapi = { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
type Ctx = { jwt: string; fetch: any };

export interface PaymentSaleArgs {
  sheirutId: string;
  halukaId: string;
  /** The customer — who sent the money. */
  senderId: string;
  /** The member who received it — who holds the rikma's money now. */
  receiverId: string;
  amount: number;
}

export interface PaymentSaleResult {
  saleId: string | null;
  /** Why nothing was recorded (absent when a Sale was). */
  skipped?: 'not a wish deal' | 'already recorded' | 'no amount' | 'incomplete deal' | 'failed';
  /** Whether the deal now reads as paid. */
  paid?: boolean;
}

const key = (halukaId: string) => `${PAYMENT_KEY_PREFIX}haluka:${halukaId}`;

export async function recordWishPaymentSale(
  strapi: Strapi,
  context: Ctx,
  args: PaymentSaleArgs,
  now: () => Date = () => new Date()
): Promise<PaymentSaleResult> {
  try {
    if (!(Number(args.amount) > 0)) return { saleId: null, skipped: 'no amount' };

    const res = await strapi.execute('395sheirutPaymentContext', { id: String(args.sheirutId) }, context.jwt, context.fetch);
    const sh = res?.data?.sheirut?.data?.attributes;
    if (!sh) return { saleId: null, skipped: 'failed' };

    // Only a deal made of a wish: its product is the wish's composed product.
    if (!sh.matanot?.data?.attributes?.ratson?.data?.id) return { saleId: null, skipped: 'not a wish deal' };

    const projectId = sh.project?.data?.id ? String(sh.project.data.id) : null;
    const matanotId = sh.matanot?.data?.id ? String(sh.matanot.data.id) : null;
    if (!projectId || !matanotId) return { saleId: null, skipped: 'incomplete deal' };

    const sales: { id: string; attributes?: { in?: number | null; externalId?: string | null } }[] = sh.sales?.data ?? [];
    if (sales.some((s) => s.attributes?.externalId === key(args.halukaId))) {
      return { saleId: null, skipped: 'already recorded' };
    }

    const date = now().toISOString();
    const created = await strapi.execute(
      '396createSheirutPaymentSale',
      {
        project: projectId,
        matanot: matanotId,
        holder: String(args.receiverId),
        customer: String(args.senderId),
        reporter: String(args.senderId),
        sheirut: String(args.sheirutId),
        in: Number(args.amount),
        unit: Number(sh.quant) > 0 ? Number(sh.quant) : 1,
        date,
        externalId: key(args.halukaId)
      },
      context.jwt,
      context.fetch
    );
    const saleId = created?.data?.createSale?.data?.id ? String(created.data.createSale.data.id) : null;
    if (!saleId) {
      console.error('[paymentSale] could not record the income:', JSON.stringify(created?.errors ?? 'no id'));
      return { saleId: null, skipped: 'failed' };
    }

    // The deal reads paid once what is recorded covers what it costs — and what a wish deal
    // costs is the hours the rikma approved, capped at the price agreed (C-14,
    // `./dealDue`), known once every line is closed. If that cannot be read, the agreed
    // total is the fallback, as before.
    const recorded = sales.reduce((sum, s) => sum + (Number(s.attributes?.in) || 0), 0) + Number(args.amount);
    const total = Number(sh.total) || 0;
    let paid = total <= 0 || recorded >= total - 0.005;
    try {
      const owed = await loadDealDue((qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch), args.sheirutId);
      if (owed) paid = owed.final && owed.recorded >= owed.due - 0.005;
    } catch (err) {
      console.warn('[paymentSale] could not read what the deal owes; judging by its agreed total:', err);
    }
    // Covered is her side done (`iTransferMoney`). "Paid" waits for every provider to confirm
    // receiving their part in full (C-19, `$lib/sheirut/partsReceived`).
    if (paid) {
      try {
        paid = (
          await settleCoveredPayment((qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch), args.sheirutId)
        ).paid;
      } catch (err) {
        console.error('[paymentSale] the income is recorded but the deal flags did not move:', err);
        paid = false;
      }
    }
    return { saleId, paid };
  } catch (err) {
    console.error('[paymentSale] failed:', err);
    return { saleId: null, skipped: 'failed' };
  }
}
