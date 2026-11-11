/**
 * Book the past months a recurring mission was created with.
 *
 * The rikma already signed these hours: they were part of the proposal it
 * approved (or, in a solo rikma, the creator is the whole quorum). The money
 * goes on one FinnishedMission row, the row a timer save would bank on, so later
 * hours at the same rate accumulate on it as usual. The months go on the
 * mission's `monter` ledger. Both land in one request, so the books and the
 * ledger cannot disagree. See $lib/recurring/missionBackfill for the rules.
 */

import type { BackfillCycle } from '$lib/recurring/backfill';
import {
  missionBackfillBook,
  missionBackfillCycles,
  missionBackfillRows
} from '$lib/recurring/missionBackfill';

export type QidRunner = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface MissionBackfillTarget {
  /** The Mesimabetahalich just created. */
  missionId: string;
  projectId: string;
  /** The catalogue Mission, when there is one. */
  templateId?: string | null;
  name: string;
  userId: string;
  /** The agreed hourly value. */
  rate: unknown;
  /** The agreed hours per month. */
  plannedHours: unknown;
  now?: Date;
}

/** Returns how many months were written. */
export async function settleMissionBackfill(
  run: QidRunner,
  input: MissionBackfillTarget & { cycles: BackfillCycle[] }
): Promise<number> {
  const { cycles, missionId, projectId, templateId, name, userId, rate, plannedHours } = input;
  if (cycles.length === 0) return 0;
  const now = input.now ?? new Date();
  const perhour = Number(rate) || 0;
  const { hours, value } = missionBackfillBook(cycles, perhour);

  const res = await run('settleMissionBackfill', {
    id: missionId,
    monter: missionBackfillRows(cycles, plannedHours),
    totalHoursSaved: hours,
    data: {
      missionName: name,
      noofhours: hours,
      perhour,
      total: value,
      mesimabetahalich: missionId,
      ...(templateId ? { mission: templateId } : {}),
      project: projectId,
      users_permissions_user: userId,
      isNotFinished: true,
      isFinished: false,
      // The sentinel a timer row starts with: the next note replaces it.
      why: 'timer save',
      publishedAt: now.toISOString()
    }
  });
  if (!res?.data?.createFinnishedMission?.data?.id) {
    throw new Error(`Could not book the past months of mission ${missionId}`);
  }
  return cycles.length;
}

/**
 * The months stored on an accepted OpenMission, booked onto its new mission.
 *
 * Only the proposer's own offer carries them forward: if an assigned offer was
 * reopened and somebody else took the mission, that table is not about them.
 * Never throws. The acceptance stands whatever happens here, so a failure is
 * logged and reported as 0.
 */
export async function settleOpenMissionBackfill(
  run: QidRunner,
  input: MissionBackfillTarget & { openMissionId: string; start?: unknown }
): Promise<number> {
  try {
    const res = await run('getOpenMissionBackfill', { id: input.openMissionId });
    const om = res?.data?.openMission?.data?.attributes;
    if (!om?.backfill || om.iskvua !== true || om.isRishon !== true) return 0;
    if (String(om.rishon?.data?.id ?? '') !== String(input.userId)) return 0;
    const cycles = missionBackfillCycles(om.backfill, {
      anchor: input.start ?? om.sqadualed,
      now: input.now
    });
    return await settleMissionBackfill(run, { ...input, cycles });
  } catch (e) {
    console.error('[missionBackfill] past months not booked for mission', input.missionId, e);
    return 0;
  }
}
