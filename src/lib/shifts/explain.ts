/**
 * explain — every placement is said in words (docs/PLAN_SHIFTS.md §1.5, §6.6).
 *
 * Without a manager and without a majority, the only thing that holds a
 * roster is that everyone can see why it came out the way it did. These map
 * the codes the algorithm records to `$t()` keys in the `shifts` namespace.
 */

import type { ReasonCode, Stance } from './types.js';

export const REASON_CODES: readonly ReasonCode[] = [
  'onlyCandidate',
  'wanted',
  'ownPreference',
  'belowQuota',
  'owed',
  'declaredFirst',
  'tieBreak',
  'overQuota',
  'backup',
  'volunteered',
  'swapped',
  'cover'
];

export const STANCES: readonly Stance[] = ['want', 'can', 'ifNeeded', 'cannot'];

/** `shifts.reason.<code>`; an unknown code (an old row, a typo) reads as the neutral tie-break. */
export function reasonKey(code: string | null | undefined): string {
  return `shifts.reason.${REASON_CODES.includes(code as ReasonCode) ? code : 'tieBreak'}`;
}

export function stanceKey(stance: Stance): string {
  return `shifts.stance.${stance}`;
}

/**
 * The next stance when a member taps a cell: want → can → ifNeeded → cannot → want.
 *
 * There is no way back to "no answer": `shift-availability` is never deleted
 * (no role has `delete` on it), and `cannot` already says everything an empty
 * cell would — more, since it tells the rikma the question was seen.
 */
export function nextStance(current: Stance | null | undefined): Stance {
  switch (current) {
    case 'want':
      return 'can';
    case 'can':
      return 'ifNeeded';
    case 'ifNeeded':
      return 'cannot';
    default:
      return 'want';
  }
}

export type QuotaExplanation = 'equalShare' | 'cappedByMax' | 'raisedToMin' | 'cappedByAvailability' | 'belowMin';

/**
 * Why a member's quota is what it is — the sentence under their fairness bar.
 *
 * `level` and `carry` come from the quota result: the member's natural share
 * is `level − carry`, the amount everyone unbounded got. Only when their
 * bounds actually moved them off it is the quota "capped" or "raised" —
 * otherwise it is the equal share, even if it happens to equal a bound.
 */
export function explainQuota(args: {
  quota: number;
  lo: number;
  hi: number;
  level: number;
  carry: number;
  max?: number | null;
  available: number;
  belowMin: boolean;
}): QuotaExplanation {
  if (args.belowMin) return 'belowMin';
  const natural = args.level - args.carry;
  if (args.hi < natural && args.quota >= args.hi) {
    return args.max != null && args.max <= args.available ? 'cappedByMax' : 'cappedByAvailability';
  }
  if (args.lo > natural && args.quota <= args.lo) return 'raisedToMin';
  return 'equalShare';
}
