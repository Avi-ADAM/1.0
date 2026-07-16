/**
 * computeCoverage — the pure math behind the public support page and the
 * moach coverage board (PLAN_VOLUNTEER_RIKMA §1, §3).
 *
 * The model: every contributor works at their *ideal hourly rate*, so all
 * completed work carries full value. Income (donations + product sales)
 * covers that accumulated value over time. This function answers, from raw
 * project data:
 *
 *  - how much value was created (done) and how much is planned (open missions)
 *  - how much income arrived, split by source (donations / products / other)
 *  - what part of the done value is already covered (the coverage ratio)
 *  - which open missions are already funded — i.e. whoever performs them
 *    gets paid right at completion — allocated greedily after the existing
 *    backlog is covered
 *  - the supporter wall (named donors, newest first)
 *
 * Only *effective* sales count (PLAN_sale_holder_consent): holderStatus of
 * `self`, `confirmed`, or null (legacy, grandfathered) — never `open`.
 */

import { parseDonationNote } from './parseDonationNote';
import { isSiteShareNote } from './parseSiteShareNote';

export interface CoverageFinishedMission {
  /** Precomputed value (noofhours × perhour) when present. */
  total?: number | null;
  noofhours?: number | null;
  perhour?: number | null;
}

export interface CoverageSale {
  in?: number | null;
  note?: string | null;
  holderStatus?: string | null;
  /** True when the Sale has a linked product (matanot). */
  hasProduct?: boolean;
  /** ISO date, used only to order the supporter wall. */
  date?: string | null;
}

export interface CoverageHaluka {
  amount?: number | null;
  confirmed?: boolean | null;
}

export interface CoverageOpenMission {
  id: string;
  name?: string | null;
  noofhours?: number | null;
  perhour?: number | null;
  /** True when someone is already assigned to perform it. */
  assigned?: boolean;
}

export interface CoverageInput {
  finishedMissions: CoverageFinishedMission[];
  sales: CoverageSale[];
  halukas: CoverageHaluka[];
  openMissions: CoverageOpenMission[];
}

export interface CoverageMissionStatus {
  id: string;
  name: string | null;
  /** noofhours × perhour, 0 when either is missing. */
  value: number;
  assigned: boolean;
  /** True ⇒ performing it now ends with immediate payment. */
  funded: boolean;
}

export interface SupporterEntry {
  /** Public display name; null = anonymous (rendered as such, still listed). */
  name: string | null;
  amount: number;
  msg: string | null;
  date: string | null;
}

export interface CoverageResult {
  /** Σ value of all completed work (the ledger's "done & invested"). */
  doneValue: number;
  /** Σ confirmed halukas — value already paid out to members. */
  paidOut: number;
  /** done value not yet paid out (the backlog donations cover first). */
  backlog: number;
  /** Σ effective income, by source. */
  incomeTotal: number;
  donationIncome: number;
  productIncome: number;
  otherIncome: number;
  /** incomeTotal / doneValue, clamped to [0,1]. 0 when nothing was done. */
  coverageRatio: number;
  /** Income that arrived but was not yet paid out. */
  pool: number;
  /** What remains of the pool after the backlog — funds future missions. */
  availableForFuture: number;
  /** Σ value of open missions, split by having a performer. */
  plannedAssignedValue: number;
  plannedOpenValue: number;
  /** Open missions in input order, each with its funding status. */
  missions: CoverageMissionStatus[];
  /** Effective donations, newest first. */
  supporters: SupporterEntry[];
}

const EFFECTIVE_HOLDER_STATUSES = new Set(['self', 'confirmed']);

function isEffective(sale: CoverageSale): boolean {
  const hs = sale.holderStatus;
  // null/undefined = legacy sale predating holder consent — grandfathered.
  return hs == null || EFFECTIVE_HOLDER_STATUSES.has(hs);
}

function num(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function missionValue(m: {
  noofhours?: number | null;
  perhour?: number | null;
}): number {
  return num(m.noofhours) * num(m.perhour);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeCoverage(input: CoverageInput): CoverageResult {
  const doneValue = input.finishedMissions.reduce((sum, fm) => {
    const total = num(fm.total);
    return sum + (total > 0 ? total : missionValue(fm));
  }, 0);

  const paidOut = input.halukas.reduce(
    (sum, h) => sum + (h.confirmed ? num(h.amount) : 0),
    0
  );

  let donationIncome = 0;
  let productIncome = 0;
  let otherIncome = 0;
  const supporters: SupporterEntry[] = [];

  for (const sale of input.sales) {
    if (!isEffective(sale)) continue;
    const amount = num(sale.in);
    const donation = parseDonationNote(sale.note);
    if (donation) {
      donationIncome += amount;
      supporters.push({
        name: donation.from,
        amount,
        msg: donation.msg,
        date: sale.date ?? null
      });
    } else if (sale.hasProduct) {
      productIncome += amount;
    } else if (isSiteShareNote(sale.note)) {
      // Site-share paid *to* this rikma for service it provided — income,
      // but neither a donation nor a product sale.
      otherIncome += amount;
    } else {
      otherIncome += amount;
    }
  }

  const incomeTotal = donationIncome + productIncome + otherIncome;
  const coverageRatio =
    doneValue > 0 ? Math.min(1, incomeTotal / doneValue) : 0;

  const backlog = Math.max(0, doneValue - paidOut);
  const pool = Math.max(0, incomeTotal - paidOut);
  const availableForFuture = Math.max(0, pool - backlog);

  // Greedy allocation in the given order: the backlog is covered first, then
  // whatever remains funds open missions one by one. A zero-value mission
  // (no hours/rate yet) is never marked funded — there is nothing to fund.
  let remaining = availableForFuture;
  let plannedAssignedValue = 0;
  let plannedOpenValue = 0;
  const missions: CoverageMissionStatus[] = input.openMissions.map((m) => {
    const value = missionValue(m);
    const assigned = m.assigned === true;
    if (assigned) plannedAssignedValue += value;
    else plannedOpenValue += value;
    const funded = value > 0 && value <= remaining;
    if (funded) remaining -= value;
    return { id: m.id, name: m.name ?? null, value: round2(value), assigned, funded };
  });

  supporters.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return {
    doneValue: round2(doneValue),
    paidOut: round2(paidOut),
    backlog: round2(backlog),
    incomeTotal: round2(incomeTotal),
    donationIncome: round2(donationIncome),
    productIncome: round2(productIncome),
    otherIncome: round2(otherIncome),
    coverageRatio,
    pool: round2(pool),
    availableForFuture: round2(availableForFuture),
    plannedAssignedValue: round2(plannedAssignedValue),
    plannedOpenValue: round2(plannedOpenValue),
    missions,
    supporters
  };
}
