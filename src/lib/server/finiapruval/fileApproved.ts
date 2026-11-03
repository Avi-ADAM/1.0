/**
 * Turn approved hours into the rikma's books — the write `closeFiniapruval` makes once
 * every member signed, shared with the release of hours held above a deal part's ceiling
 * (`$lib/server/sheirut/overCap`), so both write exactly the same rows.
 *
 *  - **Hours** (a timer save, a month) bank on the mission's open FinnishedMission row of
 *    their rate era and leave the mission running.
 *  - **A finish approval** writes one final row with only the hours this completion adds
 *    (never the running total — docs/inprogress/FIXES.md §5) and marks the mission done.
 *
 * `fa` is the approval as qid `117getFiniapruvalForClose` returns it.
 */

import { roundHours, workValue } from '$lib/timers/precision.js';
import { pickRateRow, rowRate, type RateRow } from '$lib/timers/rate.js';

export type QidRunner = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface FileApprovedArgs {
  finiapruvalId: string;
  /** The approval's attributes (qid 117). */
  fa: any;
  /** The hours to file now — all of the approval, or the part under a deal's ceiling. */
  hours: number;
  /** The rate they were worked at. */
  perhour: number;
  isTimerSave: boolean;
  /**
   * A finish approval that adds no hours still writes its row of 0 (as it always did) —
   * unless its hours are all held above a deal's ceiling: then voting on it again must not
   * leave another empty row each time. Default true.
   */
  writeEmptyFinal?: boolean;
  now?: Date;
}

export async function fileApprovedHours(run: QidRunner, args: FileApprovedArgs): Promise<void> {
  const { finiapruvalId, fa, perhour, isTimerSave } = args;
  const now = args.now ?? new Date();
  const noofhours = roundHours(args.hours);
  const mba = fa.mesimabetahalich?.data;
  const mbaa = mba?.attributes;

  if (isTimerSave) {
    // Nothing to bank (every hour of it waits above a ceiling): the books do not move.
    if (noofhours <= 0) return;
    const fmRows: RateRow[] = (mbaa?.finnished_missions?.data ?? []).map((fm: any) => ({
      id: String(fm.id),
      noofhours: Number(fm.attributes?.noofhours ?? 0),
      perhour: fm.attributes?.perhour == null ? null : Number(fm.attributes.perhour)
    }));
    const targetRow = pickRateRow(fmRows, perhour);
    const existingFm = targetRow
      ? mbaa?.finnished_missions?.data?.find((fm: any) => String(fm.id) === targetRow.id)
      : null;

    if (existingFm && targetRow) {
      const newHours = roundHours((existingFm.attributes.noofhours ?? 0) + noofhours);
      await run('114updateFinnishedMissionHours', {
        id: existingFm.id,
        noofhours: newHours,
        total: workValue(newHours, rowRate(targetRow, perhour))
      });
    } else {
      await run('113createFinnishedMissionForTimerSave', {
        missionName: fa.missname,
        noofhours,
        mesimabetahalich: mba?.id,
        mission: mbaa?.mission?.data?.id,
        project: fa.project?.data?.id,
        publishedAt: now.toISOString(),
        users_permissions_user: fa.users_permissions_user?.data?.id,
        perhour,
        total: workValue(noofhours, perhour),
        why: fa.why ?? 'timer save'
      });
    }

    await run('115updateMissionTotalHoursSaved', {
      id: mba?.id,
      totalHoursSaved: roundHours((mbaa?.totalHoursSaved ?? 0) + noofhours)
    });
    return;
  }

  // A finish approval: the claim "this is done" stands whatever its hours, so the mission
  // is marked done even when every hour of it waits above a ceiling.
  if (noofhours > 0 || args.writeEmptyFinal !== false) {
    await run('119createFinnishedMissionFinal', {
      missionName: fa.missname,
      why: fa.why ?? '',
      noofhours,
      mesimabetahalich: mba?.id,
      perhour,
      total: workValue(noofhours, perhour),
      project: fa.project?.data?.id,
      mission: mbaa?.mission?.data?.id,
      users_permissions_user: fa.users_permissions_user?.data?.id,
      publishedAt: now.toISOString(),
      finiapruvals: [finiapruvalId]
    });
  }

  await run('105updateMesimabetahalichForFinish', {
    id: mba?.id,
    finnished: true,
    forappruval: false
  });
}
