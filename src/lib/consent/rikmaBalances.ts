/**
 * A member's balance IN ONE RIKMA, as Strapi has paid it out — the value the
 * Space projection's `balances` is compared against (T2/A3) and imported
 * from (T6 genesis).
 *
 * Decided 2026-10-30 (PLAN_DISTRIBUTED_EXECUTION, A2 "balances finding"): a
 * balance is money that came from this rikma's splits, nothing else. Not
 * `User.hervachti` — that is one number per user summed over every rikma
 * they are in, so comparing a rikma's balance with it made every member of
 * two rikmas a standing mismatch, and checking it would make one rikma's
 * numbers depend on another's.
 *
 * The rules mirror exactly where Strapi moves `hervachti` for a split:
 *   - when the split is approved (applyTosplitApproval / hervachDeltasFrom):
 *     every entry that is neither the giver (`noten`) nor the receiver
 *     (`mekabel`) of a transfer;
 *   - when its last transfer is confirmed by the receiver (confirmHaluka):
 *     the giver and receiver entries.
 * Amounts are summed per entry in agorot, so float error never accumulates.
 * Like Strapi, the entry's currency is not converted.
 */

export interface SplitEntryRow {
  member: string;
  /** shekels as Strapi stores the component (float, nullable) */
  amount: number | null | undefined;
  noten?: boolean | null;
  mekabel?: boolean | null;
}

export interface SplitRow {
  finished: boolean | null | undefined;
  entries: SplitEntryRow[];
  /** `confirmed` of each transfer (Haluka) in the split */
  halukasConfirmed: boolean[];
}

const toAgorot = (amount: number | null | undefined): bigint =>
  typeof amount === 'number' && Number.isFinite(amount) ? BigInt(Math.round(amount * 100)) : 0n;

/** member id → agorot, for every member any split credited. */
export function rikmaSplitBalances(splits: Iterable<SplitRow>): Map<string, bigint> {
  const out = new Map<string, bigint>();
  const add = (member: string, agorot: bigint) => {
    if (!member || agorot === 0n) return;
    out.set(member, (out.get(member) ?? 0n) + agorot);
  };

  for (const split of splits) {
    const transfersDone =
      split.halukasConfirmed.length > 0 && split.halukasConfirmed.every((c) => c === true);
    for (const e of split.entries) {
      const isTransferSide = e.noten === true || e.mekabel === true;
      if (isTransferSide ? transfersDone : split.finished === true) add(e.member, toAgorot(e.amount));
    }
  }
  return out;
}
