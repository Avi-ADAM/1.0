// Canonical shape of a signed consent event.
// Every meaningful mutation in the project becomes one of these.
//
// Phase 0 used a minimal shape (v: 1, id, actor, device, action, subject,
// predicate, parents, ts, nonce, sig). Phase 1.5 adds OPTIONAL fields for
// state commitments (PLAN_rikma_as_state_machine) and quorum proofs
// (PLAN_restime_in_signed_chain). They MUST stay optional so Phase 0 events
// remain valid forever; verification logic treats their absence as
// "this event predates the commitment scheme".

import type { QuorumProof } from './quorum';

export type Delta =
  | { kind: 'hervachti.add';  member: string; amount: string; code: string }
  | { kind: 'hervachti.move'; from: string; to: string; amount: string; code: string }
  | { kind: 'member.add';     member: string }
  | { kind: 'member.remove';  member: string }
  | { kind: 'share.bump';     member: string; oldBps: number; newBps: number }
  | { kind: 'value.set';      path: string; before: unknown; after: unknown }
  | { kind: 'consensus.reach'; subject: string; decision: 'approve' | 'reject' }
  | { kind: 'round.advance';  subject: string; from: number; to: number; reason: 'counter' | 'merge' };

export type ConsentEvent = {
  v: 1;
  id: string;          // b64url(sha256(canonical(body+sig)))
  actor: string;       // userId
  device: string;      // b64(SPKI) of signing device
  action: ActionName;
  subject: { type: string; id: string };
  predicate?: Record<string, unknown>;
  parents: string[];   // DAG edges; tampering an ancestor invalidates descendants
  ts: number;
  nonce: string;
  sig: string;

  // Phase 1.5 — state commitment + consensus witness.
  parentStateRoots?: string[];   // b64 hash(es) of parent ProjectState(s)
  stateRoot?: string;            // b64 hash of ProjectState after this event
  delta?: Delta[];               // declared changes; verifier checks against state
  quorum?: QuorumProof;          // for events that ratify a group decision
};

export type DeviceCert = {
  v: 1;
  kind: 'deviceCert';
  id: string;
  userId: string;
  devicePubKey: string;        // the device being authorized
  deviceLabel: string;
  capabilities: ('sign' | 'admin')[];
  notBefore: number;
  notAfter?: number;
  parentDevicePubKey: string;  // signer; equals devicePubKey for first device (self-cert)
  actor: string;               // userId (kept for signature lookup uniformity)
  device: string;              // alias for parentDevicePubKey, used by verify pipeline
  nonce: string;
  sig: string;
};

export const ACTIONS = {
  tosplitCreate:   'tosplit.create',
  tosplitVote:     'tosplit.vote',
  halukaCreate:    'haluka.create',
  halukaApprove:   'haluka.approve',
  projectCreate:   'project.create',
  projectJoin:     'project.join',
  projectLeave:    'project.leave',
  projectAmend:    'project.amend',
  missionComplete: 'mission.complete',
  missionApprove:  'mission.approve',
  missionApproveVote: 'mission.approve.vote',
  proposalCounter: 'proposal.counter',
  consensusTimeout: 'consensus.timeout',
  saleRecord:       'sale.record',
  // Already emitted by addVoteConsentSpec (type:'decision') — added to the
  // enum here so ActionName covers it (was previously reached only via an
  // unsafe `as ActionName` cast at the shadow-sign call site).
  decisionVote:     'decision.vote',
  memberAway:      'member.away',
  timeTick:        'time.tick',
  // S2b (HANDOFF T4) — category-A vocabulary. Every name below has a reducer
  // in src/lib/consent/reducers/. Stage-vote names (pendm/sheirutpend/ask)
  // were already being emitted by addVoteConsentSpec via an unsafe cast;
  // adding them here makes ActionName cover reality.
  missionCreate:   'mission.create',
  pendmVote:       'pendm.vote',
  sheirutpendVote: 'sheirutpend.vote',
  askVote:         'ask.vote',
  halukaConfirm:   'haluka.confirm',
  decisionCreate:  'decision.create',
  forumCreate:     'forum.create',
  messagePost:     'message.post',
  // GDPR tombstone (HANDOFF T4 deletion policy): a signed request to blank
  // deletable free-text content from the projection. The log itself is never
  // rewritten — views keep `redacted: true`.
  payloadRedact:   'payload.redact',
  meetingCreate:   'pgisha.create',
  meetingApprove:  'pgisha.approve',
  snapshotCommit:  'snapshot.commit',
  snapshotVote:    'snapshot.vote',
  deviceCert:      'device.cert',
  deviceRevoke:    'device.revoke',
  // S3a — group-key distribution. The rotate event is PLAINTEXT by design:
  // you cannot encrypt the key-distribution message with the key it
  // distributes. Its predicate carries the epoch number and the epoch key
  // wrapped to every member device (see $lib/space/e2e/epoch.ts). It has NO
  // reducer on purpose: epochs are transport-layer state, not ProjectState —
  // adding it to the projection would change stateRoot semantics.
  epochRotate:     'epoch.rotate',
  // T9a — re-wrap an EXISTING epoch key to more devices (a new member, a
  // newly paired device, a device recovered through guardians). Plaintext
  // for the same reason as epoch.rotate, and reducer-less for the same
  // reason: it moves keys, not ProjectState. See PLAN_T9_SOCIAL_RECOVERY §3.
  epochGrant:      'epoch.grant',
  // T9b — social recovery of a user's device chain. `recovery.guardians`
  // is the user's signed guardian set; `recovery.vouch` is one guardian's
  // signed statement that a NEW device belongs to that user. Both ride the
  // existing consent-event mirror (subject {type:'user', id}) — no new
  // Strapi collection. `recovery.protest` is the owner's objection, from a
  // device they still hold, during the 24h protest window. See
  // $lib/consent/recovery.ts.
  recoveryGuardians: 'recovery.guardians',
  recoveryVouch:     'recovery.vouch',
  recoveryProtest:   'recovery.protest',
  // Being a guardian is an obligation, so it waits for consent (decision
  // 28.9.2026): the owner's `recovery.nominate` lands in the GUARDIAN's
  // subject (their private inbox), the guardian answers with
  // `recovery.accept` / `recovery.withdraw` in the owner's subject. Only an
  // accepted guardian counts — toward a set taking effect and toward a vouch.
  recoveryNominate:  'recovery.nominate',
  recoveryAccept:    'recovery.accept',
  recoveryWithdraw:  'recovery.withdraw',
  // The rikma's password vault (PLAN_RIKMA_SHARED_INFO §3.2). Only ever
  // SEALED, only in a `vault:<pid>` space, and reducer-less on purpose: the
  // items are folded by $lib/vault/items.ts, never into ProjectState
  // (invariant 2 — stateRoot must not change).
  vaultSet:          'vault.set',
  vaultRemove:       'vault.remove'
} as const;

export type ActionName = typeof ACTIONS[keyof typeof ACTIONS];

export function dedupeKey(ev: ConsentEvent): string {
  const order = (ev.predicate?.order as number | undefined) ?? 0;
  return `${ev.actor}|${ev.subject.type}:${ev.subject.id}|${ev.action}|${order}`;
}

export function isConsentEventShape(x: unknown): x is ConsentEvent {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.id === 'string' &&
    typeof o.actor === 'string' &&
    typeof o.device === 'string' &&
    typeof o.action === 'string' &&
    !!o.subject && typeof o.subject === 'object' &&
    Array.isArray(o.parents) &&
    typeof o.ts === 'number' &&
    typeof o.nonce === 'string' &&
    typeof o.sig === 'string'
  );
}
