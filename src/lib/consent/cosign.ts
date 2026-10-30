// Device co-signing of work the member did through another channel.
//
// A timer started from Telegram, the MCP connector or the in-app assistant runs
// on the server, which holds no member key — so until now nothing signed it, and
// the shadow comparison counted it as a gap (PLAN_DISTRIBUTED_EXECUTION, A2
// batch 2). Here the server asks the member's own device to sign instead: a web
// push carries a CosignRequest, the service worker judges it, signs it with the
// device key and tells the member what happened.
//
// What the signature means is narrower than a click on the device: "my device
// saw the server report this, close to when it happened". So the device signs
// only what it can bound on its own — its own member's clock, near now — and
// the event says which channel it came from (`via`). A server that could make
// devices sign anything would void every signature on the chain.
//
// Pure: the server builds, the service worker judges. No IDB, no fetch.

import { s2bShadowJobs, timeTickConsentSpec } from './specs/s2b';
import type { ConsentEvent } from './event';
import { spaceIdForProject } from '$lib/space/protocol';

/** The channels whose actions a device co-signs. */
export const COSIGN_VIAS = ['telegram', 'mcp', 'assistant'] as const;
export type CosignVia = (typeof COSIGN_VIAS)[number];

export function normalizeVia(x: unknown): CosignVia | null {
  return (COSIGN_VIAS as readonly unknown[]).includes(x) ? (x as CosignVia) : null;
}

/** Server action keys that may ask for a co-signature. The clock only. */
export const COSIGN_ACTION_KEYS: ReadonlySet<string> = new Set(['timerStart', 'timerStop']);

/**
 * How far from the device's own clock a tick may be. A push that arrives later
 * than this (device off, phone asleep) is shown but not signed: the device can
 * no longer say it saw the moment. Also the push TTL.
 */
export const COSIGN_MAX_SKEW_MS = 60 * 60 * 1000;

/** No single session a device will attest to is longer than this. */
export const COSIGN_MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export type CosignTickParams = {
  timerId: string;
  op: 'start' | 'stop';
  order: number;
  sessionMs?: number;
  fresh?: boolean;
  missionId?: string;
};

export type CosignRequest = {
  v: 1;
  action: 'time.tick';
  actor: string;
  projectId: string;
  via: CosignVia;
  params: CosignTickParams;
};

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

const str = (x: unknown): string | undefined =>
  x === undefined || x === null || x === '' ? undefined : String(x);

/**
 * Server side: what a successful timer action asks the member's devices to
 * sign. Rides the same deriver the browser uses (s2bShadowJobs), so a tick
 * co-signed from Telegram is the event a tab would have signed, plus `via`.
 */
export function buildCosignRequests(
  actionKey: string,
  params: Record<string, unknown>,
  result: unknown,
  opts: { userId: string; via: CosignVia }
): CosignRequest[] {
  if (!COSIGN_ACTION_KEYS.has(actionKey)) return [];
  const deriver = s2bShadowJobs[actionKey];
  if (!deriver) return [];
  let jobs;
  try {
    jobs = deriver(params ?? {}, (result ?? {}) as Record<string, unknown>);
  } catch {
    return [];
  }
  const out: CosignRequest[] = [];
  for (const job of jobs) {
    if (job.spec !== timeTickConsentSpec) continue;
    const p = job.params as Record<string, unknown>;
    const projectId = str(p.projectId);
    const timerId = str(p.timerId);
    if (!projectId || !timerId || typeof p.order !== 'number') continue;
    out.push({
      v: 1,
      action: 'time.tick',
      actor: String(opts.userId),
      projectId,
      via: opts.via,
      params: {
        timerId,
        op: p.op === 'stop' ? 'stop' : 'start',
        order: p.order,
        ...(typeof p.sessionMs === 'number' ? { sessionMs: p.sessionMs } : {}),
        ...(p.fresh === true ? { fresh: true } : {}),
        ...(str(p.missionId) ? { missionId: str(p.missionId) } : {})
      }
    });
  }
  return out;
}

export type CosignJudgement =
  | {
      ok: true;
      spaceId: string;
      partial: Pick<ConsentEvent, 'action' | 'subject' | 'predicate'>;
      reason?: undefined;
    }
  // strict:false — no discriminated-union narrowing, so the failure branch
  // names the success fields too (the repo's VerifyResult pattern).
  | { ok: false; reason: string; spaceId?: undefined; partial?: undefined };

/**
 * Device side: may this device sign this request, and if so, what. Everything
 * the server sent is re-checked here — the request is a claim, not an order.
 */
export function judgeCosignRequest(
  req: unknown,
  ctx: { deviceUserId: string; now: number }
): CosignJudgement {
  const r = req as Partial<CosignRequest> | null;
  if (!r || typeof r !== 'object' || r.v !== 1) return { ok: false, reason: 'bad_request' };
  if (r.action !== 'time.tick') return { ok: false, reason: 'action_not_cosignable' };
  if (typeof r.actor !== 'string' || r.actor !== String(ctx.deviceUserId)) {
    return { ok: false, reason: 'not_this_member' };
  }
  const via = normalizeVia(r.via);
  if (!via) return { ok: false, reason: 'unknown_via' };
  if (typeof r.projectId !== 'string' || !ID_RE.test(r.projectId)) {
    return { ok: false, reason: 'bad_project' };
  }

  const p = r.params as Partial<CosignTickParams> | undefined;
  if (!p || typeof p.timerId !== 'string' || !ID_RE.test(p.timerId)) {
    return { ok: false, reason: 'bad_timer' };
  }
  if (p.op !== 'start' && p.op !== 'stop') return { ok: false, reason: 'bad_op' };
  if (typeof p.order !== 'number' || !Number.isFinite(p.order)) {
    return { ok: false, reason: 'bad_order' };
  }
  if (Math.abs(ctx.now - p.order) > COSIGN_MAX_SKEW_MS) return { ok: false, reason: 'stale' };
  if (p.sessionMs !== undefined) {
    if (p.op !== 'stop') return { ok: false, reason: 'bad_session' };
    if (typeof p.sessionMs !== 'number' || !(p.sessionMs >= 0) || p.sessionMs > COSIGN_MAX_SESSION_MS) {
      return { ok: false, reason: 'bad_session' };
    }
  }
  if (p.missionId !== undefined && (typeof p.missionId !== 'string' || !ID_RE.test(p.missionId))) {
    return { ok: false, reason: 'bad_mission' };
  }

  return {
    ok: true,
    spaceId: spaceIdForProject(r.projectId),
    partial: {
      action: 'time.tick',
      subject: { type: 'timer', id: p.timerId },
      predicate: timeTickConsentSpec.predicateFromParams!({
        op: p.op,
        order: p.order,
        sessionMs: p.sessionMs,
        fresh: p.fresh === true,
        missionId: p.missionId,
        via
      })
    }
  };
}
