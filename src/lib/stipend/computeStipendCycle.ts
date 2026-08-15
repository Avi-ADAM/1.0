/**
 * computeStipendCycle — how much is due for one cycle (PLAN_STIPEND §6).
 *
 * The funder never types a number. The amount is derived from hours that were
 * **approved** (a closed `finiapruval`), never from hours merely logged: if the
 * approval is later refused, money has already been paid for work the rikma
 * did not recognise, and there is no elegant way back.
 *
 *     amount = min(hours × rate, monthlyCap, remaining totalCap, program cap)
 */

import type { PartialStipendTerms } from './types.js';
import { normalizeTerms } from './computeStipendEquity.js';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** One approved chunk of work inside the cycle window. */
export interface ApprovedHours {
  /** Hours the rikma approved. */
  hours: number;
  /** When they were approved — decides which cycle they fall into. */
  approvedAt: string | Date;
  /** Market rate on the mission, used for the rate ≤ market guard. */
  perhour?: number | null;
  /** Mission the hours belong to, for a `singleMission`/`selectedMissions` pledge. */
  mesimabetahalichId?: string | null;
}

export interface CycleInput {
  terms: PartialStipendTerms;
  /** Everything approved for this recipient in this rikma. */
  approved: ApprovedHours[];
  cycleStart: string | Date;
  cycleEnd: string | Date;
  /** ₪ already paid under this pledge. */
  paidTotal?: number | null;
  /** ₪ left in the program's budget, when the pledge sits inside one. */
  programRemaining?: number | null;
  /** Missions the pledge covers — empty/undefined means "all of them". */
  missionIds?: string[] | null;
}

export interface CycleResult {
  /** Approved hours that fall inside the window and inside the pledge's scope. */
  hours: number;
  /** hours × rate, before any cap. */
  gross: number;
  /** What is actually due. */
  amount: number;
  /** Which limit bit, when `amount < gross`. */
  cappedBy: 'monthlyCap' | 'totalCap' | 'programCap' | null;
  /** ₪ left under the pledge's own totalCap after this payment. */
  remainingAfter: number | null;
  /** True when this payment exhausts the pledge — it closes itself (§6). */
  exhausts: boolean;
}

function toTime(v: string | Date | null | undefined): number {
  if (v == null) return NaN;
  const d = v instanceof Date ? v : new Date(String(v));
  return d.getTime();
}

export function computeStipendCycle(input: CycleInput): CycleResult {
  const terms = normalizeTerms(input.terms);
  const from = toTime(input.cycleStart);
  const to = toTime(input.cycleEnd);
  const scopeIds = input.missionIds && input.missionIds.length > 0 ? new Set(input.missionIds.map(String)) : null;

  let hours = 0;
  for (const a of input.approved ?? []) {
    const at = toTime(a.approvedAt);
    if (!Number.isFinite(at)) continue;
    if (Number.isFinite(from) && at < from) continue;
    if (Number.isFinite(to) && at > to) continue;
    if (scopeIds && !scopeIds.has(String(a.mesimabetahalichId ?? ''))) continue;
    const h = Number(a.hours);
    if (Number.isFinite(h) && h > 0) hours += h;
  }

  hours = round2(hours);
  const gross = round2(hours * terms.stipendRate);

  const paidTotal = Math.max(0, Number(input.paidTotal ?? 0) || 0);
  const totalRemaining =
    terms.totalCap == null ? null : Math.max(0, round2(terms.totalCap - paidTotal));
  const programRemaining =
    input.programRemaining == null ? null : Math.max(0, Number(input.programRemaining) || 0);

  // Smallest binding limit wins, and we remember which one so the card can say
  // "this is the last cycle" rather than silently paying less than the hours.
  let amount = gross;
  let cappedBy: CycleResult['cappedBy'] = null;
  const limits: Array<[number, CycleResult['cappedBy']]> = [];
  if (terms.monthlyCap != null) limits.push([terms.monthlyCap, 'monthlyCap']);
  if (totalRemaining != null) limits.push([totalRemaining, 'totalCap']);
  if (programRemaining != null) limits.push([programRemaining, 'programCap']);
  for (const [limit, name] of limits) {
    if (amount > limit) {
      amount = limit;
      cappedBy = name;
    }
  }
  amount = round2(Math.max(0, amount));

  const remainingAfter = totalRemaining == null ? null : round2(Math.max(0, totalRemaining - amount));

  return {
    hours,
    gross,
    amount,
    cappedBy: amount < gross ? cappedBy : null,
    remainingAfter,
    exhausts:
      (remainingAfter != null && remainingAfter <= 0) ||
      (programRemaining != null && programRemaining - amount <= 0)
  };
}

/**
 * The cycle window a settlement belongs to. `cycleSize` is in months, matching
 * the recurring `mashabetahalich` that carries the pledge's life cycle.
 */
export function cycleWindow(
  reference: string | Date,
  cycleSize = 1
): { cycleStart: string; cycleEnd: string } {
  const ref = reference instanceof Date ? new Date(reference) : new Date(String(reference));
  const size = Math.max(1, Math.round(Number(cycleSize) || 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1);
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - (size - 1), 1, 0, 0, 0, 0));
  return { cycleStart: start.toISOString(), cycleEnd: end.toISOString() };
}
