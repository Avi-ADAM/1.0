/**
 * Arranged orders whose payment never arrived (PLAN_SHOP_OPERATIONS §5.2,
 * rule 1): a `pendingPayment` order does **not** mature by silence — it lapses.
 * Otherwise every junk form on a storefront would become a sale.
 *
 * Run by `/api/cron/orders` with the service token. Lapsing is the plain
 * cancel of a waiting order: status `cancelled` and a line in the note. No
 * sale, stock or holder was ever touched, so there is nothing to undo — and
 * the storefront hears `order.statusChanged`, as for any cancel.
 *
 * An order a member already started confirming (its holder is stamped) is
 * left alone: the money is with them, the confirm just has to finish.
 */
import { hasLapsed, orderNoteOf } from '$lib/server/ordersApi.js';
import type { ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';

export interface LapsedOrder {
  id: string;
  ref: string;
  projectId: string;
}

export interface ExpiryReport {
  lapsed: LapsedOrder[];
  skipped: number;
  errors: string[];
}

/** Which of these waiting rows should lapse now? Pure. */
export function lapsedOf(nodes: any[], nowMs: number): { lapse: any[]; skipped: number } {
  const lapse: any[] = [];
  let skipped = 0;
  for (const n of nodes) {
    const a = n?.attributes ?? {};
    if (a.status !== 'pendingPayment' || !hasLapsed(a.expiresAt, nowMs)) continue;
    if (a.holder?.data?.id != null) {
      skipped++;
      continue;
    }
    lapse.push(n);
  }
  return { lapse, skipped };
}

export async function expireArrangedOrders(run: ProbeRun, nowMs = Date.now()): Promise<ExpiryReport> {
  const res = await run('ordersLapsedArranged', { now: new Date(nowMs).toISOString() });
  const { lapse, skipped } = lapsedOf(res?.data?.orders?.data ?? [], nowMs);
  const report: ExpiryReport = { lapsed: [], skipped, errors: [] };
  for (const n of lapse) {
    const a = n.attributes ?? {};
    try {
      await run('rikmaApiOrderUpdate', {
        id: n.id,
        data: { status: 'cancelled', note: orderNoteOf(a.note ?? null, ['פג — התשלום לא תואם בזמן']) }
      });
      report.lapsed.push({ id: String(n.id), ref: String(a.ref), projectId: String(a.project?.data?.id ?? '') });
    } catch (e) {
      report.errors.push(`${a.ref}: ${(e as Error).message}`);
    }
  }
  return report;
}
