/**
 * Keeping a lead in step with its task (docs/inprogress/PLAN_LEADS.md §3).
 *
 * Runs after every successful `updateTask`, fire-and-forget like the webhook
 * dispatcher: a lead that failed to follow must never fail the member's click
 * on the task. Cheap when it does not apply — one act read, and only acts
 * whose `externalId` is `lead:<id>` go further.
 */

import type { ActionContext } from '$lib/server/actions/types.js';
import { isEmptyEffect, leadEffectOfTask, leadIdOfTaskExternalId } from '$lib/leads/taskSync';
import { leadStore, loadLeadInProject, recordActivity, updateLead } from './store';

/** Does this update touch anything a lead follows? (assignment, acceptance, done) */
export function mayMoveLead(params: Record<string, any>): boolean {
  return (
    params.myIshur === true ||
    params.naasa === true ||
    params.isAssigned === false ||
    Array.isArray(params.uid)
  );
}

export async function syncLeadFromTask(opts: {
  params: Record<string, any>;
  context: ActionContext;
  strapi: { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };
}): Promise<void> {
  const { params, context, strapi } = opts;
  if (!mayMoveLead(params)) return;
  const actId = params?.id != null ? String(params.id) : '';
  const projectId = params?.projectId != null ? String(params.projectId) : '';
  if (!actId || !projectId) return;

  const store = leadStore(strapi as any, context.fetch);
  const res = await store.run('tasksApiActStatus', { id: actId });
  const act = res?.data?.act?.data;
  const leadId = leadIdOfTaskExternalId(act?.attributes?.externalId);
  if (!leadId) return;

  const lead = await loadLeadInProject(store, leadId, projectId);
  if (!lead) return;

  const a = act.attributes ?? {};
  const assignee = a.my?.data?.[0]?.id;
  const effect = leadEffectOfTask(
    { assigneeId: assignee != null ? String(assignee) : null, myIshur: !!a.myIshur, naasa: !!a.naasa },
    { status: lead.status, ownerId: lead.ownerId },
    context.userId ? String(context.userId) : null
  );
  if (isEmptyEffect(effect)) return;

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { lastActivityAt: now };
  if (effect.ownerId !== undefined) patch.owner = effect.ownerId;
  if (effect.status) patch.status = effect.status;
  await updateLead(store, lead.id, patch);

  for (const entry of effect.activities) {
    await recordActivity(store, {
      leadId: lead.id,
      kind: entry.kind,
      actorId: entry.actorId,
      ...(entry.kind === 'statusChange' ? { fromStatus: entry.fromStatus, toStatus: entry.toStatus } : {}),
      at: now
    });
  }
}
