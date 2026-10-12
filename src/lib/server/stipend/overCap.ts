/**
 * The over-cap balance of one pledge, read from the ledger.
 *
 * Hours the monthly ceiling held back are not lost and not stored anywhere:
 * the settlement metered only the hours it paid for, so they are simply the
 * approved hours behind the watermark that no payment row has metered
 * (`computeOverCapBalance`). One reader, so the pay card, the recipient's card
 * and the action that settles the balance all see the same number.
 */

import type { Exec } from '$lib/server/archive/gql.js';
import {
  computeOverCapBalance,
  computeStipendCycle,
  cycleWindow,
  settlementFrom,
  type CycleResult,
  type OverCapBalance
} from '$lib/stipend/computeStipendCycle.js';
import { fetchApprovedHours, fetchMeteredHours } from './read.js';

export async function readOverCapBalance(
  exec: Exec,
  pledge: {
    projectId: string | null;
    recipientId: string | null;
    lastSettledAt?: string | null;
    paidTotal?: number | null;
    missionIds?: string[] | null;
    terms: any;
  },
  opts: { programRemaining?: number | null; equityHeadroom?: number | null } = {}
): Promise<OverCapBalance> {
  const empty: OverCapBalance = { hours: 0, amount: 0, cappedBy: null, cycleStart: null, cycleEnd: null };
  // Nothing settled yet ⇒ every approved hour is still in the open window.
  if (!pledge.projectId || !pledge.recipientId || !pledge.lastSettledAt) return empty;
  // Only a pledge with a ceiling can have held anything back.
  if (pledge.terms?.monthlyCap == null) return empty;

  const start = pledge.terms?.start ?? null;
  const [approved, meteredBefore] = await Promise.all([
    fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, start),
    fetchMeteredHours(exec, pledge.projectId, pledge.recipientId, start, pledge.lastSettledAt)
  ]);
  return computeOverCapBalance({
    terms: pledge.terms,
    approved,
    start,
    watermark: pledge.lastSettledAt,
    meteredBefore,
    paidTotal: pledge.paidTotal ?? 0,
    programRemaining: opts.programRemaining ?? null,
    missionIds: pledge.terms?.scope === 'allMissions' ? null : pledge.missionIds ?? null,
    equityHeadroom: opts.equityHeadroom ?? null
  });
}

/**
 * The open window as the settlement would read it right now — the same
 * inputs `settleStipendCycle` and `getStipendWork` use — so a decision on the
 * hours the ceiling is holding back *this* window acts on the same numbers the
 * card showed.
 */
export async function readOpenWindow(
  exec: Exec,
  pledge: {
    projectId: string | null;
    recipientId: string | null;
    lastSettledAt?: string | null;
    paidTotal?: number | null;
    missionIds?: string[] | null;
    terms: any;
  },
  opts: { programRemaining?: number | null; equityHeadroom?: number | null } = {}
): Promise<{ from: string; cycleEnd: string; cycle: CycleResult } | null> {
  if (!pledge.projectId || !pledge.recipientId) return null;
  const window = cycleWindow(new Date(), pledge.terms?.cycleSize ?? 1);
  const from = settlementFrom({ lastSettledAt: pledge.lastSettledAt, start: pledge.terms?.start }, window.cycleStart);
  const [approved, metered] = await Promise.all([
    fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from),
    fetchMeteredHours(exec, pledge.projectId, pledge.recipientId, from)
  ]);
  const cycle = computeStipendCycle({
    terms: pledge.terms,
    approved,
    cycleStart: from,
    cycleEnd: window.cycleEnd,
    paidTotal: pledge.paidTotal ?? 0,
    programRemaining: opts.programRemaining ?? null,
    missionIds: pledge.terms?.scope === 'allMissions' ? null : pledge.missionIds ?? null,
    hoursAlreadyMetered: metered,
    equityHeadroom: opts.equityHeadroom ?? null
  });
  return { from, cycleEnd: window.cycleEnd, cycle };
}
