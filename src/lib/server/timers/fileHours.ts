/**
 * Where saved hours go once they are counted — shared by the timer's save
 * (`timerSave`) and by a claim for GitHub work (`claimGithubWork`,
 * PLAN_CODE_RIKMA §4.2), so a claim cannot take a shortcut past the approval
 * the timer's hours go through.
 *
 *  - **A rikma of one** writes the hours straight onto the mission's open
 *    FinnishedMission row — one row per rate era, so hours worked at an old
 *    value never land on a row priced at the new one.
 *  - **Everyone else** opens a `Finiapruval` that the rikma signs, with the
 *    usual `restime` clock: silence is consent, a counter resets it.
 *
 * `at` is the mission as qid `110getMissionForTimerSave` returns it.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { pickRateRow, rowRate, type RateRow } from '$lib/timers/rate.js';
import { saveFileIds } from '$lib/timers/saveFiles.js';
import { workMonthOf } from '$lib/recurring/missionMonths.js';

/**
 * `why` on Finiapruval and FinnishedMission is a Strapi `string` — a 255-char
 * column. The timer's own `saveText` is richtext and keeps the note in full;
 * these copies are summaries, so trim them rather than let the write fail.
 * The newest note is the one that matters, so trimming eats the oldest lines.
 */
const WHY_MAX = 250;

export function clampWhy(text: string): string {
  if (text.length <= WHY_MAX) return text;
  const lines = text.split('\n');
  while (lines.length > 1 && lines.join('\n').length > WHY_MAX - 2) lines.shift();
  const kept = lines.join('\n');
  if (kept.length <= WHY_MAX - 2) return `…\n${kept}`;
  // A single note longer than the column on its own — cut its head off.
  return `…${kept.slice(kept.length - (WHY_MAX - 1))}`;
}

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The month the approval is filed under.
 *
 * It used to be today's date, so a member who worked all through August and
 * saved on the 1st of September had every one of those hours booked to
 * September. The hours carry their own dates — `workMonthOf` reads the month
 * that holds most of them — and only a timer with no usable interval falls back
 * to today.
 */
export function approvalMonth(intervals: { start?: string | null; stop?: string | null }[]): string {
  return workMonthOf(intervals) ?? todayDateString();
}

export interface FileHoursArgs {
  strapi: { execute: (qid: string, vars: any, jwt: string, fetch: any) => Promise<any> };
  context: { userId: string; jwt: string; fetch: any };
  missionId: string;
  /** The mission's attributes, from `110getMissionForTimerSave`. */
  at: any;
  hours: number;
  rate: number;
  saveText: string;
  files: string[];
  intervals: { start?: string | null; stop?: string | null }[];
  timerId?: string;
}

export type FileHoursResult = { filed: 'finnishedMission' } | { filed: 'approval'; finiapruvalId: string | null };

export async function fileHours(args: FileHoursArgs): Promise<FileHoursResult> {
  const { strapi, context, missionId: mId, at, hours, rate, saveText, files, intervals, timerId } = args;
  const now = new Date();
  const userCount = at.project?.data?.attributes?.user_1s?.data?.length ?? 1;

  if (userCount === 1) {
    const fmRows: RateRow[] = (at.finnished_missions?.data ?? []).map((fm: any) => ({
      id: String(fm.id),
      noofhours: Number(fm.attributes?.noofhours ?? 0),
      perhour: fm.attributes?.perhour == null ? null : Number(fm.attributes.perhour)
    }));
    const targetRow = pickRateRow(fmRows, rate);
    const existingFm = targetRow
      ? at.finnished_missions?.data?.find((fm: any) => String(fm.id) === targetRow.id)
      : null;

    if (existingFm && targetRow) {
      const newHours = (existingFm.attributes.noofhours ?? 0) + hours;
      // The row accumulates sessions, so the notes accumulate too — one line
      // per save, oldest first, rather than the last one winning.
      const prevWhy: string = (existingFm.attributes.why ?? '').toString();
      const mergedWhy = saveText
        ? prevWhy && prevWhy !== 'timer save'
          ? `${prevWhy}\n${saveText}`
          : saveText
        : null;
      // Same for the attachments: a media relation is *replaced* by what is
      // written, so this session's files are added to the ones earlier
      // sessions filed rather than sent on their own.
      const mergedFiles = files.length
        ? [...new Set([...saveFileIds(existingFm.attributes?.what), ...files])]
        : null;
      await strapi.execute(
        '114updateFinnishedMissionHours',
        {
          id: existingFm.id,
          noofhours: newHours,
          total: newHours * rowRate(targetRow, rate),
          ...(mergedWhy ? { why: clampWhy(mergedWhy) } : {}),
          ...(mergedFiles ? { what: mergedFiles } : {})
        },
        context.jwt,
        context.fetch
      );
    } else {
      await strapi.execute(
        '113createFinnishedMissionForTimerSave',
        {
          missionName: at.name,
          noofhours: hours,
          mesimabetahalich: mId,
          mission: at.mission?.data?.id,
          project: at.project?.data?.id,
          publishedAt: now.toISOString(),
          users_permissions_user: at.users_permissions_user?.data?.id,
          perhour: rate,
          total: hours * rate,
          why: saveText ? clampWhy(saveText) : 'timer save',
          ...(files.length ? { what: files } : {})
        },
        context.jwt,
        context.fetch
      );
    }

    await strapi.execute(
      '115updateMissionTotalHoursSaved',
      { id: mId, totalHoursSaved: (at.totalHoursSaved ?? 0) + hours },
      context.jwt,
      context.fetch
    );
    return { filed: 'finnishedMission' };
  }

  // Multi-user: a Finiapruval for the rikma to sign.
  const vots = [{ what: true, users_permissions_user: context.userId }];
  const finiRes = await strapi.execute(
    '111createFiniapruvalForTimer',
    {
      missname: at.name,
      noofhours: hours,
      mesimabetahalich: mId,
      project: at.project?.data?.id,
      publishedAt: now.toISOString(),
      users_permissions_user: at.users_permissions_user?.data?.id,
      vots,
      timer: timerId,
      month: approvalMonth(intervals),
      // Carried onto the approval so a vote that lands after the mission's
      // value changed still prices these hours correctly.
      perhour: rate,
      ...(saveText ? { why: clampWhy(saveText) } : {}),
      ...(files.length ? { what: files } : {})
    },
    context.jwt,
    context.fetch
  );

  const finiId = finiRes?.data?.createFiniapruval?.data?.id ?? null;
  if (finiId) {
    const restime = at.project?.data?.attributes?.restime ?? 'feh';
    const deadline = new Date(Date.now() + calcDeadlineMs(restime)).toISOString();
    await strapi.execute(
      '32createTimeGrama',
      { date: deadline, whatami: 'finiapruval', finiapruval: finiId },
      context.jwt,
      context.fetch
    );
  }
  return { filed: 'approval', finiapruvalId: finiId != null ? String(finiId) : null };
}
