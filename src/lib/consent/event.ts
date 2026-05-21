// Canonical shape of a signed consent event.
// Every meaningful mutation in the project becomes one of these.

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
  missionComplete: 'mission.complete',
  deviceCert:      'device.cert',
  deviceRevoke:    'device.revoke'
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
