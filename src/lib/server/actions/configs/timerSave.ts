import type { ActionConfig } from '../types.js';
import { calcDeadlineMs } from './actionUtils.js';
import { touchDormancy } from '$lib/server/archive/dormancyClock.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { run } from '$lib/server/archive/gql.js';
import { pickRateRow, resolveRate, rowRate, type RateRow } from '$lib/timers/rate.js';
import { closeOpenIntervals, totalHours as hoursOfIntervals } from '$lib/timers/intervals.js';
import { workMonthOf } from '$lib/recurring/missionMonths.js';

/**
 * The timer as the server sees it, read before anything is written to it.
 *
 * `rate` is the hourly value stamped when the work started — what these hours
 * are worth, whatever the mission is worth now (src/lib/timers/rate.ts).
 * `saved` is the guard: a timer can be saved once. A client whose store went
 * stale — most plausibly because an approved change to the hourly value closed
 * this timer's books already (flushRateChange.ts) — would otherwise send the
 * same hours to approval a second time.
 */
async function readTimer(
    context: any,
    timerId: string,
): Promise<{
    rate: number | null;
    saved: boolean;
    intervals: { start: string; stop: string | null }[];
    totalHours: number;
} | null> {
    try {
        const data = await run(
            execFromContext(context),
            `{ timer(id: "${timerId}") { data { attributes { rate saved totalHours timers { start stop } } } } }`,
            'timerSave:timer',
        );
        const a = data?.timer?.data?.attributes;
        if (!a) return null;
        return {
            rate: a.rate == null ? null : Number(a.rate),
            saved: a.saved === true,
            intervals: (a.timers ?? []).map((s: any) => ({ start: s?.start, stop: s?.stop ?? null })),
            totalHours: Number(a.totalHours ?? 0) || 0,
        };
    } catch (e) {
        // Unreadable is not "already saved" — fall through to the legacy
        // behaviour rather than dropping the member's hours on the floor.
        console.warn('[timerSave] could not read the timer (non-fatal):', e);
        return null;
    }
}

/**
 * `why` on Finiapruval and FinnishedMission is a Strapi `string` — a 255-char
 * column. The timer's own `saveText` is richtext and keeps the note in full;
 * these copies are summaries, so trim them rather than let the write fail.
 * The newest note is the one that matters, so trimming eats the oldest lines.
 */
const WHY_MAX = 250;

