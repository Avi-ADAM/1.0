// Quorum proofs — verify that a set of events constitutes consent under a rule.
//
// The QuorumProof attached to a consensus event (PLAN_rikma_as_state_machine §4)
// is a self-contained witness that the consensus rule was satisfied. Anyone can
// verify it in O(|evidence|) without re-running the full projection.
//
// Rules supported:
//   - unanimous       : every member of the eligible set voted yes (head count)
//   - majority        : > half of the eligible set voted yes
//   - k-of-n          : at least k yes votes (k specified in rule.params)
//   - agreers-only    : at least 1 yes vote, no nos (used by Ratson §3.0)
//   - timeout         : deadline passed AND no counter-proposal exists
//                       (full validation lives in PLAN_restime_in_signed_chain;
//                        the proof here only carries the receipts)
//   - weighted-unanimous-positive
//                     : every member with weight > 0 voted yes; zero-weight
//                       members ignored. **Default for rikmas under D-13/D-14**:
//                       weight = Σ FinnishedMission.total + Σ Rikmash.total
//                       (in agorot). Members who committed to a mission but
//                       haven't completed any have zero weight → cannot block.
//   - weighted-threshold
//                     : Σ weight(yes voters) × 10000 ≥ thresholdBps × Σ weight(all)
//                       For 2/3 use thresholdBps=6667; for 50%+1 use 5001.

import type { ConsentEvent } from './event';

export type QuorumRule =
  | { kind: 'unanimous' }
  | { kind: 'majority' }
  | { kind: 'k-of-n'; k: number }
  | { kind: 'agreers-only' }
  | { kind: 'timeout'; expectedEnd: number; clockTolerance: number }
  | { kind: 'weighted-unanimous-positive' }
  | { kind: 'weighted-threshold'; thresholdBps: number };

export type QuorumProof = {
  rule: QuorumRule;
  evidence: string[];        // event ids that constitute the proof
  reachingActor?: string;    // who pushed it over the threshold (audit)
  attestedTs?: number;       // signer's wall clock at proof emission
  dagHeadId?: string;        // the DAG head the signer observed (for timeout)
};

export type QuorumContext = {
  eligibleMembers: Set<string>;       // who's allowed to vote on this subject
  events: Map<string, ConsentEvent>;  // events the verifier can resolve
  voteAction: string;                 // e.g. 'tosplit.vote', 'mission.approve.vote'
  yesPredicate?: (ev: ConsentEvent) => boolean;  // default: predicate.what === true

  /**
   * Per-member voting weight in agorot (D-13). Required for `weighted-*` rules.
   * Members not present in the map are treated as zero-weight (committed but
   * not delivered — cannot block per the user's clarification).
   */
  memberWeights?: Map<string, bigint>;
};

export type QuorumResult =
  | { ok: true; agreers: string[]; reachingActor?: string; reason?: undefined }
  | { ok: false; reason: string };

function defaultIsYes(ev: ConsentEvent): boolean {
  return Boolean((ev.predicate as { what?: unknown } | undefined)?.what);
}

// Collect the latest vote per actor from the evidence set. (Re-votes use the
// last-by-ts; same dedupe rule as the projection.)
function collectVotes(
  proof: QuorumProof,
  ctx: QuorumContext
): { yesActors: Set<string>; noActors: Set<string>; reason?: string } {
  const isYes = ctx.yesPredicate ?? defaultIsYes;
  const latest = new Map<string, ConsentEvent>();
  for (const id of proof.evidence) {
    const ev = ctx.events.get(id);
    if (!ev) return { yesActors: new Set(), noActors: new Set(), reason: `missing_evidence:${id}` };
    if (ev.action !== ctx.voteAction) {
      // Allow rule-specific contextual events (the subject's creation, the round
      // start, etc.) to be referenced without counting as votes — they're skipped.
      continue;
    }
    if (!ctx.eligibleMembers.has(ev.actor)) {
      return { yesActors: new Set(), noActors: new Set(), reason: `ineligible_voter:${ev.actor}` };
    }
    const cur = latest.get(ev.actor);
    if (!cur || ev.ts > cur.ts) latest.set(ev.actor, ev);
  }
  const yesActors = new Set<string>();
  const noActors = new Set<string>();
  for (const [actor, ev] of latest) {
    if (isYes(ev)) yesActors.add(actor);
    else noActors.add(actor);
  }
  return { yesActors, noActors };
}

