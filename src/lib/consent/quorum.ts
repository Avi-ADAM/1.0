// Quorum proofs — verify that a set of events constitutes consent under a rule.
//
// The QuorumProof attached to a consensus event (PLAN_rikma_as_state_machine §4)
// is a self-contained witness that the consensus rule was satisfied. Anyone can
// verify it in O(|evidence|) without re-running the full projection.
//
// Rules supported:
//   - unanimous       : every member of the eligible set voted yes
//   - majority        : > half of the eligible set voted yes
//   - k-of-n          : at least k yes votes (k specified in rule.params)
//   - agreers-only    : at least 1 yes vote, no nos (used by Ratson §3.0)
//   - timeout         : deadline passed AND no counter-proposal exists
//                       (full validation lives in PLAN_restime_in_signed_chain;
//                        the proof here only carries the receipts)

import type { ConsentEvent } from './event';

export type QuorumRule =
  | { kind: 'unanimous' }
  | { kind: 'majority' }
  | { kind: 'k-of-n'; k: number }
  | { kind: 'agreers-only' }
  | { kind: 'timeout'; expectedEnd: number; clockTolerance: number };

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

    default: {
      const exhaustive: never = proof.rule;
      return { ok: false, reason: 'unknown_rule:' + JSON.stringify(exhaustive) };
    }
  }
}
