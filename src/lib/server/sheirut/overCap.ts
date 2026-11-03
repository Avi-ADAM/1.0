/**
 * Hours above a deal part's ceiling wait for the customer — the server half of
 * `$lib/sheirut/overCap` (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §3.2).
 *
 * Three moments, one rule:
 *
 *  1. **An approval closes** (every member signed — `closeFiniapruval` — or the rikma's
 *     silence matured it — `timegrama/finiapp`). `capApproval` says how much of it fits
 *     under the part's ceiling. What fits is filed as always. What does not stays on the
 *     approval, open, with the rikma's clock closed: the rikma has said its yes, and the
 *     rest is the customer's to answer.
 *  2. **The customer is asked** (`askCustomerForOverrun`): an `editObject` proposal on the
 *     mission that raises the part by exactly the held value, in the provider's name (they
 *     claimed those hours). It is the same proposal a provider opens by hand to ask for
 *     more hours (§8.1 of PLAN_SHARE_BASIS_HOURS_VS_PRICE): it waits for her signature, her
 *     silence is not her yes, and she may counter with other hours or another rate.
 *  3. **The ceiling moves** (that proposal, or any other raise of the part, is applied —
 *     `signersFromDeal.onApplied`). `releaseHeldHours` files the held hours up to the new
 *     ceiling; whatever still does not fit stays held.
 *
 * Until then the held hours count nowhere: not in the shares, not on her bill. So the
 * money she pays is split by exactly the hours she agreed to pay for, and no other
 * provider of the deal is diluted by an overrun they never signed.
 *
 * Only a part of an at-cost wish deal has a ceiling. Every other mission files exactly as
 * before — and so does a part of a fixed-price deal: there an overrun is the rikma's own
 * risk, decided inside it, and the members' silence matures it as always (§3.2, P3).
 */

import { splitAtCap, isHeldForCustomer, type CapSplit } from '$lib/sheirut/overCap.js';
import { allSigned, standingVotes } from '$lib/finiapruval/rounds.js';
import { isHoursApproval } from '$lib/finiapruval/kind.js';
import { resolveRate } from '$lib/timers/rate.js';
import { roundHours, roundMoney } from '$lib/timers/precision.js';
import { fileApprovedHours } from '$lib/server/finiapruval/fileApproved.js';
import { fetchTarget } from '$lib/server/archive/targets.js';
import { openObjectChangeDecision } from '$lib/server/archive/decision.js';
import { setLifecycle, type StandingRound } from '$lib/server/archive/apply.js';
import type { Exec } from '$lib/server/archive/gql.js';
import { loadMissionDeal, type MissionDeal } from './dealEdit.js';
import type { QidRunner } from './dealDue.js';

export interface CappedApproval {
  deal: MissionDeal;
  split: CapSplit;
}

/**
 * How much of an approval fits under its part's ceiling — null for a mission that is not
 * a part of a wish deal (it files whole, as always). A deal that cannot be read throws:
 * "no customer" must never be the answer to a Strapi error, or the rikma alone would bill
 * her for hours she never agreed to.
 */
export async function capApproval(
  run: QidRunner,
  missionId: string | number | null | undefined,
  hours: number,
  rate: number
): Promise<CappedApproval | null> {
  if (missionId == null || missionId === '') return null;
  const deal = await loadMissionDeal(run, String(missionId));
  if (!deal || deal.track === 'fixed') return null;
  return { deal, split: splitAtCap({ cap: deal.cap, approved: deal.approved, hours, rate }) };
}

/**
 * The round that raises the part by the held value: the same rate, the hours that bring
 * the part's value to `cap + held` — so what she signs is exactly what is waiting.
 */
export function overrunRound(deal: MissionDeal, held: CapSplit, why: string): StandingRound {
  const rate = deal.missionRate;
  const target = deal.cap + held.overValue;
  const hm = rate > 0 ? roundHours(target / rate) : roundHours(deal.missionHours + held.overHours);
  return { ordern: 1, mode: 'keep', why, hm, price: null };
}

export function overrunWhy(held: CapSplit): string {
  const h = Math.round(held.overHours * 100) / 100;
  return `הרקמה אישרה ${h} שעות (${roundMoney(held.overValue)}) מעבר למחיר שסוכם על החלק הזה. הן מחכות לאישור הלקוחה: אפשר לאשר, או להציע שעות או תעריף אחרים.`;
}

/**
 * Open the proposal that asks her. Nothing is opened when the mission already has an open
 * proposal (a provider who asked by hand, or an earlier overrun still being negotiated):
 * the held hours simply wait on that one, and one negotiation at a time is the rule of
 * every object (`proposeObjectEdit`).
 */
