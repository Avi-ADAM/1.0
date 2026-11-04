// src/lib/server/webhooks/leadEvents.ts
//
// What a site hears about the leads it sent (docs/inprogress/PLAN_LEADS.md §7.4):
//
//   lead.created        — createLead wrote a new lead (not a retry, not a repeat contact)
//   lead.statusChanged  — a member moved it, or logging the first contact did (data.status)
//   lead.won            — it became a customer (L3a: an order paid or a sale linked)
//
// Same delivery as the task and order webhooks (dispatch.ts: signed, retried,
// bounded), same rule that nothing here may fail or slow the action. The body
// is `{ leadId, externalId, status }` — never the person, never who owns it —
// and only a key with a leads scope hears it (`mayReceiveLead`).

import type { ActionContext } from '$lib/server/actions/types.js';
import {
  leadEventsFor,
  leadWebhookBody,
  mayReceiveLead,
  type LeadWebhookEvent
} from '$lib/server/leadsApi.js';
import { deliver } from './dispatch.js';
import { getWebhookTargets, wants } from './targets.js';

export const LEAD_WEBHOOK_ACTIONS = new Set(['createLead', 'updateLeadStatus', 'logLeadActivity']);

type Strapi = { execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any> };

/** Entry point called by ActionService after a successful lead action. */
export async function onLeadChanged(opts: {
  actionKey: string;
  params: Record<string, any>;
  result: any;
  context: ActionContext;
  strapi: Strapi;
}): Promise<void> {
  const { actionKey, params, result, context, strapi } = opts;
  if (!LEAD_WEBHOOK_ACTIONS.has(actionKey)) return;

  const events = leadEventsFor(actionKey, result);
  if (events.length === 0) return;

  const projectId = params?.projectId != null ? String(params.projectId) : '';
  if (!projectId) return;
  const fetchFn = context.fetch ?? globalThis.fetch;

  const targets = await getWebhookTargets(projectId, strapi, fetchFn);
  const forEvent = (event: LeadWebhookEvent) =>
    targets.filter((t) => wants(t, event) && mayReceiveLead(t.scopes));
  if (!events.some((e) => forEvent(e).length)) return;

  const r = result?.data ?? result ?? {};
  if (r.leadId == null) return;
  // createLead echoes its externalId; the others are read back so the site can
  // match the event to the enquiry it sent.
  let externalId: string | null = r.externalId ?? null;
  if (externalId == null && actionKey !== 'createLead') {
    try {
      const res = await strapi.execute('leadById', { id: String(r.leadId) }, undefined, fetchFn);
      externalId = res?.data?.lead?.data?.attributes?.externalId ?? null;
    } catch (e) {
      console.warn('[webhooks] could not read lead', r.leadId, e);
    }
  }
  const change = { leadId: String(r.leadId), externalId, status: String(r.status ?? 'new') };

  const sends: Promise<void>[] = [];
  for (const event of events) {
    const body = leadWebhookBody(event, projectId, change);
    const deliveryId = `lead-${change.leadId}-${event}-${Date.now()}`;
    for (const t of forEvent(event)) sends.push(deliver(t, body, event, deliveryId, fetchFn));
  }
  await Promise.all(sends);
}

/**
 * The money sync moved leads (moneySync.ts, L3a) — not an action of its own,
 * so it announces here: `lead.statusChanged` for every move, and `lead.won`
 * too when the lead became a customer.
 */
export async function announceLeadMoves(opts: {
  projectId: string;
  moved: Array<{ leadId: string; to: string }>;
  strapi: Strapi;
  fetchFn: typeof globalThis.fetch;
}): Promise<void> {
  const { projectId, moved, strapi, fetchFn } = opts;
  if (!moved.length) return;
  const targets = await getWebhookTargets(projectId, strapi, fetchFn);
  const forEvent = (event: LeadWebhookEvent) =>
    targets.filter((t) => wants(t, event) && mayReceiveLead(t.scopes));
  if (!forEvent('lead.statusChanged').length && !forEvent('lead.won').length) return;

  const sends: Promise<void>[] = [];
  for (const m of moved) {
    let externalId: string | null = null;
    try {
      const res = await strapi.execute('leadById', { id: m.leadId }, undefined, fetchFn);
      externalId = res?.data?.lead?.data?.attributes?.externalId ?? null;
    } catch (e) {
      console.warn('[webhooks] could not read lead', m.leadId, e);
    }
    const change = { leadId: m.leadId, externalId, status: m.to };
    const events: LeadWebhookEvent[] = m.to === 'won' ? ['lead.statusChanged', 'lead.won'] : ['lead.statusChanged'];
    for (const event of events) {
      const body = leadWebhookBody(event, projectId, change);
      const deliveryId = `lead-${m.leadId}-${event}-${Date.now()}`;
      for (const t of forEvent(event)) sends.push(deliver(t, body, event, deliveryId, fetchFn));
    }
  }
  await Promise.all(sends);
}
