/**
 * The leads API (docs/inprogress/PLAN_LEADS.md §5, §7.3, §7.4) — what a site's
 * server may send and read back, and what a webhook says.
 *
 * The rule throughout: a person's contact details go IN and never come back
 * OUT. The status view and the webhook body carry the lead's id, its
 * `externalId` and its status — no name, no phone, no email, not who owns it.
 */

import { LEAD_SOURCES } from '$lib/leads/status';

export const LEADS_CREATE_SCOPE = 'leads:create';
export const LEADS_READ_SCOPE = 'leads:read';

/**
 * Sources a site's server may claim. Not `manual` (a member recording a phone
 * call — the only source that may skip consent) and not `demo` (the central
 * rikma's own form).
 */
export const API_LEAD_SOURCES = LEAD_SOURCES.filter((s) => s !== 'manual' && s !== 'demo');

export interface LeadStatusView {
  leadId: string;
  externalId: string | null;
  status: string;
  hasOwner: boolean;
  lastActivityAt: string | null;
}

export function toLeadStatusView(row: any): LeadStatusView | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  return {
    leadId: String(row.id),
    externalId: a.externalId ?? null,
    status: a.status ?? 'new',
    hasOwner: a.owner?.data?.id != null,
    lastActivityAt: a.lastActivityAt ?? null
  };
}

// ─── webhooks ───────────────────────────────────────────────────────────────

export const LEAD_WEBHOOK_EVENTS = ['lead.created', 'lead.statusChanged', 'lead.won'] as const;
export type LeadWebhookEvent = (typeof LEAD_WEBHOOK_EVENTS)[number];

/** Lead events go only to a key that deals in leads — a task desk never asked for them. */
export function mayReceiveLead(scopes: unknown): boolean {
  const s = Array.isArray(scopes) ? scopes.map(String) : [];
  return s.includes(LEADS_CREATE_SCOPE) || s.includes(LEADS_READ_SCOPE);
}

export interface LeadChange {
  leadId: string;
  externalId: string | null;
  status: string;
}

/**
 * Which events an action's run produced. A retry (`duplicated`) and a log entry
 * that did not move the status produce none. `lead.won` arrives with the
 * order/sale sync (L3a), the only place a lead becomes `won`.
 */
export function leadEventsFor(actionKey: string, result: any): LeadWebhookEvent[] {
  const r = result?.data ?? result ?? {};
  switch (actionKey) {
    case 'createLead':
      return r.duplicated ? [] : ['lead.created'];
    case 'updateLeadStatus':
      return ['lead.statusChanged'];
    case 'logLeadActivity':
      return r.statusChanged ? ['lead.statusChanged'] : [];
    default:
      return [];
  }
}

export function leadWebhookBody(
  event: LeadWebhookEvent,
  projectId: string,
  change: LeadChange,
  at = new Date().toISOString()
): string {
  return JSON.stringify({
    event,
    at,
    projectId,
    data: { leadId: change.leadId, externalId: change.externalId, status: change.status }
  });
}