export async function askCustomerForOverrun(
  exec: Exec,
  deal: MissionDeal,
  held: CapSplit,
  fallbackInitiator: string
): Promise<{ opened: boolean; decisionId: string | null }> {
  const target = await fetchTarget(exec, 'missionInProgress', deal.missionId);
  if (!target) return { opened: false, decisionId: null };
  if (target.openDecisionIds.length > 0) return { opened: false, decisionId: target.openDecisionIds[0] ?? null };

  const why = overrunWhy(held);
  const opened = await openObjectChangeDecision(exec, {
    kind: 'editObject',
    target,
    round: overrunRound(deal, held, why),
    scope: 'archive',
    source: 'user',
    why,
    // The provider claimed these hours — proposing is agreeing, and it is their claim.
    initiatorId: deal.providerId ?? fallbackInitiator,
    decisionName: `שעות מעבר למחיר שסוכם: ${target.name}`
  });
  await setLifecycle(exec, target.kind, target.id, 'archiveProposed').catch((e: unknown) =>
    console.warn('[overCap] marking archiveProposed failed (non-fatal):', e)
  );
  return { opened: true, decisionId: opened.decisionId };
}

/** Strapi errors must not read as "nothing held". */
function unwrap(res: any, what: string) {
  if (res?.errors?.length) throw new Error(`Could not read ${what}: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return res?.data ?? res ?? null;
}

/**
 * The part's ceiling moved: file what the customer's signature now covers. Each held
 * approval, oldest first, is split against the new headroom — what fits is filed (the
 * same rows `closeFiniapruval` writes) and the approval archived; what still does not fit
 * stays held with fewer hours.
 */
export async function releaseHeldHours(
  run: QidRunner,
  missionId: string
): Promise<{ filed: number; stillHeld: number }> {
  const deal = await loadMissionDeal(run, missionId);
  if (!deal) return { filed: 0, stillHeld: 0 };

  const list = unwrap(await run('468missionOpenFiniapruvals', { id: String(missionId) }), `the approvals of mission ${missionId}`);
  const rows: any[] = list?.finiapruvals?.data ?? [];

  let approved = deal.approved;
  let filed = 0;
  let stillHeld = 0;
  for (const row of rows) {
    const one = unwrap(await run('117getFiniapruvalForClose', { id: String(row.id) }), `approval ${row.id}`);
    const fini = one?.finiapruval?.data;
    const fa = fini?.attributes;
    if (!fa) continue;
    const memberIds: string[] = (fa.mesimabetahalich?.data?.attributes?.project?.data?.attributes?.user_1s?.data ?? []).map(
      (u: any) => String(u.id)
    );
    const held = isHeldForCustomer({
      archived: fa.archived,
      clockDone: row.attributes?.timegrama?.data?.attributes?.done ?? null,
      allMembersSigned: memberIds.length > 0 && allSigned(fa.vots ?? [], memberIds),
      standing: standingVotes(fa.vots ?? [])
    });
    if (!held) continue;

    const perhour = resolveRate(fa.perhour, fa.timer?.data?.attributes?.rate, fa.mesimabetahalich?.data?.attributes?.perhour);
    const hours = roundHours(fa.noofhours ?? 0);
    const split = splitAtCap({ cap: deal.cap, approved, hours, rate: perhour });
    if (split.inHours <= 0) {
      stillHeld += hours;
      continue;
    }

    await fileApprovedHours(run, {
      finiapruvalId: String(fini.id),
      fa,
      hours: split.inHours,
      perhour,
      isTimerSave: isHoursApproval(fa)
    });
    approved = roundMoney(approved + split.inHours * perhour);
    filed += split.inHours;

    if (split.overHours > 0) {
      unwrap(await run('386counterFiniapruval', { id: String(fini.id), vots: keepVots(fa.vots), noofhours: split.overHours }), 'the held approval');
      stillHeld += split.overHours;
    } else {
      unwrap(await run('118updateFiniapruvalVots', { id: String(fini.id), vots: keepVots(fa.vots), archived: true }), 'the released approval');
    }
  }
  return { filed: roundHours(filed), stillHeld: roundHours(stillHeld) };
}

/** Votes as qid 117 reads them, in the shape a write takes back — nothing dropped. */
export function keepVots(vots: any[] | null | undefined): any[] {
  return (vots ?? []).map((v: any) => ({
    what: v.what,
    users_permissions_user: v.users_permissions_user?.data?.id ?? v.users_permissions_user ?? null,
    ...(v.why ? { why: v.why } : {}),
    ...(v.order != null ? { order: v.order } : {}),
    ...(v.ide != null ? { ide: v.ide } : {}),
    ...(v.zman ? { zman: v.zman } : {})
  }));
}
