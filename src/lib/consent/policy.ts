// Which actions require a QuorumProof (PLAN_rikma_as_state_machine §8.2).
//
// Not every event needs a quorum — votes ARE votes, chat is chat. But events
// that RATIFY a group decision must carry the witness that the decision
// actually passed. This table is the single source of truth; §8.2 warns that
// missing a row here is the dangerous failure mode, so any new consensus
// action must be added the moment it's defined.
//
// Enforcement level is the verifier's choice (commitment.ts `mode`):
//   'available' (Phase 1.5–2) — a required-but-absent quorum is a warning;
//                               a PRESENT-but-invalid quorum is a rejection.
//   'strict'    (Phase 3+)    — required-but-absent is a rejection too.

import type { ActionName } from './event';

export type QuorumRequirement = {
  required: boolean;
  /** The action whose events count as votes in the evidence set. */
  voteAction?: string;
};

const NOT_REQUIRED: QuorumRequirement = { required: false };

const QUORUM_POLICY: Partial<Record<ActionName, QuorumRequirement>> = {
  // Ratifies delivered work → hervachti credit. The §6 flagship case.
  'mission.approve':   { required: true, voteAction: 'mission.approve.vote' },

  // member.add (§8.2 — "חייב"). Joining a rikma is a group decision.
  'project.join':      { required: true, voteAction: 'project.join.vote' },

  // member.remove by consent. NOTE: leaving on your OWN accord is sovereign —
  // an actor's project.leave on themselves passes without quorum (special-cased
  // in commitment.ts); removing someone ELSE requires the group.
  'project.leave':     { required: true, voteAction: 'project.leave.vote' },

  // value.set on rikma config (§8.2 — sensitive fields).
  'project.amend':     { required: true, voteAction: 'project.amend.vote' },

  // Checkpoint attestation (§5.1) — only meaningful when quorum-signed.
  'snapshot.commit':   { required: true, voteAction: 'snapshot.vote' },

  // Votes are themselves evidence; requiring quorum on them would recurse.
  'tosplit.vote':          NOT_REQUIRED,
  'mission.approve.vote':  NOT_REQUIRED,
  'snapshot.vote':         NOT_REQUIRED,

  // Carries its own rule (kind: 'timeout') when a proof is attached; absence
  // of a counter-proposal is checked at ingest (PLAN_restime §5), not here.
  'consensus.timeout':     NOT_REQUIRED,

  // Creation acts open a conversation, they don't close one.
  'tosplit.create':    NOT_REQUIRED,
  'haluka.create':     NOT_REQUIRED,
  'project.create':    NOT_REQUIRED,   // genesis: there's no quorum before members exist
  'mission.complete':  NOT_REQUIRED,   // self-report; the APPROVAL needs the quorum
  'proposal.counter':  NOT_REQUIRED,

  // haluka.approve is a vote-like ratification kept quorum-free until the
  // haluka flow migrates to explicit consensus events (Phase 4 wave).
  'haluka.approve':    NOT_REQUIRED,

  // A sale report is the reporter's sovereign attestation that opens a
  // bilateral holder-consent conversation (PLAN_sale_holder_consent). It is
  // NOT a rikma-wide decision — consensus is between exactly two people
  // (reporter + holder), so no group QuorumProof applies.
  'sale.record':       NOT_REQUIRED,

  'member.away':       NOT_REQUIRED,
  'time.tick':         NOT_REQUIRED,
  'device.cert':       NOT_REQUIRED,
  'device.revoke':     NOT_REQUIRED
};

export function quorumRequirement(action: string): QuorumRequirement {
  return QUORUM_POLICY[action as ActionName] ?? NOT_REQUIRED;
}
