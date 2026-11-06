// The settings half of the shadow comparison (A2b P4, PLAN_DISTRIBUTED_EXECUTION).
//
// Only paths that have a project.amend on the chain are compared: the T6
// genesis carries no settings, so a path the chain never amended is unknown
// to it, not wrong. Values compare in canonical JSON, both sides in the
// vocabulary's normal form ($lib/consent/specs/projectAmend).
//
// Telemetry never carries the value itself — a description is the rikma's
// text, and the format (shadowTelemetry.ts) takes digits only. A setting
// mismatch is `member` = the path's index in AMEND_PATHS and `chain` /
// `strapi` = a 32-bit FNV-1a fingerprint of each canonical value: enough to
// see that they differ and to tell one mismatch from another.
//
// Pure: the panel feeds it the replica's events and the server's values.

import type { ConsentEvent } from './event';
import type { ShadowMismatch } from './shadowTelemetry';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';
import { AMEND_PATHS, isAmendPath, type AmendPath, type AmendValue } from './specs/projectAmend';

/** Paths the chain has amended at least once. */
export function amendedPaths(events: Iterable<ConsentEvent>): Set<AmendPath> {
  const out = new Set<AmendPath>();
  for (const ev of events) {
    if (ev.action !== 'project.amend') continue;
    const path = (ev.predicate as { path?: unknown } | undefined)?.path;
    if (isAmendPath(path)) out.add(path);
  }
  return out;
}

function canon(v: unknown): string {
  try {
    return canonicalize((v === undefined ? null : v) as JsonValue);
  } catch {
    return '\u0000uncanonical'; // never equal to a real value
  }
}

/** FNV-1a, 32 bit, over the UTF-16 code units — as a decimal string. */
export function settingFingerprint(v: unknown): string {
  const s = canon(v);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return String(h >>> 0);
}

export function compareSettings(
  chain: Map<string, unknown>,
  strapi: Map<AmendPath, AmendValue> | null,
  paths: Set<AmendPath>
): { compared: number; mismatches: ShadowMismatch[] } {
  if (!strapi) return { compared: 0, mismatches: [] };
  let compared = 0;
  const mismatches: ShadowMismatch[] = [];
  for (const path of paths) {
    compared++;
    const a = chain.has(path) ? chain.get(path) : null;
    const b = strapi.has(path) ? strapi.get(path) : null;
    if (canon(a) === canon(b)) continue;
    mismatches.push({
      kind: 'setting',
      member: String(AMEND_PATHS.indexOf(path)),
      chain: settingFingerprint(a),
      strapi: settingFingerprint(b)
    });
  }
  return { compared, mismatches };
}