function clampWhy(text: string): string {
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
function approvalMonth(intervals: { start?: string | null; stop?: string | null }[]): string {
  return workMonthOf(intervals) ?? todayDateString();
}

export const timerSaveConfig: ActionConfig = {
    key: 'timerSave',
    description: 'Save a timer and commit hours to mission, routing through approval or direct save',
    graphqlOperation: async (params, context, { strapi }) => {
        const mId = (params.missionId || params.mId)?.toString();
        const now = new Date();

        // The member's own account of what they did during this timer. It is
        // written on the timer itself (shown in the moach process timeline) and
        // carried into whatever the save produces — the approval vote or the
        // finished-mission row — so the rikma reads it wherever the hours land.
        const saveText: string = (params.saveText ?? '').toString().trim();

        // Step 0: read the timer before touching it — its stamped rate, and
        // whether it has already been saved.
        const hasTimer = Boolean(params.timerId && params.timerId !== '0');
        const timerBefore = hasTimer ? await readTimer(context, String(params.timerId)) : null;

        if (timerBefore?.saved) {
            console.log('[timerSave] timer already saved — refusing to book the same hours twice', {
                timerId: params.timerId,
                missionId: mId
            });
            return { success: true, missionId: mId, alreadySaved: true };
        }

        // The timer's own account of the work, closed. Saving used to write
        // `isActive: false, saved: true` without touching the intervals, so a
        // timer saved while it was still running kept an interval that nothing
        // would ever close — invisible to `totalHours`, but measured up to *now*
        // by every month-aware view, growing 24 hours a day. Closing it here is
        // also what makes these hours claimable: an open interval is worth zero
        // to the total the rikma is asked to sign.
        const closedIntervals = closeOpenIntervals(timerBefore?.intervals ?? []);
        const intervals = closedIntervals.intervals;
        if (closedIntervals.closed) {
            console.warn(
                `[timerSave] closed ${closedIntervals.closed} open interval(s) on timer ${params.timerId} before saving`
            );
        }

        // Step 1: Mark timer as saved, with its books closed.
        if (hasTimer) {
            await strapi.execute('34UpdateTimer', {
                timerId: params.timerId,
                isActive: false,
                saved: true,
                tasks: params.tasks || [],
                ...(intervals.length
                    ? { timers: intervals, totalHours: hoursOfIntervals(intervals) }
                    : {}),
                ...(saveText ? { saveText } : {})
            }, context.jwt, context.fetch);
        }

        // Step 2: Fetch mission data to determine single vs multi-user flow
        const missionRes = await strapi.execute('110getMissionForTimerSave', {
            mId
        }, context.jwt, context.fetch);

        const missionData = missionRes?.data?.mesimabetahalich?.data;
        if (!missionData) throw new Error(`Mission ${mId} not found`);

        const at = missionData.attributes;
        const userCount = at.project?.data?.attributes?.user_1s?.data?.length ?? 1;

        // What the rikma is asked to sign comes from the intervals on the
        // server's own copy of the timer, not from a number the client sent:
        // a counter that has drifted upward (a lap booked twice by a repeated
        // stop) must not be able to buy equity the intervals cannot account for.
        // A legacy timer with no interval components has nothing to derive from,
        // so it keeps the client's figure.
        const claimedHours: number = params.sessionHoursTotal ?? params.totalHours ?? 0;
        const derivedHours = intervals.length ? hoursOfIntervals(intervals) : null;
        if (derivedHours !== null && Math.abs(derivedHours - claimedHours) > 0.01) {
            console.warn('[timerSave] the claim disagrees with the intervals — filing the intervals', {
                timerId: params.timerId,
                claimed: claimedHours,
                derived: derivedHours,
                storedTotalHours: timerBefore?.totalHours
            });
        }
        const sessionHoursTotal: number = derivedHours ?? claimedHours;
        const newHowManyHours: number = params.howmanyhoursalready ?? (at.howmanyhoursalready ?? 0);

        // What these hours are worth: the value stamped on the timer when the
        // work started, not the mission's value now. Without this an approved
        // `editObject` re-prices every hour ever logged (src/lib/timers/rate.ts).
        const rate = resolveRate(timerBefore?.rate, at.perhour);

        const fmRows: RateRow[] = (at.finnished_missions?.data ?? []).map((fm: any) => ({
            id: String(fm.id),
            noofhours: Number(fm.attributes?.noofhours ?? 0),
            perhour: fm.attributes?.perhour == null ? null : Number(fm.attributes.perhour),
        }));

        // Step 3: Update mission monthly hours counter + clear activeTimer
        await strapi.execute('112updateMissionMonthlyHours', {
            id: mId,
            howmanyhoursalready: newHowManyHours,
            stname: params.stname || 'saved'
        }, context.jwt, context.fetch);

        if (userCount === 1) {
            // --- Single-user: directly write to FinnishedMission ---
            // One row per rate era: hours worked at the old value never land on
            // a row priced at the new one.
            const targetRow = pickRateRow(fmRows, rate);
            const existingFm = targetRow
                ? at.finnished_missions?.data?.find((fm: any) => String(fm.id) === targetRow.id)
                : null;

            if (existingFm && targetRow) {
                const newHours = (existingFm.attributes.noofhours ?? 0) + sessionHoursTotal;
                // The row accumulates sessions, so the notes accumulate too —
                // one line per save, oldest first, rather than the last one winning.
                const prevWhy: string = (existingFm.attributes.why ?? '').toString();
                const mergedWhy = saveText
                    ? (prevWhy && prevWhy !== 'timer save' ? `${prevWhy}\n${saveText}` : saveText)
                    : null;
                await strapi.execute('114updateFinnishedMissionHours', {
                    id: existingFm.id,
                    noofhours: newHours,
                    total: newHours * rowRate(targetRow, rate),
                    ...(mergedWhy ? { why: clampWhy(mergedWhy) } : {})
                }, context.jwt, context.fetch);
            } else {
                await strapi.execute('113createFinnishedMissionForTimerSave', {
                    missionName: at.name,
                    noofhours: sessionHoursTotal,
                    mesimabetahalich: mId,
                    mission: at.mission?.data?.id,
                    project: at.project?.data?.id,
                    publishedAt: now.toISOString(),
                    users_permissions_user: at.users_permissions_user?.data?.id,
                    perhour: rate,
                    total: sessionHoursTotal * rate,
                    why: saveText ? clampWhy(saveText) : 'timer save'
                }, context.jwt, context.fetch);
            }

            await strapi.execute('115updateMissionTotalHoursSaved', {
                id: mId,
                totalHoursSaved: (at.totalHoursSaved ?? 0) + sessionHoursTotal
            }, context.jwt, context.fetch);

        } else {
            // --- Multi-user: create Finiapruval for approval vote ---
            const vots = [{ what: true, users_permissions_user: context.userId }];

            const finiRes = await strapi.execute('111createFiniapruvalForTimer', {
                missname: at.name,
                noofhours: sessionHoursTotal,
                mesimabetahalich: mId,
                project: at.project?.data?.id,
                publishedAt: now.toISOString(),
                users_permissions_user: at.users_permissions_user?.data?.id,
                vots,
                timer: hasTimer ? params.timerId : undefined,
                month: approvalMonth(intervals),
                // Carried onto the approval so a vote that lands after the
                // mission's value changed still prices these hours correctly.
                perhour: rate,
                ...(saveText ? { why: clampWhy(saveText) } : {})
            }, context.jwt, context.fetch);

            const finiId = finiRes?.data?.createFiniapruval?.data?.id;

            if (finiId) {
                const restime = at.project?.data?.attributes?.restime ?? 'feh';
                const deadline = new Date(Date.now() + calcDeadlineMs(restime)).toISOString();
                await strapi.execute('32createTimeGrama', {
                    date: deadline,
                    whatami: 'finiapruval',
                    finiapruval: finiId
                }, context.jwt, context.fetch);
            }
        }

        // Logged hours mean the mission is alive (PLAN_OBJECT_ARCHIVAL).
        await touchDormancy(execFromContext(context), String(mId)).catch(() => null);

        return { success: true, missionId: mId };
    },

    paramSchema: {
        missionId: { type: 'string', required: true, description: 'Mission ID' },
        mId: { type: 'string', required: false, description: 'Alias for missionId' },
        timerId: { type: 'string', required: false, description: 'ID of the timer to save' },
        projectId: { type: 'string', required: true, description: 'Project ID' },
        userId: { type: 'string', required: true, description: 'User ID' },
        sessionHoursTotal: { type: 'number', required: false, description: 'Total hours from this timer session' },
        sessionHoursThisMonth: { type: 'number', required: false, description: 'Hours from this session that fall in current month' },
        howmanyhoursalready: { type: 'number', required: false, description: 'New monthly hours total (currentHours + sessionHoursThisMonth)' },
        totalHours: { type: 'number', required: false, description: 'Fallback total hours' },
        stname: { type: 'string', required: false, description: 'Status name' },
        saveText: { type: 'string', required: false, description: 'Short description of what was done during this timer' },
        x: { type: 'number', required: false, description: 'Legacy timer value (unused)' },
        tasks: { type: 'array', required: false, description: 'Task IDs to link to the timer' }
    },

    authRules: [
        { type: 'jwt', errorMessage: 'You must be logged in to save timers' },
        {
            type: 'projectMember',
            config: { projectIdParam: 'projectId' },
            errorMessage: 'You must be a member of this project to save timers'
        }
    ],

    notification: {
        recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: false }
        },
        templates: {
            title: { he: 'טיימר נשמר', en: 'Timer Saved', ar: 'تم حفظ المؤقت' },
            body: { he: 'השעות נוספו למשימה בהצלחה', en: 'Hours have been added to the mission', ar: 'تمت إضافة الساعات إلى المهمة' }
        },
        channels: ['socket', 'push'],
        metadata: { priority: 'normal', type: 'timerUpdate', url: '/lev?project={{projectId}}', originClientId: '{{originClientId}}' }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: { dataKeys: ['timers', 'missions'], updateFunction: 'refreshTimers' }
    }
};
