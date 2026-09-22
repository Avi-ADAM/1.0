/**
 * The server side of "does this acceptance close the mission?"
 * (docs/PLAN_SHIFTS.md §2).
 *
 * Both acceptance finalizers used to archive the OpenMission — and every other
 * candidate's Ask — on the first acceptance, whatever `howMeny` said. This
 * module reads the mission's real occupancy and hands them the decision, so
 * the two paths can never drift apart.
 *
 * `MISSION_HEADCOUNT=off` restores the old behaviour exactly, without a
 * deploy: this change sits on the most sensitive flow in the app (the moment a
 * person is told they are in), so it gets a one-variable way back.
 *
 * Read through `$env/dynamic/private`, not `process.env` — under `vite dev`
 * the latter is empty and the flag would read as unset in development only.
 */

import { env } from '$env/dynamic/private';
import { effectOfAcceptance, type AcceptanceEffect } from '$lib/missions/headcount.js';

export interface AcceptanceDecision extends AcceptanceEffect {
  /**
   * The occupancy read failed (or the flag is off), so the old
   * archive-on-first-acceptance behaviour was used. Surfaced rather than
   * swallowed: a mission that quietly closed on one of five is precisely the
   * bug this module exists to end.
   */
  degraded: boolean;
}

/** Anything but an explicit `off` enables it — the fix is the intended state. */
export function headcountEnabled(): boolean {
  return String(env.MISSION_HEADCOUNT ?? '').toLowerCase() !== 'off';
}

interface StrapiLike {
  execute: (qid: string, vars: unknown, jwt?: string, fetch?: unknown) => Promise<any>;
}

interface ContextLike {
  jwt?: string;
  fetch?: unknown;
}

/**
 * What this acceptance does to the OpenMission.
 *
 * On a failed read we fall back to archiving — today's behaviour — rather than
 * leaving the mission advertised on a guess. A mission that closes a seat too
 * early is recoverable (the archive path already reopens it when someone
 * leaves); a mission left open on bad data keeps collecting candidacies for a
 * seat that does not exist.
 */
export async function acceptanceEffect(
  strapi: StrapiLike,
  context: ContextLike,
  openMissionId: string | number
): Promise<AcceptanceDecision> {
  if (!headcountEnabled()) {
    return { ...effectOfAcceptance(null, { enabled: false }), degraded: true };
  }

  try {
    const res = await strapi.execute(
      '327getOpenMissionHeadcount',
      { id: String(openMissionId) },
      context.jwt,
      context.fetch
    );
    const attributes = res?.data?.openMission?.data?.attributes;
    if (!attributes) throw new Error('open mission not found');
    return { ...effectOfAcceptance(attributes), degraded: false };
  } catch (e) {
    console.error(
      `[headcount] could not read occupancy of open mission ${openMissionId} — ` +
        'falling back to archive-on-acceptance:',
      e
    );
    return { ...effectOfAcceptance(null, { enabled: false }), degraded: true };
  }
}
