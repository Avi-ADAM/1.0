/**
 * The shift actions behind the heart's cards (docs/PLAN_SHIFTS.md §7, §7.1, §7.2).
 *
 *   getShiftWork          — which cards I have (declare / my draft / holes)
 *   releaseShiftAssignment — I cannot come after all. Never blocked, never
 *                           penalised: the place goes back, the next person in
 *                           line is told at once, and the balance simply
 *                           stops counting it as mine.
 *   claimShiftHole        — "I'll take it". Allowed even beyond my agreed
 *                           maximum: a person may always choose to do more;
 *                           only the algorithm may not choose it for them.
 *   reopenForShiftHole    — "open the mission to one more candidate". Silence
 *                           at the cycle's close does the same (engine.ts);
 *                           this only makes it happen sooner.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { shiftError } from '$lib/shifts/errors.js';
import { asUser } from '$lib/server/shifts/exec.js';
import { shiftsEnabled, shiftsLive, shiftsMode } from '$lib/server/shifts/mode.js';
import { loadShiftWork, EMPTY_WORK } from '$lib/server/shifts/work.js';
import {
  createAssignment,
  loadAssignment,
  loadCommitments,
  loadPeriod,
  loadShift,
  loadWindow,
  markPeriodReopened,
  recruitOneMore,
  updateAssignment,
  upsertDeclaration
} from '$lib/server/shifts/store.js';
import { coverageOf, nextInLine } from '$lib/shifts/coverage.js';

const skipped = (why: string) => ({ data: { skipped: true, reason: why }, updateStrategy: { type: 'none' as const } });

// ── getShiftWork ─────────────────────────────────────────────────────────────

const getShiftWork: ActionExecutionHandler = async (_params, context) => {
  if (!shiftsEnabled()) return { data: EMPTY_WORK, updateStrategy: { type: 'none' } };
  const work = await loadShiftWork(asUser(context), String(context.userId), shiftsMode());
  return { data: work, updateStrategy: { type: 'none' } };
};

export const getShiftWorkConfig: ActionConfig = {
  key: 'getShiftWork',
  description: "The caller's shift cards: cycles to declare for, published drafts they are in, and coming holes.",
  graphqlOperation: getShiftWork,
  paramSchema: {},
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};

// ── releaseShiftAssignment ───────────────────────────────────────────────────

const releaseShiftAssignment: ActionExecutionHandler = async (params, context, { notifier }) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const exec = asUser(context);
  const a = await loadAssignment(exec, String(params.assignmentId));
  if (!a || !a.shift) throw shiftError('notFound');
  if (String(a.userId) !== String(context.userId)) {
    throw shiftError('notYours');
  }
  if (a.state === 'released') return { data: { released: true, already: true }, updateStrategy: { type: 'none' } };
  if (a.state === 'done' || new Date(a.shift.start).getTime() <= Date.now()) {
    throw shiftError('started');
  }

  const now = new Date().toISOString();
  const reason = params.reason ? String(params.reason).slice(0, 500) : undefined;
  await updateAssignment(exec, a.id, { state: 'released', releasedAt: now, ...(reason ? { releaseReason: reason } : {}) });

  // A backup leaving the chain changes nothing for the shift itself.
  let calledUserId: string | null = null;
  if (a.rank === 1 && a.planId) {
    const win = await loadWindow(exec, [a.planId], a.shift.start, new Date(new Date(a.shift.start).getTime() + 1).toISOString());
    const shift = win.shifts.find((s) => s.id === a.shift!.id);
    if (shift) {
      const next = nextInLine(coverageOf(shift, win.assignments.filter((x) => x.id !== a.id)));
      calledUserId = next ? String(next.userId) : null;
    }
  }

  if (calledUserId && notifier) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'התפנה מקום במשמרת — את/ה הבא/ה בתור', en: 'A shift place opened — you are next in line' },
            body: {
              he: 'מישהו שחרר משמרת שהיית בה בתור. אם את/ה יכול/ה להגיע — אפשר לקחת אותה מהלב בלחיצה אחת.',
              en: 'Someone released a shift you were in line for. If you can come, you can take it from the heart in one tap.'
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'shiftCall', url: 'lev', priority: 'high' }
        },
        { recipients: [calledUserId], projectId: a.projectId },
        { shiftId: a.shift.id },
        context
      )
      .catch((e: unknown) => console.warn('[releaseShiftAssignment] call notification failed:', e));
  }

  return { data: { released: true, calledUserId }, updateStrategy: { type: 'fullRefresh' } };
};

export const releaseShiftAssignmentConfig: ActionConfig = {
  key: 'releaseShiftAssignment',
  description: 'Release my own shift place. Never blocked; the next person in the backup chain is told at once.',
  graphqlOperation: releaseShiftAssignment,
  paramSchema: {
    assignmentId: { type: 'string', required: true, description: 'The shift-assignment to release — must be the caller’s own' },
    reason: { type: 'string', required: false, description: 'Optional note for the rikma' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'fullRefresh' }
};

// ── claimShiftHole ───────────────────────────────────────────────────────────

const claimShiftHole: ActionExecutionHandler = async (params, context) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const uid = String(context.userId);
  const exec = asUser(context);
  const ctx = await loadShift(exec, String(params.shiftId));
  if (!ctx) throw shiftError('notFound');
  const { shift } = ctx;
  if (shift.state === 'cancelled' || new Date(shift.start).getTime() <= Date.now()) {
    throw shiftError('notOpen');
  }
  if (!ctx.openMissionId) throw shiftError('noMission');
  const commitments = await loadCommitments(exec, ctx.openMissionId);
  const me = commitments.find((c) => c.userId === uid);
  if (!me) throw shiftError('notOnMission');

  const win = await loadWindow(exec, [ctx.planId], shift.start, new Date(new Date(shift.start).getTime() + 1).toISOString());
  const cov = coverageOf(shift, win.assignments);
  if (cov.missing <= 0) return { data: { claimed: false, reason: 'covered' }, updateStrategy: { type: 'fullRefresh' } };
  if (cov.coming.some((a) => String(a.userId) === uid)) {
    return { data: { claimed: false, reason: 'alreadyComing' }, updateStrategy: { type: 'none' } };
  }

  // One person, one place at a time: never two overlapping shifts.
  const span = [new Date(shift.start).getTime(), new Date(shift.end).getTime()];
  const around = await loadWindow(
    exec,
    [ctx.planId],
    new Date(span[0] - 86_400_000).toISOString(),
    new Date(span[1]).toISOString()
  );
  const clash = around.assignments.some((a) => {
    if (String(a.userId) !== uid || a.rank !== 1 || a.state === 'released') return false;
    const s = around.shifts.find((x) => x.id === a.shiftId);
    return !!s && new Date(s.start).getTime() < span[1] && span[0] < new Date(s.end).getTime();
  });
  if (clash) throw shiftError('clash');

  // Taking the shift is itself the statement of availability (§1.1).
  await upsertDeclaration(exec, { shiftId: shift.id, planId: ctx.planId, projectId: ctx.projectId, userId: uid, stance: 'want' });

  // Moving up from the backup chain: the old backup row steps aside.
  const myBackup = win.assignments.find((a) => String(a.userId) === uid && a.rank > 1 && a.state !== 'released');
  if (myBackup) await updateAssignment(exec, myBackup.id, { state: 'released', releasedAt: new Date().toISOString() });

  const released = win.assignments.find((a) => a.shiftId === shift.id && a.rank === 1 && a.state === 'released');
  const period = shift.periodId ? await loadPeriod(exec, shift.periodId) : null;
  const assignment = await createAssignment(exec, {
    shiftId: shift.id,
    userId: uid,
    rank: 1,
    state: period?.state === 'draft' ? 'draft' : 'confirmed',
    source: released ? 'cover' : 'volunteer',
    reason: released ? 'cover' : 'volunteered',
    periodId: shift.periodId,
    planId: ctx.planId,
    projectId: ctx.projectId,
    mesimabetahalichId: me.mesimabetahalichId,
    coveredForId: released?.id ?? null
  });
  return { data: { claimed: true, assignmentId: assignment.id }, updateStrategy: { type: 'fullRefresh' } };
};

export const claimShiftHoleConfig: ActionConfig = {
  key: 'claimShiftHole',
  description: '"I\'ll take it": a member on the mission takes a short shift. Allowed beyond their agreed maximum — by their own choice.',
  graphqlOperation: claimShiftHole,
  paramSchema: { shiftId: { type: 'string', required: true, description: 'The short shift' } },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'fullRefresh' }
};

// ── reopenForShiftHole ───────────────────────────────────────────────────────

const reopenForShiftHole: ActionExecutionHandler = async (params, context) => {
  if (!shiftsLive()) return skipped('SHIFTS is not on');
  const uid = String(context.userId);
  const exec = asUser(context);
  const period = await loadPeriod(exec, String(params.periodId));
  if (!period || !period.planId) throw shiftError('notFound');
  if ((period.quotaSnapshot as any)?.reopenedAt) {
    return { data: { reopened: false, already: true }, updateStrategy: { type: 'none' } };
  }
  const shiftCtx = params.shiftId ? await loadShift(exec, String(params.shiftId)) : null;
  const openMissionId = shiftCtx?.openMissionId;
  if (!openMissionId || shiftCtx?.planId !== period.planId) throw shiftError('wrongRoster');
  const onMission = (await loadCommitments(exec, openMissionId)).some((c) => c.userId === uid);
  if (!onMission) throw shiftError('notOnMission');

  const { howMeny } = await recruitOneMore(exec, openMissionId);
  await markPeriodReopened(exec, period, new Date().toISOString());
  return { data: { reopened: true, howMeny, openMissionId }, updateStrategy: { type: 'fullRefresh' } };
};

export const reopenForShiftHoleConfig: ActionConfig = {
  key: 'reopenForShiftHole',
  description: 'Open the mission to one more candidate because this cycle has holes. Once per cycle; silence at the close does the same.',
  graphqlOperation: reopenForShiftHole,
  paramSchema: {
    periodId: { type: 'string', required: true, description: 'The roster period with holes' },
    shiftId: { type: 'string', required: true, description: 'A short shift in it (ties the request to its mission)' }
  },
  authRules: [{ type: 'jwt' }],
  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: { he: 'המשימה נפתחת למועמד נוסף', en: 'The mission is open to one more candidate' },
      body: {
        he: 'במחזור המשמרות יש חורים שאף אחד לא יכול לכסות, ולכן המשימה חוזרת ללוח הפתוח לגיוס אדם נוסף.',
        en: 'The shift cycle has holes nobody can cover, so the mission is back on the open board to recruit one more person.'
      }
    },
    channels: ['socket'],
    metadata: { type: 'shiftReopen', url: 'lev' }
  },
  updateStrategy: { type: 'fullRefresh' }
};
