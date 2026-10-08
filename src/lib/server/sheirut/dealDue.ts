/**
 * Read what a wish deal's customer owes (QA_CONCIERGE_E2E C-14) — the server half of
 * `$lib/sheirut/dealDue`. One read (qid 397), one pure computation.
 *
 * Returns null for a deal that is not a wish deal (its product carries no `ratson`): those
 * are priced the way they always were, at `Sheirut.total`.
 */

import { buildDealLines, computeDealDue, type DealDue } from '$lib/sheirut/dealDue.js';
import { readPartEntries } from '$lib/sheirut/partsReceived.js';

/** Every customer payment's `Sale.externalId` starts with this (`./paymentSale`). */
export const PAYMENT_KEY_PREFIX = 'sheirut-payment:';

/** Runs one qid — `strapi.execute` in an action, the /api/send proxy in a page load. */
export type QidRunner = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface LoadedDealDue extends DealDue {
  sheirutId: string;
  /** `Sheirut.total` / `quant` — what the deal was agreed at, and for how many units. */
  dealTotal: number;
  quant: number;
  projectId: string | null;
  customerIds: string[];
  memberIds: string[];
  /** The customer's transfers on this deal (`Haluka`s), as `../deal/dealMoney` confirms them. */
  transfers: DealTransfer[];
}

export interface DealTransfer {
  id: string;
  amount: number;
  senderId: string | null;
  receiverId: string | null;
  senderconf: boolean;
  /** The receiver said the money arrived — on its own, that settles the transfer. */
  confirmed: boolean;
}

const relId = (rel: any) => (rel?.data?.id != null ? String(rel.data.id) : null);

/** Strapi answers `{ data: {...} }` through `strapi.execute` and `{...}` through the proxy. */
const root = (res: any) => res?.data?.sheirut ?? res?.sheirut;

export async function loadDealDue(run: QidRunner, sheirutId: string): Promise<LoadedDealDue | null> {
  const node = root(await run('397sheirutDealDue', { id: String(sheirutId) }))?.data;
  const sh = node?.attributes;
  if (!sh) throw new Error(`Deal ${sheirutId} not found`);

  const product = sh.matanot?.data;
  if (!product?.attributes?.ratson?.data?.id) return null;

  const pa = product.attributes;
  const project = sh.project?.data;
  const lines = buildDealLines({
    productName: pa.name,
    recipeMissions: pa.matanot_recipe_missions?.data ?? [],
    recipeResources: pa.matanot_recipe_resources?.data ?? [],
    missions: project?.attributes?.mesimabetahaliches?.data ?? []
  });

  // Recorded = the customer payments C-17 turned into the rikma's income. Committed adds
  // every transfer she has made on this deal: each one becomes such a record once both
  // sides confirm it, so the in-flight ones must not be asked for twice. What is *paid* is
  // neither: it is what the providers confirmed receiving (C-19, `computeDealDue`).
  const recorded = (sh.sales?.data ?? [])
    .filter((s: any) => String(s?.attributes?.externalId ?? '').startsWith(PAYMENT_KEY_PREFIX))
    .reduce((t: number, s: any) => t + (Number(s.attributes.in) || 0), 0);
  const committed = (sh.halukas?.data ?? []).reduce(
    (t: number, h: any) => t + (Number(h?.attributes?.amount) || 0),
    0
  );

  return {
    ...computeDealDue({
      lines,
      dealTotal: Number(sh.total) || null,
      recorded,
      committed,
      confirmed: readPartEntries(sh.iGotMoney)
        .filter((e) => e.iGotMoney)
        .map((e) => e.userId),
      settled: sh.moneyTransfered === true
    }),
    sheirutId: String(node.id ?? sheirutId),
    dealTotal: Number(sh.total) || 0,
    quant: Number(sh.quant) > 0 ? Number(sh.quant) : 1,
    projectId: project?.id != null ? String(project.id) : null,
    customerIds: (sh.users_permissions_users?.data ?? []).map((u: any) => String(u.id)),
    memberIds: (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id)),
    transfers: (sh.halukas?.data ?? []).map((h: any) => ({
      id: String(h.id),
      amount: Number(h?.attributes?.amount) || 0,
      senderId: relId(h?.attributes?.usersend),
      receiverId: relId(h?.attributes?.userrecive),
      senderconf: h?.attributes?.senderconf === true,
      confirmed: h?.attributes?.confirmed === true
    }))
  };
}
