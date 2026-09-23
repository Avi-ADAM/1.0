/**
 * One line per open attempt — the pilot's actual product
 * (docs/PLAN_P2P_PILOT.md §3).
 *
 * Shared by the browser (which builds the line) and the server (which refuses
 * anything that is not exactly this shape before writing it). Deliberately
 * carries no user id, no file name and no hash: the question is "does P2P
 * work between our members", and none of those help answer it.
 */

export type Outcome = 'cache' | 'peer' | 'origin' | 'failed';

/** Why the peer leg did not deliver, when it was tried or skipped. */
export type PeerFailure =
  | 'none' // delivered by a peer, or never needed (cache hit)
  | 'no-peer' // nobody answered `want` in time — the availability question (H2)
  | 'ice' // an answer came, but no candidate pair connected — the connectivity question (H1)
  | 'timeout' // connected, but the file did not finish in time
  | 'hash' // bytes arrived and failed verification (H3 — must stay at zero)
  | 'refused' // the seeder said busy / missing / too large
  | 'protocol' // malformed traffic
  | 'offline' // no signaling connection at all
  | 'skipped'; // P2P not attempted (file too large, no hash)

export type CandidateType = 'host' | 'srflx' | 'prflx' | 'relay' | 'unknown';

export interface P2pAttempt {
  v: 1;
  pid: string;
  outcome: Outcome;
  peerFailure: PeerFailure;
  peersAnswered: number;
  candidate: CandidateType | null;
  bytes: number;
  /** total ms from click to verified bytes */
  ms: number;
  /** ms of the peer leg alone (want → verified), when it ran */
  peerMs: number | null;
}

const OUTCOMES = new Set<Outcome>(['cache', 'peer', 'origin', 'failed']);
const FAILURES = new Set<PeerFailure>([
  'none',
  'no-peer',
  'ice',
  'timeout',
  'hash',
  'refused',
  'protocol',
  'offline',
  'skipped'
]);
const CANDIDATES = new Set<CandidateType>(['host', 'srflx', 'prflx', 'relay', 'unknown']);

const clampInt = (v: unknown, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null;
};

/** The server's gate: a clean copy of a well-formed line, or null. */
export function validateAttempt(raw: any): P2pAttempt | null {
  if (!raw || raw.v !== 1) return null;
  const pid = String(raw.pid ?? '');
  if (!/^\d{1,12}$/.test(pid)) return null;
  if (!OUTCOMES.has(raw.outcome) || !FAILURES.has(raw.peerFailure)) return null;
  const candidate = raw.candidate == null ? null : CANDIDATES.has(raw.candidate) ? raw.candidate : null;
  const peersAnswered = clampInt(raw.peersAnswered, 100);
  const bytes = clampInt(raw.bytes, 10 * 1024 * 1024 * 1024);
  const ms = clampInt(raw.ms, 10 * 60 * 1000);
  const peerMs = raw.peerMs == null ? null : clampInt(raw.peerMs, 10 * 60 * 1000);
  if (peersAnswered == null || bytes == null || ms == null) return null;
  return {
    v: 1,
    pid,
    outcome: raw.outcome,
    peerFailure: raw.peerFailure,
    peersAnswered,
    candidate,
    bytes,
    ms,
    peerMs
  };
}

/**
 * Which kind of path the connection actually used, read out of
 * `RTCPeerConnection.getStats()` values. `relay` means TURN carried it — the
 * number H1 is about.
 */
export function classifyCandidate(stats: Iterable<any>): CandidateType {
  const all = [...stats];
  const byId = new Map(all.map((s) => [s.id, s]));
  const transport = all.find((s) => s.type === 'transport' && s.selectedCandidatePairId);
  const pair =
    (transport && byId.get(transport.selectedCandidatePairId)) ||
    all.find((s) => s.type === 'candidate-pair' && (s.selected || s.nominated) && s.state === 'succeeded');
  const local = pair ? byId.get(pair.localCandidateId) : null;
  const type = local?.candidateType;
  return CANDIDATES.has(type) ? type : 'unknown';
}

/** Size buckets for the report — throughput means nothing across 1 KB and 50 MB. */
export function sizeBucket(bytes: number): string {
  if (bytes < 256 * 1024) return '<256K';
  if (bytes < 2 * 1024 * 1024) return '<2M';
  if (bytes < 20 * 1024 * 1024) return '<20M';
  return '20M+';
}
