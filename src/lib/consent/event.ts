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
  memberAway:      'member.away',
  timeTick:        'time.tick',
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
  epochRotate:     'epoch.rotate'
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
