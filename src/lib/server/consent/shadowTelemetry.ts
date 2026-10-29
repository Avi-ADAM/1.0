/**
 * Server side of the shadow-projection telemetry (A3,
 * PLAN_DISTRIBUTED_EXECUTION) — the body of POST /api/consent/telemetry,
 * kept out of the route so it is testable without SvelteKit.
 *
 * Signed-in members only, shape enforced by validateShadowReport (which also
 * strips anything not in the shape), one user limited to a burst a sync loop
 * cannot produce. Each accepted report becomes a `[space-shadow-telemetry]`
 * log line — on the VPS that already lands in Axiom (vps-docker) — and, when
 * CONSENT_TELEMETRY_FILE is set, a JSONL line for
 * `scripts/space-shadow-report.mjs`.
 *
 * Telemetry, never a write path: nothing here touches Strapi or the Space.
 */

import { RateLimiter } from '$lib/server/translation/rateLimit';
import { SHADOW_TELEMETRY_TAG, validateShadowReport } from '$lib/consent/shadowTelemetry';

/** Per user per minute. A page sends one line per distinct snapshot. */
export const SHADOW_TELEMETRY_LIMIT = 30;
const WINDOW_MS = 60_000;

const perUser = new RateLimiter();

export type ShadowTelemetryDeps = {
  limiter?: RateLimiter;
  /** Appends one line to CONSENT_TELEMETRY_FILE; absent = log only. */
  append?: (line: string) => Promise<void>;
  log?: (line: string) => void;
  now?: () => Date;
};

export type ShadowTelemetryOutcome = { status: number; message: string };

export async function recordShadowReport(
  // `false` is how locals.uid says "not signed in" (app.d.ts)
  input: { uid: string | false | null | undefined; contentType: string | null; body: unknown },
  deps: ShadowTelemetryDeps = {}
): Promise<ShadowTelemetryOutcome> {
  if (!input.uid) return { status: 401, message: 'Sign in first' };
  const type = input.contentType?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') return { status: 415, message: 'Expected application/json' };

  const verdict = (deps.limiter ?? perUser).take(`u:${input.uid}`, SHADOW_TELEMETRY_LIMIT, WINDOW_MS);
  if (!verdict.ok) return { status: 429, message: 'Too many reports' };

  const report = validateShadowReport(input.body);
  if (!report) return { status: 400, message: 'Malformed report' };

  const at = (deps.now ?? (() => new Date()))().toISOString();
  const line = JSON.stringify({ at, ...report });
  (deps.log ?? console.log)(`${SHADOW_TELEMETRY_TAG} ${line}`);
  if (deps.append) {
    await deps.append(line + '\n').catch((e) => console.error('[consent/telemetry] append failed', e));
  }
  return { status: 200, message: 'ok' };
}
