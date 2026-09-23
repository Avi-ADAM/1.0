/**
 * Shifts and hours (docs/PLAN_SHIFTS.md §10). A shift is never hours by
 * itself: approved hours are what equity and the stipend are built on, and
 * booking them from a calendar would be exactly the typed-in hours the rikma
 * never signed. So the shift only *offers*:
 *
 *   linkShiftTimer — the member started the mission's ordinary timer from the
 *                    "your shift is starting" card (the client runs the same
 *                    start as the timer dial); this ties that timer to the
 *                    shift, so the card goes away and nothing asks twice.
 *   logShiftHours  — the shift ended and no timer ran. "Log N hours?" creates
 *                    a closed timer for the shift's span and saves it through
 *                    `timerSave` — the same path, the same approval
 *                    (finiapruval), the same stamped rate as any other hours.
 *                    "I didn't work it" releases the place instead, so the
 *                    fairness balance stops counting it as taken.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { shiftError } from '$lib/shifts/errors.js';
import { asUser, run } from '$lib/server/shifts/exec.js';
import { shiftsLive } from '$lib/server/shifts/mode.js';
import { loadAssignment, updateAssignment } from '$lib/server/shifts/store.js';

const skipped = (why: string) => ({ data: { skipped: true, reason: why }, updateStrategy: { type: 'none' as const } });

async function ownPlace(context: any, assignmentId: string) {
  const exec = asUser(context);
  const a = await loadAssignment(exec, assignmentId);
  if (!a || !a.shift) throw shiftError('notFound');
  if (String(a.userId) !== String(context.userId)) throw shiftError('notYours');
  if (a.rank !== 1 || a.state === 'released') throw shiftError('notOnShift');
  if (!a.mesimabetahalichId) throw shiftError('noMission');
  return { exec, a };
}

// ── linkShiftTimer ───────────────────────────────────────────────────────────

const linkShiftTimer: ActionExecutionHandler = async (params, context) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const { exec, a } = await ownPlace(context, String(params.assignmentId));
  if (a.timerId) return { data: { linked: true, timerId: a.timerId, already: true }, updateStrategy: { type: 'none' } };

  const d = await run(
    exec,
    `query ($id: ID!) { mesimabetahalich(id: $id) { data { attributes { activeTimer { data { id attributes {
      isActive users_permissions_user { data { id } } } } } } } } }`,
    'linkShiftTimer',
    { id: a.mesimabetahalichId }
  );
  const t = d?.mesimabetahalich?.data?.attributes?.activeTimer?.data;
  const owner = t?.attributes?.users_permissions_user?.data?.id;
  if (!t || !t.attributes?.isActive || String(owner) !== String(context.userId)) {
    return { data: { linked: false, reason: 'noRunningTimer' }, updateStrategy: { type: 'none' } };
  }
  await updateAssignment(exec, a.id, { timer: String(t.id) });
  return { data: { linked: true, timerId: String(t.id) }, updateStrategy: { type: 'none' } };
};

export const linkShiftTimerConfig: ActionConfig = {
  key: 'linkShiftTimer',
  description: "Tie the mission timer I just started to my shift, so the shift's cards know its hours are being recorded.",
  graphqlOperation: linkShiftTimer,
  paramSchema: { assignmentId: { type: 'string', required: true, description: 'My shift place' } },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── logShiftHours ────────────────────────────────────────────────────────────

const logShiftHours: ActionExecutionHandler = async (params, context) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const { exec, a } = await ownPlace(context, String(params.assignmentId));
  const shift = a.shift!;
  if (new Date(shift.end).getTime() > Date.now()) throw shiftError('notEnded');
  if (a.timerId) return { data: { logged: true, already: true }, updateStrategy: { type: 'none' } };
  if (a.state !== 'confirmed') throw shiftError('notConfirmed');

  if (params.worked === false) {
    await updateAssignment(exec, a.id, { state: 'released', releasedAt: new Date().toISOString(), releaseReason: 'notWorked' });
    return { data: { logged: false, released: true }, updateStrategy: { type: 'fullRefresh' } };
  }

  const m = await run(
    exec,
    `query ($id: ID!) { mesimabetahalich(id: $id) { data { attributes { perhour howmanyhoursalready project { data { id } } } } } }`,
    'logShiftHours:mission',
    { id: a.mesimabetahalichId }
  );
  const ma = m?.mesimabetahalich?.data?.attributes;
  if (!ma) throw shiftError('notFound');
  const projectId = String(ma.project?.data?.id ?? a.projectId ?? '');
  const hours = Math.round(((new Date(shift.end).getTime() - new Date(shift.start).getTime()) / 3_600_000) * 100) / 100;

  // A closed timer for exactly the shift's span, priced at the mission's value
  // now — the same stamp `timerStart` puts on a timer when the work starts.
  const created = await run(
    exec,
    `mutation ($data: TimerInput!) { createTimer(data: $data) { data { id } } }`,
    'logShiftHours:timer',
    {
      data: {
        mesimabetahalich: a.mesimabetahalichId,
        users_permissions_user: String(context.userId),
        project: projectId || null,
        start: shift.start,
        rate: ma.perhour ?? null,
        isActive: false,
        totalHours: hours,
        timers: [{ start: shift.start, stop: shift.end }]
      }
    }
  );
  const timerId = created?.createTimer?.data?.id ? String(created.createTimer.data.id) : null;
  if (!timerId) throw shiftError('saveFailed');
  await updateAssignment(exec, a.id, { timer: timerId });

  // The month counter moves only for hours that fall in this month — the same
  // rule the timer dialog applies (sessionHoursThisMonth).
  const now = new Date();
  const s = new Date(shift.start);
  const thisMonth = s.getUTCFullYear() === now.getUTCFullYear() && s.getUTCMonth() === now.getUTCMonth();
  const { actionService } = await import('$lib/server/actions/index.js');
  const saved = await actionService.executeAction(
    'timerSave',
    {
      missionId: a.mesimabetahalichId,
      timerId,
      projectId,
      userId: String(context.userId),
      sessionHoursTotal: hours,
      sessionHoursThisMonth: thisMonth ? hours : 0,
      howmanyhoursalready: Number(ma.howmanyhoursalready ?? 0) + (thisMonth ? hours : 0),
      saveText: params.note ? String(params.note).slice(0, 2000) : undefined
    },
    context
  );
  if (!saved?.success) throw new Error(saved?.error?.message ?? 'Saving the hours failed');
  await updateAssignment(exec, a.id, { state: 'done' });
  return { data: { logged: true, timerId, hours }, updateStrategy: { type: 'fullRefresh' } };
};

export const logShiftHoursConfig: ActionConfig = {
  key: 'logShiftHours',
  description: "Log a finished shift's hours in one tap (an ordinary record the rikma approves), or say it was not worked.",
  graphqlOperation: logShiftHours,
  paramSchema: {
    assignmentId: { type: 'string', required: true, description: 'My finished shift place' },
    worked: { type: 'boolean', required: false, description: 'false = I did not work it (releases the place); default true' },
    note: { type: 'string', required: false, description: 'What was done — carried to the approval like a timer note' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'fullRefresh' }
};
