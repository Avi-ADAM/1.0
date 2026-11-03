/**
 * Hours above a deal part's ceiling wait for the customer — the overrun rule
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §3.2).
 *
 * A wish deal is billed by the hours its rikma approves, up to the price the customer
 * agreed for each part (`./dealDue`). The ceiling is a **consent threshold**, not a
 * transfer of risk to the providers: up to it she signed in advance, above it every
 * shekel needs her signature (`./dealEdit`).
 *
 * Before this rule, hours the rikma approved above the ceiling went straight into the
 * shares while the customer was never billed for them — so the money she paid was split
 * by hours she did not buy, and the *other providers* of the deal paid for the overrun,
 * usually by staying silent on an approval. Now an approval that would cross the ceiling
 * files only the hours that fit; the rest stays on the approval, **held**, until the
 * customer agrees to raise the part (an `editObject` she signs). When she does, the held
 * hours are filed up to the new ceiling (`releaseHeldHours`).
 *
 * Pure: the vote path, the silence path and the release all split the same way.
 */

import { MINUTE_HOURS, isRealOverrun, roundHours, roundMoney } from '$lib/timers/precision.js';

export interface CapSplitInput {
  /** The price she agreed for the part — the ceiling. */
  cap: number;
  /** Σ value already filed on the part (`FinnishedMission.total` of its mission). */
  approved: number;
  /** The hours this approval files. */
  hours: number;
  /** The rate they were worked at. */
  rate: number;
}

export interface CapSplit {
  /** Hours that fit under the ceiling — filed now. */
  inHours: number;
  /** Hours above it — held for the customer. 0 = nothing to hold. */
  overHours: number;
  /** What was left of the ceiling before this approval. */
  headroom: number;
  /** What the held hours are worth at their rate. */
  overValue: number;
}

function nonNeg(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Whole minutes, rounded *down* — what fits must never cross the ceiling by rounding. */
function floorMinutes(hours: number): number {
  return roundHours(Math.floor(hours * 60 + 1e-9) / 60);
}

export function splitAtCap(input: CapSplitInput): CapSplit {
  const hours = roundHours(nonNeg(input.hours));
  const rate = nonNeg(input.rate);
  const headroom = roundMoney(Math.max(0, nonNeg(input.cap) - nonNeg(input.approved)));
  const all: CapSplit = { inHours: hours, overHours: 0, headroom, overValue: 0 };

  // Work valued at nothing cannot cost her anything.
  if (rate === 0 || hours === 0) return all;

  const inHours = Math.min(hours, floorMinutes(headroom / rate));
  const overHours = roundHours(hours - inHours);
  const overValue = roundMoney(overHours * rate);
  // A clock's seconds or a float's last digit are nobody's claim (`isRealOverrun`):
  // under 1 ₪ or under a minute, the whole approval files as it is.
  if (overHours < MINUTE_HOURS - 1e-9 || !isRealOverrun(overValue, rate)) return all;
  return { inHours, overHours, headroom, overValue };
}

/** Vote shape as Finiapruval stores it — only what this module reads. */
export interface HeldVote {
  what?: boolean | null;
  order?: number | null;
}

/**
 * An approval is **held for the customer** when the rikma is done with it but it is still
 * open: every member signed the version on the table, or the rikma's silence clock on it
 * was closed — and nobody objects to that version. That is exactly the state the overrun
 * rule leaves it in. An approval the rikma is still deciding has a running clock and is
 * missing a signature; a disputed one has a "no" on its standing round.
 *
 * Both halves matter: releasing an approval the members never consented to would let a
 * raise she signed bypass the rikma.
 */
export function isHeldForCustomer(f: {
  archived?: boolean | null;
  clockDone?: boolean | null;
  allMembersSigned?: boolean | null;
  standing: HeldVote[];
}): boolean {
  if (f.archived) return false;
  if (f.standing.some((v) => v.what === false)) return false;
  return f.clockDone === true || f.allMembersSigned === true;
}
