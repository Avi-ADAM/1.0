/**
 * Tasks that wait on the viewer, as notices — docs/tbd/PLAN_AGENT_WORK.md AW1 (F2).
 *
 * Two of a task's lanes wait on one person, and only those become a notice:
 *   approve  — it was handed to them and waits for their yes;
 *   validate — its doer says it is done, and it waits for them to check it.
 *     The silence clock runs on this one (validationClock.ts), so the notice
 *     carries its deadline and says silence approves it.
 * A task merely open to a role waits on nobody in particular — it is in
 * listMyTasks, not here.
 */

import { k, type Notice } from './types';
import { nextStepFor, type TaskRow } from '$lib/acts/agentTasks';
import { isUrgent } from '$lib/digest/hubSummary.js';

export function taskNotices(tasks: TaskRow[], uid: string, now: number = Date.now()): Notice[] {
  const out: Notice[] = [];
  for (const t of tasks) {
    if (!t.project) continue;
    const step = nextStepFor(t, uid);
    if (step !== 'approve' && step !== 'validate') continue;
    const where = { kind: 'rikma' as const, id: t.project.id, name: t.project.name };
    const href = `/moach/${t.project.id}/acts/${t.id}`;
    const deadline = step === 'validate' ? t.clockDueAt : null;
    out.push({
      // A new done report after a "not yet" is a new clock, so a new key: hiding
      // the first check does not hide the second.
      key: step === 'validate' ? `task:validate:${t.id}:${deadline ?? ''}` : `task:approve:${t.id}`,
      subject: `task:${t.id}`,
      source: 'lev',
      kind: 'task',
      sentence: k(step === 'validate' ? 'notices.task.validate' : 'notices.task.approve', { item: t.name }),
      detail: null,
      terms: [],
      where,
      deadline,
      urgent: deadline ? isUrgent(deadline, now) : t.urgency === 'red',
      clockRuns: !!deadline,
      approve: null,
      expand: { kind: 'href', href },
      at: t.updatedAt
    });
  }
  return out;
}
