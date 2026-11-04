/**
 * Merge Leads (docs/inprogress/PLAN_LEADS.md §2.4, L5) — the same person wrote
 * twice and the contact match did not catch it (a new phone and a new email).
 * A member folds the duplicate into the lead that stays.
 *
 * Nothing is deleted (`$lib/leads/merge`): the duplicate becomes `spam`
 * ("spam / duplicate", §2.1) with its log intact and a line saying where it
 * went; its orders and products move over, and the stage of the kept lead is
 * recomputed from the money now linked to it. The duplicate's task is marked
 * done so nobody keeps answering a lead that no longer exists on its own.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { MERGED_FROM, MERGED_INTO, mergedKeepPatch, mergeRefusal, type MergeSide } from '$lib/leads/merge';
import { syncedStatus } from '$lib/leads/stage';
import { leadStore, recordActivity, updateLead, type LeadStore } from '$lib/server/leads/store';

const REFUSAL_MESSAGE: Record<string, string> = {
  SAME_LEAD: 'A lead cannot be merged into itself',
  ANONYMIZED: 'An anonymized lead cannot be merged',
  ALREADY_MERGED: 'That lead was itself put away as a duplicate — merge into the one it went to'
};

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

interface LoadedSide extends MergeSide {
  projectId: string | null;
  actId: string | null;
  orderStatuses: string[];
}

async function loadSide(store: LeadStore, id: string): Promise<LoadedSide | null> {
  const res = await store.run('leadMergeSide', { id });
  const node = res?.data?.lead?.data;
  const a = node?.attributes;
  if (!a) return null;
  const orders = (a.orders?.data ?? []) as any[];
  return {
    id: String(node.id),
    projectId: a.project?.data?.id != null ? String(a.project.data.id) : null,
    actId: a.act?.data?.id != null ? String(a.act.data.id) : null,
    status: str(a.status) ?? 'new',
    email: str(a.email),
    phone: str(a.phone),
    organization: str(a.organization),
    city: str(a.city),
    address: str(a.address),
    message: str(a.message),
    nextAction: str(a.nextAction),
    followUpAt: str(a.followUpAt),
    lastActivityAt: str(a.lastActivityAt),
    dedupeKey: str(a.dedupeKey),
    anonymizedAt: str(a.anonymizedAt),
    orderIds: orders.map((o) => String(o.id)),
    orderStatuses: orders.map((o) => String(o?.attributes?.status ?? '')),
    productIds: ((a.products?.data ?? []) as any[]).map((p) => String(p.id))
  };
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const store = leadStore(strapi, context.fetch);
  const [keep, dup] = await Promise.all([loadSide(store, String(params.keepId)), loadSide(store, String(params.mergeId))]);
  if (!keep || keep.projectId !== projectId || !dup || dup.projectId !== projectId) {
    throw new ActionError('NOT_FOUND', 'Both leads must be in this rikma');
  }
  const refusal = mergeRefusal(keep, dup);
  if (refusal) throw new ActionError('VALIDATION_FAILED', REFUSAL_MESSAGE[refusal]);

  const now = new Date().toISOString();
  const patch = mergedKeepPatch(keep, dup);
  // The money that came with the duplicate speaks for the kept lead too.
  const statusOfOrder = new Map<string, string>();
  dup.orderIds.forEach((id, i) => statusOfOrder.set(id, dup.orderStatuses[i]));
  keep.orderIds.forEach((id, i) => statusOfOrder.set(id, keep.orderStatuses[i]));
  const next = syncedStatus({ status: keep.status }, { orderStatuses: [...statusOfOrder.values()] });
  if (next) patch.status = next;
  if (Object.keys(patch).length) await updateLead(store, keep.id, patch);

  // The duplicate keeps its log; it lets go of what moved, and is put away.
  await updateLead(store, dup.id, { status: 'spam', orders: [], lastActivityAt: now });

  await recordActivity(store, { leadId: keep.id, kind: 'system', body: `${MERGED_FROM}${dup.id}`, actorId: context.userId, at: now });
  if (next) {
    await recordActivity(store, { leadId: keep.id, kind: 'statusChange', fromStatus: keep.status, toStatus: next, at: now });
  }
  await recordActivity(store, {
    leadId: dup.id,
    kind: 'statusChange',
    fromStatus: dup.status,
    toStatus: 'spam',
    actorId: context.userId,
    at: now
  });
  await recordActivity(store, { leadId: dup.id, kind: 'system', body: `${MERGED_INTO}${keep.id}`, actorId: context.userId, at: now });

  // Best effort: the duplicate's task is done — nobody should keep answering it.
  const warnings: string[] = [];
  if (dup.actId) {
    try {
      const { actionService } = await import('../index.js');
      const r = await actionService.executeAction('updateTask', { id: dup.actId, projectId, naasa: true }, context);
      if (!r?.success) warnings.push('TASK_NOT_CLOSED');
    } catch {
      warnings.push('TASK_NOT_CLOSED');
    }
  }

  return { keepId: keep.id, mergedId: dup.id, status: next ?? keep.status, movedOrders: dup.orderIds.length, warnings };
};

export const mergeLeadsConfig: ActionConfig = {
  key: 'mergeLeads',
  description: 'Fold a duplicate lead into the one that stays (nothing is deleted)',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    keepId: { type: 'string', required: true, description: 'The lead that stays' },
    mergeId: { type: 'string', required: true, description: 'The duplicate folded into it' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only the rikma's members work its leads"
    }
  ],

  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId)])
  }
};