export function verifyQuorum(proof: QuorumProof, ctx: QuorumContext): QuorumResult {
  switch (proof.rule.kind) {
    case 'unanimous': {
      const { yesActors, noActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };
      if (noActors.size > 0) return { ok: false, reason: 'has_no_vote' };
      const allVoted = [...ctx.eligibleMembers].every((m) => yesActors.has(m));
      if (!allVoted) return { ok: false, reason: 'not_unanimous' };
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'majority': {
      const { yesActors, noActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };
      const threshold = Math.floor(ctx.eligibleMembers.size / 2) + 1;
      if (yesActors.size < threshold) {
        return { ok: false, reason: `below_majority:${yesActors.size}/${threshold}` };
      }
      void noActors;
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'k-of-n': {
      const { yesActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };
      const k = proof.rule.k;
      if (yesActors.size < k) {
        return { ok: false, reason: `below_k:${yesActors.size}/${k}` };
      }
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'agreers-only': {
      const { yesActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };
      if (yesActors.size === 0) return { ok: false, reason: 'no_agreers' };
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'timeout': {
      // Local check only: did enough time pass? Absence-of-counter is verified
      // separately at ingest time (PLAN_restime_in_signed_chain §5).
      const attested = proof.attestedTs;
      if (typeof attested !== 'number') {
        return { ok: false, reason: 'timeout_needs_attestedTs' };
      }
      const { expectedEnd, clockTolerance } = proof.rule;
      if (attested < expectedEnd - clockTolerance) {
        return { ok: false, reason: 'timeout_too_early' };
      }
      const { yesActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'weighted-unanimous-positive': {
      if (!ctx.memberWeights) return { ok: false, reason: 'missing_weights' };
      const { yesActors, noActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };

      // Any "no" from a positive-weight member breaks unanimity.
      for (const noVoter of noActors) {
        const w = ctx.memberWeights.get(noVoter) ?? 0n;
        if (w > 0n) return { ok: false, reason: 'positive_no_vote:' + noVoter };
      }

      // Every positive-weight eligible member must have a "yes" on record.
      const missing: string[] = [];
      for (const member of ctx.eligibleMembers) {
        const w = ctx.memberWeights.get(member) ?? 0n;
        if (w > 0n && !yesActors.has(member)) missing.push(member);
      }
      if (missing.length > 0) {
        return { ok: false, reason: 'positive_missing_vote:' + missing.join(',') };
      }
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    case 'weighted-threshold': {
      if (!ctx.memberWeights) return { ok: false, reason: 'missing_weights' };
      const { yesActors, reason } = collectVotes(proof, ctx);
      if (reason) return { ok: false, reason };

      let yesWeight = 0n;
      for (const a of yesActors) yesWeight += ctx.memberWeights.get(a) ?? 0n;

      let totalWeight = 0n;
      for (const m of ctx.eligibleMembers) totalWeight += ctx.memberWeights.get(m) ?? 0n;

      if (totalWeight === 0n) {
        return { ok: false, reason: 'zero_total_weight' };
      }
      // yesWeight * 10000 >= thresholdBps * totalWeight
      // (all integer math — avoids float drift in BPS)
      const lhs = yesWeight * 10_000n;
      const rhs = BigInt(proof.rule.thresholdBps) * totalWeight;
      if (lhs < rhs) {
        return { ok: false, reason: `below_threshold:${lhs}/${rhs}` };
      }
      return { ok: true, agreers: [...yesActors], reachingActor: proof.reachingActor };
    }

    default: {
      const exhaustive: never = proof.rule;
      return { ok: false, reason: 'unknown_rule:' + JSON.stringify(exhaustive) };
    }
  }
}
