/**
 * Shadow-projection telemetry (A3, PLAN_DISTRIBUTED_EXECUTION) — what the T2
 * exit criterion is measured on: N days and M signed events of a pilot rikma
 * with zero unexplained differences between the Space projection and Strapi.
 *
 * One line per comparison SNAPSHOT, not per mismatch: a line with no
 * mismatches is the evidence that counts toward the exit, and `events` is
 * how far the rikma's signed log had grown when it was taken.
 *
 * Shared by the browser (SpaceProjectionShadow builds the line) and the
 * server (which refuses anything that is not exactly this shape). Carries no
 * name, no email and not the reporter's id: `member` is the internal id of
 * the rikma member whose balance differs, which is what a mismatch is about.
 */

export const SHADOW_TELEMETRY_TAG = '[space-shadow-telemetry]';

/** Lines past this many mismatches are truncated — one bad sync is not a flood. */
export const MAX_MISMATCHES_PER_REPORT = 50;

export type ShadowMismatchKind = 'balance';

export interface ShadowMismatch {
  kind: ShadowMismatchKind;
  member: string;
  /** agorot, as a decimal string (the chain holds a bigint) */
  chain: string;
  /** agorot, as a decimal string (Strapi hervachti × 100, rounded) */
  strapi: string;
}

export interface ShadowReport {
  v: 1;
  pid: string;
  /** signed events in the replica when the snapshot was taken */
  events: number;
  /** members present on both sides — the size of what was compared */
  compared: number;
  mismatches: ShadowMismatch[];
}

const ID_RE = /^\d{1,12}$/;
const AGOROT_RE = /^-?\d{1,18}$/;
const KINDS = new Set<ShadowMismatchKind>(['balance']);

const clampInt = (v: unknown, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null;
};

/** The server's gate: a clean copy of a well-formed report, or null. */
export function validateShadowReport(raw: any): ShadowReport | null {
  if (!raw || raw.v !== 1) return null;
  const pid = String(raw.pid ?? '');
  if (!ID_RE.test(pid)) return null;
  const events = clampInt(raw.events, 10_000_000);
  const compared = clampInt(raw.compared, 100_000);
  if (events === null || compared === null) return null;
  if (!Array.isArray(raw.mismatches)) return null;

  const mismatches: ShadowMismatch[] = [];
  for (const m of raw.mismatches.slice(0, MAX_MISMATCHES_PER_REPORT)) {
    const member = String(m?.member ?? '');
    const chain = String(m?.chain ?? '');
    const strapi = String(m?.strapi ?? '');
    if (!KINDS.has(m?.kind) || !ID_RE.test(member)) return null;
    if (!AGOROT_RE.test(chain) || !AGOROT_RE.test(strapi)) return null;
    mismatches.push({ kind: m.kind, member, chain, strapi });
  }
  return { v: 1, pid, events, compared, mismatches };
}

/**
 * The same snapshot twice says nothing new — the client sends each distinct
 * one once per page session. Mismatch order does not make a new snapshot.
 */
export function shadowReportKey(r: ShadowReport): string {
  const ms = r.mismatches
    .map((m) => `${m.kind}:${m.member}:${m.chain}:${m.strapi}`)
    .sort()
    .join('|');
  return `${r.pid}#${r.events}#${r.compared}#${ms}`;
}
