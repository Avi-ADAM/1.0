/**
 * The silence clock on a task's validation — docs/tbd/PLAN_AGENT_WORK.md, AW1 (ש1).
 *
 * "Done" hands a task to its validator. If they say nothing within the rikma's
 * restime, the task is validated: silence is consent, at the rikma's pace, as
 * in every other consent flow. Sending it back ("not yet", returnTask) is the
 * counter — it closes the clock, and the next "done" opens a new one, never
 * moves the old one (PLAN_TIMEGRAMA §6 rule 6).
 *
 * The clock is an `act` timegrama, the relation automatic acts already use for
 * their due-time reminders; `actClockMeaning` tells the two apart. Maturing
 * runs `updateTask` as the validator, so a silence and a click write the same
 * thing through the same path (rule 7).
 */

import { actClockMeaning, type ActClockMeaning } from '$lib/acts/agentTasks';
import { restimeToMs } from '$lib/server/actions/configs/saleClaimShared';
import { actValidatedBySilence } from '$lib/server/notifications/maturedNotices';
import type { MaturedNotice } from '$lib/server/notifications/matured';

type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

/** Close every open validation clock of the act. Returns how many were closed. */
export async function closeValidationClocks(run: Run, actId: string): Promise<number> {
  const res = await run('agentActOpenClocks', { act: actId });
  const ids: string[] = (res?.data?.timegramas?.data ?? []).map((t: any) => String(t.id));
  for (const id of ids) await run('agentClockClose', { id });
  return ids.length;
}

/** A fresh clock for this done report: due `restime` from now. Any older one is closed first. */
export async function armValidationClock(
  run: Run,
  actId: string,
  restime: string | null | undefined,
  now = Date.now()
): Promise<{ clockId: string | null; dueAt: string }> {
  await closeValidationClocks(run, actId);
  const dueAt = new Date(now + restimeToMs(restime)).toISOString();
  const res = await run('agentActClockCreate', { date: dueAt, act: actId });
  const id = res?.data?.createTimegrama?.data?.id;
  return { clockId: id != null ? String(id) : null, dueAt };
}

export type MatureOutcome = Exclude<ActClockMeaning, 'mature'> | 'validated' | 'failed';

/**
 * The clock came due. `reminder` means "not ours" — the dispatcher hands it to
 * the automatic-act reminder instead. Every other outcome but `failed` closes
 * the clock; `failed` leaves it for the next run.
 */
export async function matureActValidation(deps: {
  run: Run;
  actId: string;
  /** Runs an action as `userId` (the validator), with the service token. */
  runAction: (key: string, params: Record<string, unknown>, userId: string) => Promise<{ success: boolean; error?: any }>;
  tell: (notices: MaturedNotice[]) => Promise<void>;
}): Promise<MatureOutcome> {
  const res = await deps.run('agentActValidationState', { id: deps.actId });
  const a = res?.data?.act?.data?.attributes;
  const meaning = actClockMeaning({
    exists: !!a,
    automatic: !!a?.fulfillment_step?.data,
    naasa: a?.naasa === true,
    valiIshur: a?.valiIshur === true,
    hasValidator: a?.vali?.data?.id != null
  });
  if (meaning !== 'mature') return meaning;

  const projectId = String(a.project?.data?.id ?? '');
  const validatorId = String(a.vali.data.id);
  const r = await deps.runAction('updateTask', { id: deps.actId, projectId, valiIshur: true }, validatorId);
  if (!r.success) return 'failed';

  const doerIds = (a.my?.data ?? []).map((u: any) => String(u.id)).filter((id: string) => id !== validatorId);
  await deps.tell(
    actValidatedBySilence({ projectId, actId: deps.actId, name: String(a.shem ?? ''), doerIds, validatorId })
  );
  return 'validated';
}
