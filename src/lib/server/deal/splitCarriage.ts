/**
 * The server half of `$lib/sheirut/splitCarriage`: read how the rikma's split carries a
 * wish deal's payment, and carve the part a provider already holds out of the receiver's
 * payment Sale, so the split never moves money that already arrived.
 */

import type { QidRunner } from '$lib/server/sheirut/dealDue.js';
import type { ProviderPart } from '$lib/sheirut/partsReceived.js';
import { carvePlan, readDealCarriage, type CarveStep, type DealCarriage } from '$lib/sheirut/splitCarriage.js';

export async function loadDealCarriage(run: QidRunner, sheirutId: string): Promise<DealCarriage> {
  const res = await run('437dealSplitCarriage', { id: String(sheirutId) });
  if (res?.errors?.length) throw new Error(`Could not read how the split carries the deal: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return readDealCarriage(res);
}

const ctxRoot = (res: any) => (res?.data?.sheirut ?? res?.sheirut)?.data?.attributes;

/**
 * Carve what each confirmed provider holds out of the payment Sales no split has taken
 * (`carvePlan`). Each step records the provider's Sale first — its key makes a repeat a
 * no-op — and only then shrinks the receiver's, so a failure in between over-counts the
 * income (logged) rather than losing it.
 */
export async function carveConfirmedParts(
  run: QidRunner,
  sheirutId: string,
  state: { parts: ProviderPart[]; confirmed: Iterable<string> },
  now: () => Date = () => new Date()
): Promise<CarveStep[]> {
  const carriage = await loadDealCarriage(run, sheirutId);
  const steps = carvePlan({ parts: state.parts, confirmed: state.confirmed, carriage });
  if (!steps.length) return [];

  const sh = ctxRoot(await run('395sheirutPaymentContext', { id: String(sheirutId) }));
  const project = sh?.project?.data?.id;
  const matanot = sh?.matanot?.data?.id;
  if (!project || !matanot) throw new Error(`Deal ${sheirutId} has no rikma or product to carve a part in`);
  const customer = sh?.users_permissions_users?.data?.[0]?.id;

  const done: CarveStep[] = [];
  for (const step of steps) {
    const date = now().toISOString();
    const created = await run('396createSheirutPaymentSale', {
      project: String(project),
      matanot: String(matanot),
      holder: step.providerId,
      customer: customer != null ? String(customer) : null,
      reporter: step.providerId,
      sheirut: String(sheirutId),
      in: step.amount,
      // A share of a unit already counted, not another unit sold.
      unit: 0,
      date,
      externalId: step.key
    });
    if (created?.errors?.length || !created?.data?.createSale?.data?.id) {
      throw new Error(`Could not record ${step.providerId}'s part: ${JSON.stringify(created?.errors ?? 'no id').slice(0, 300)}`);
    }
    const reduced = await run('438reduceDealPaymentSale', { id: step.fromSaleId, in: step.fromIn });
    if (reduced?.errors?.length) {
      console.error(
        `[splitCarriage] ${step.providerId}'s part is recorded but Sale ${step.fromSaleId} still holds it — set its "in" to ${step.fromIn} by hand:`,
        JSON.stringify(reduced.errors).slice(0, 300)
      );
      continue;
    }
    done.push(step);
  }
  return done;
}
