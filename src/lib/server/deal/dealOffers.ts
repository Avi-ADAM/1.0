/**
 * The parts of a deal still open in its rikma, as the deal page shows them (QA C-19).
 *
 * Read from qid 417: the deal's product → its unassigned BOM lines → the open mission /
 * open resource on each → the live candidacies, with their rounds and votes. Each
 * candidacy is run through the same gate the finalizers use (`computeNegoGate` with the
 * deal's customers as `clientIds`), so what the page says about who still has to sign
 * is exactly what decides whether it materializes.
 */

import { computeNegoGate, normId } from '$lib/server/nego/negoGate.js';

export type { DealCandidacyView, DealOpenOfferView, DealOffersView } from '$lib/sheirut/dealOffers.js';
import type { DealCandidacyView, DealOpenOfferView, DealOffersView } from '$lib/sheirut/dealOffers.js';

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

function candidacy(
  side: 'ask' | 'askm',
  node: any,
  base: { amount: number; unitPrice: number },
  ctx: { memberIds: string[]; clientIds: string[]; viewerId: string }
): DealCandidacyView {
  const a = node?.attributes ?? {};
  const rawRounds: any[] = (side === 'ask' ? a.negopendmissions?.data : a.nego_mashes?.data) ?? [];
  const rounds = rawRounds.map((r) => r?.attributes ?? {});
  // Sorted ordern:desc by the query; take the max defensively.
  const latest = rounds.reduce<any>((best, r) => (!best || num(r.ordern) > num(best.ordern) ? r : best), null);
  const amount = side === 'ask' ? (latest?.noofhours ?? base.amount) : (latest?.hm ?? base.amount);
  const unitPrice = side === 'ask' ? (latest?.perhour ?? base.unitPrice) : (latest?.price ?? base.unitPrice);
  const vots = (a.vots ?? []).map((v: any) => ({ what: v?.what, order: v?.order, users_permissions_user: normId(v?.users_permissions_user) }));
  const user = a.users_permissions_user?.data;
  const gate = computeNegoGate({
    rounds: rounds.map((r) => ({ ordern: r.ordern, proposedBy: r.proposedBy })),
    vots,
    takerId: user?.id,
    memberIds: ctx.memberIds,
    clientIds: ctx.clientIds
  });
  return {
    side,
    id: String(node.id),
    candidateId: user?.id != null ? String(user.id) : '',
    candidateName: user?.attributes?.username ?? '',
    candidatePic: user?.attributes?.profilePic?.data?.attributes?.url ?? null,
    amount: num(amount),
    unitPrice: num(unitPrice),
    price: r2(num(amount) * num(unitPrice)),
    round: gate.L,
    signedByViewer: ctx.clientIds.includes(ctx.viewerId) && !gate.clientsPending.includes(ctx.viewerId),
    clientsPending: gate.clientsPending.length,
    membersSigned: gate.hasPMyes,
    candidateAgreed: gate.takerYes,
    approvable: gate.approvable
  };
}

/** `res` is qid 417's answer, through `strapi.execute` (`{ data: { sheirut } }`) or the proxy (`{ sheirut }`). */
export function readDealOffers(res: any, viewerId: string): DealOffersView {
  const sh = (res?.data?.sheirut ?? res?.sheirut)?.data?.attributes ?? {};
  const customerIds = (sh.users_permissions_users?.data ?? []).map((u: any) => String(u.id));
  const memberIds = (sh.project?.data?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
  const ctx = { memberIds, clientIds: customerIds, viewerId: String(viewerId) };
  const product = sh.matanot?.data?.attributes ?? {};
  const offers: DealOpenOfferView[] = [];

  for (const line of product.matanot_recipe_missions?.data ?? []) {
    const la = line?.attributes ?? {};
    if (la.assignedMember?.data?.id) continue;
    const om = la.pendm?.data?.attributes?.open_mission?.data;
    if (!om?.id || om.attributes?.archived === true) continue;
    const base = { amount: num(om.attributes?.noofhours), unitPrice: num(om.attributes?.perhour) };
    offers.push({
      kind: 'mission',
      offerId: String(om.id),
      name: om.attributes?.name ?? '',
      ...base,
      candidacies: (om.attributes?.asks?.data ?? []).map((n: any) => candidacy('ask', n, base, ctx))
    });
  }
  for (const line of product.matanot_recipe_resources?.data ?? []) {
    const la = line?.attributes ?? {};
    if (la.assignedMember?.data?.id) continue;
    const om = la.pmash?.data?.attributes?.open_mashaabim?.data;
    if (!om?.id || om.attributes?.archived === true) continue;
    const base = { amount: num(om.attributes?.hm) || 1, unitPrice: num(om.attributes?.price) };
    offers.push({
      kind: 'resource',
      offerId: String(om.id),
      name: om.attributes?.name ?? '',
      ...base,
      candidacies: (om.attributes?.askms?.data ?? []).map((n: any) => candidacy('askm', n, base, ctx))
    });
  }
  return { customerIds, offers };
}
